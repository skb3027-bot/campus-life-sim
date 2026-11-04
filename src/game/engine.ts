import type { ActivityDef, CharId, Choice, Condition, Effect, EventDef, GameState, StatKey } from './types'
import {
  RULES,
  applyWeeklyCap,
  calcRelChange,
  clamp,
  firstImpressionH,
  preferenceScore,
  roundHalfUp,
  statGrowthCoef,
  wealthFromMoney,
} from './rules'
import { CHARACTERS, CHAR_IDS } from '../data/characters'
import { ACTIVITIES, activityById } from '../data/activities'
import { EVENTS } from '../data/events'

export const SAVE_VERSION = 1

export const STAT_LABEL: Record<StatKey, string> = {
  looks: '외모',
  personality: '성격',
  fashion: '패션',
  wealth: '재력',
  academics: '학업',
  popularity: '인기',
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)

export function newGame(): GameState {
  const rels = Object.fromEntries(
    CHAR_IDS.map((id) => {
      const init = CHARACTERS[id].initial
      return [id, init ? { met: true, h: init.h, t: init.t } : { met: false, h: 0, t: 0 }]
    }),
  ) as GameState['rels']
  return {
    version: SAVE_VERSION,
    week: 1,
    phase: 'plan',
    stats: {
      looks: 30,
      personality: 40,
      fashion: 20,
      wealth: wealthFromMoney(RULES.startMoney),
      academics: 45,
      popularity: 10,
    },
    mental: RULES.startMental,
    energy: RULES.baseEnergy,
    maxEnergy: RULES.baseEnergy,
    money: RULES.startMoney,
    rels,
    flags: [],
    vars: {},
    firedEvents: [],
    eventQueue: [],
    reservations: [],
    weeklyGain: {},
    weeklyRepeat: {},
    weeklyMentalRecovered: 0,
    forcedRest: false,
    hairUntil: 0,
    log: [{ week: 1, text: '군 전역 후 2학년으로 복학했다. 강의실에 아는 얼굴은 하나도 없다.' }],
  }
}

const clone = (s: GameState): GameState => structuredClone(s)
const hasFlag = (s: GameState, f: string) => s.flags.includes(f)
const getVar = (s: GameState, k: string) => s.vars[k] ?? 0

export function check(s: GameState, c: Condition | undefined): boolean {
  if (!c) return true
  if ('flag' in c) return hasFlag(s, c.flag)
  if ('notFlag' in c) return !hasFlag(s, c.notFlag)
  if ('stat' in c) {
    const v = s.stats[c.stat]
    return (c.min === undefined || v >= c.min) && (c.max === undefined || v <= c.max)
  }
  if ('mental' in c) {
    const { min, max } = c.mental
    return (min === undefined || s.mental >= min) && (max === undefined || s.mental <= max)
  }
  if ('rel' in c) {
    const r = s.rels[c.rel]
    if (c.met !== undefined && r.met !== c.met) return false
    if (c.h !== undefined && r.h < c.h) return false
    if (c.t !== undefined && r.t < c.t) return false
    if (c.tBelow !== undefined && r.t >= c.tBelow) return false
    return true
  }
  if ('varName' in c) {
    const v = getVar(s, c.varName)
    return (c.min === undefined || v >= c.min) && (c.max === undefined || v <= c.max)
  }
  if ('money' in c) return s.money >= c.money
  if ('energyAfter' in c) return s.energy - c.energyAfter.cost >= c.energyAfter.min
  if ('any' in c) return c.any.some((x) => check(s, x))
  if ('all' in c) return c.all.every((x) => check(s, x))
  return false
}

function changeStat(s: GameState, stat: StatKey, delta: number, out: string[]) {
  let d = delta
  if (d > 0) d = roundHalfUp(d * statGrowthCoef(s.mental))
  const before = s.stats[stat]
  s.stats[stat] = clamp(before + d)
  const real = s.stats[stat] - before
  if (real !== 0) {
    out.push(`${STAT_LABEL[stat]} ${signed(real)}`)
    if (real > 0 && (stat === 'looks' || stat === 'fashion')) s.vars.glowup = getVar(s, 'glowup') + real
  }
}

function changeMoney(s: GameState, delta: number, out: string[]) {
  if (delta === 0) return
  s.money += delta
  out.push(`돈 ${delta > 0 ? '+' : '-'}${won(Math.abs(delta))}`)
  s.stats.wealth = wealthFromMoney(s.money)
}

function changeRel(
  s: GameState,
  e: Extract<Effect, { rel: CharId }>,
  out: string[],
) {
  const r = s.rels[e.rel]
  if (!r.met) return
  const name = CHARACTERS[e.rel].name
  let dh = e.h ?? 0
  let dt = e.t ?? 0
  if (!e.narrative) {
    let nth = 1
    if (e.group) {
      const key = `${e.rel}:${e.group}`
      nth = (s.weeklyRepeat[key] ?? 0) + 1
      s.weeklyRepeat[key] = nth
    }
    const calc = calcRelChange({
      baseH: dh,
      baseT: dt,
      prefScore: preferenceScore(s.stats, e.rel),
      mental: s.mental,
      nth,
    })
    const gained = s.weeklyGain[e.rel] ?? { h: 0, t: 0 }
    dh = applyWeeklyCap(calc.h, gained.h)
    dt = applyWeeklyCap(calc.t, gained.t)
    s.weeklyGain[e.rel] = { h: gained.h + Math.max(0, dh), t: gained.t + Math.max(0, dt) }
  }
  const h0 = r.h
  const t0 = r.t
  r.h = clamp(r.h + dh)
  r.t = clamp(r.t + dt)
  const parts: string[] = []
  if (r.h !== h0) parts.push(`호감 ${signed(r.h - h0)}`)
  if (r.t !== t0) parts.push(`신뢰 ${signed(r.t - t0)}`)
  if (parts.length) out.push(`${name} ${parts.join(' · ')}`)
  else if ((e.h ?? 0) > 0 || (e.t ?? 0) > 0) out.push(`${name} 변화 없음 (이번 주 상한·반복)`)
}

function changeMental(s: GameState, delta: number, out: string[]) {
  const before = s.mental
  s.mental = clamp(s.mental + delta)
  if (s.mental !== before) out.push(`멘탈 ${signed(s.mental - before)}`)
}

export function applyEffects(s: GameState, effects: Effect[] | undefined, out: string[]) {
  for (const e of effects ?? []) {
    if ('if' in e) {
      applyEffects(s, check(s, e.if) ? e.then : e.else, out)
    } else if ('stat' in e) changeStat(s, e.stat, e.delta, out)
    else if ('mental' in e) changeMental(s, e.mental, out)
    else if ('money' in e) changeMoney(s, e.money, out)
    else if ('energy' in e) {
      s.energy += e.energy
      if (e.energy) out.push(`체력 ${signed(e.energy)}`)
    } else if ('rel' in e) changeRel(s, e, out)
    else if ('meet' in e) {
      const r = s.rels[e.meet]
      if (!r.met) {
        r.met = true
        r.h = firstImpressionH(s.stats)
        r.t = 10
        out.push(`${CHARACTERS[e.meet].name}와(과) 처음 만남 (첫인상 호감 ${r.h})`)
      }
    } else if ('setFlag' in e) {
      if (!hasFlag(s, e.setFlag)) s.flags.push(e.setFlag)
    } else if ('clearFlag' in e) s.flags = s.flags.filter((f) => f !== e.clearFlag)
    else if ('addVar' in e) s.vars[e.addVar] = getVar(s, e.addVar) + e.delta
    else if ('reserveEnergy' in e) {
      s.reservations.push({ key: e.reserveEnergy.key, week: e.reserveEnergy.week, amount: e.reserveEnergy.amount })
      out.push(`${e.reserveEnergy.week}주 체력 ${e.reserveEnergy.amount} 예약`)
    } else if ('releaseReservation' in e) s.reservations = s.reservations.filter((r) => r.key !== e.releaseReservation)
    else if ('log' in e) s.log.push({ week: s.week, text: e.log })
    else if ('special' in e) applySpecial(s, e.special, out)
  }
}

function applySpecial(s: GameState, kind: 'hair' | 'clothes' | 'recovery', out: string[]) {
  if (kind === 'hair') {
    if (s.hairUntil <= s.week) {
      const before = s.stats.looks
      changeStat(s, 'looks', 5, out)
      s.vars.hairBoost = s.stats.looks - before
    } else out.push('미용실 효과 연장')
    s.hairUntil = s.week + 4
  } else if (kind === 'clothes') {
    const n = getVar(s, 'clothesBought')
    const gain = [8, 4][n] ?? 0
    s.vars.clothesBought = n + 1
    if (gain) changeStat(s, 'fashion', gain, out)
    else out.push('비슷한 옷이 이미 많다 (패션 변화 없음)')
  } else {
    changeMental(s, RULES.recoveryWeekMental, out)
  }
}

/* ───────── 주간 계획 ───────── */

export const reservedEnergy = (s: GameState) =>
  s.reservations.filter((r) => r.week === s.week).reduce((a, r) => a + r.amount, 0)

export const isRestWeek = (s: GameState) => s.forcedRest

const REST_WEEK_ALLOWED = new Set(['meal', 'rest', 'hobby'])

export function activityAvailable(s: GameState, a: ActivityDef) {
  if (isRestWeek(s) && !REST_WEEK_ALLOWED.has(a.id)) return false
  return check(s, a.requires)
}

export interface PlanCheck {
  ok: boolean
  energyAfter: number
  moneyAfter: number
  overwork: boolean
  reason?: string
}

export function checkPlan(s: GameState, ids: string[]): PlanCheck {
  const acts = ids.map(activityById)
  const energyCost = acts.reduce((a, x) => a + x.energy, 0)
  const moneyCost = acts.reduce((a, x) => a + (x.cost ?? 0), 0)
  const energyAfter = s.energy - reservedEnergy(s) - energyCost
  const moneyAfter = s.money - moneyCost
  const floor = isRestWeek(s) ? 0 : RULES.overworkFloor
  const counts = new Map<string, number>()
  for (const a of acts) counts.set(a.id, (counts.get(a.id) ?? 0) + 1)
  let reason: string | undefined
  if (acts.some((a) => a.exclusive) && acts.length > 1) reason = '회복 주간에는 다른 활동을 할 수 없어요'
  else if ([...counts].some(([id, n]) => n > activityById(id).perWeek)) reason = '주간 횟수를 넘었어요'
  else if (acts.some((a) => !activityAvailable(s, a))) reason = '지금은 할 수 없는 활동이 있어요'
  else if (moneyAfter < 0) reason = '돈이 부족해요'
  else if (energyAfter < floor) reason = isRestWeek(s) ? '회복 중이라 무리할 수 없어요' : '체력이 너무 부족해요 (최대 -3까지 무리 가능)'
  return { ok: !reason, energyAfter, moneyAfter, overwork: energyAfter < 0, reason }
}

export interface WeekOutcome {
  state: GameState
  activityChanges: string[]
}

export function runWeek(prev: GameState, ids: string[]): WeekOutcome {
  const check0 = checkPlan(prev, ids)
  if (!check0.ok) throw new Error(check0.reason)
  const s = clone(prev)
  const out: string[] = []
  const nth = new Map<string, number>()
  for (const id of ids) {
    const a = activityById(id)
    const n = (nth.get(id) ?? 0) + 1
    nth.set(id, n)
    s.energy -= a.energy
    if (a.cost) changeMoney(s, -a.cost, out)
    if (a.mentalRecovery) {
      const want = a.mentalRecovery[n - 1] ?? 0
      const room = RULES.weeklyMentalRecoveryCap - s.weeklyMentalRecovered
      const amt = Math.max(0, Math.min(want, room))
      s.weeklyMentalRecovered += amt
      changeMental(s, amt, out)
    }
    applyEffects(s, a.effects, out)
  }
  if (isRestWeek(s)) changeMental(s, 10, out)
  if (ids.length) s.log.push({ week: s.week, text: `이번 주: ${ids.map((i) => activityById(i).name).join(', ')}` })
  s.phase = 'event'
  return { state: advanceEvent(s), activityChanges: out }
}

/* ───────── 사건 ───────── */

export const eventById = (id: string) => {
  const e = EVENTS.find((x) => x.id === id)
  if (!e) throw new Error(`unknown event ${id}`)
  return e
}

export function eligibleEvents(s: GameState): EventDef[] {
  return EVENTS.filter(
    (e) =>
      !s.firedEvents.includes(e.id) &&
      s.week >= e.week.from &&
      s.week <= (e.week.to ?? e.week.from) &&
      check(s, e.when),
  ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export const currentEvent = (s: GameState): EventDef | undefined =>
  s.eventQueue[0] ? eventById(s.eventQueue[0]) : undefined

/** 다음 사건을 꺼내거나, 없으면 주를 마감한다 */
function advanceEvent(s: GameState): GameState {
  const next = eligibleEvents(s)[0]
  if (next) {
    s.eventQueue = [next.id]
    s.phase = 'event'
    const out: string[] = []
    applyEffects(s, next.onEnter, out)
    s.lastEnterChanges = out
    return s
  }
  s.eventQueue = []
  return endWeek(s)
}

export const choiceVisible = (s: GameState, c: Choice) => c.showLocked || check(s, c.requires)
export const choiceEnabled = (s: GameState, c: Choice) => check(s, c.requires)

export function choose(prev: GameState, choiceId: string): GameState {
  const ev = currentEvent(prev)
  if (!ev) throw new Error('no current event')
  const choice = ev.choices.find((c) => c.id === choiceId)
  if (!choice) throw new Error(`unknown choice ${choiceId}`)
  if (!choiceEnabled(prev, choice)) throw new Error('choice locked')
  const s = clone(prev)
  const out = [...(s.lastEnterChanges ?? [])]
  applyEffects(s, choice.effects, out)
  s.firedEvents.push(ev.id)
  s.log.push({ week: s.week, text: `${ev.title} — ${choice.text}` })
  s.lastResult = { title: ev.title, reaction: choice.reaction, changes: out }
  s.lastEnterChanges = []
  return advanceEvent(s)
}

/* ───────── 주 마감 ───────── */

export function endWeek(s: GameState): GameState {
  const out: string[] = []
  const pay = getVar(s, 'pendingPay')
  if (pay) changeMoney(s, pay, out)
  s.vars.pendingPay = 0
  changeMoney(s, RULES.allowance, out)

  const overworked = s.energy < 0 && !s.forcedRest
  s.reservations = s.reservations.filter((r) => r.week > s.week)
  s.weeklyGain = {}
  s.weeklyRepeat = {}
  s.weeklyMentalRecovered = 0
  s.week += 1

  if (s.vars.hairBoost && s.hairUntil <= s.week) {
    changeStat(s, 'looks', -s.vars.hairBoost, out)
    s.vars.hairBoost = 0
    s.log.push({ week: s.week, text: '미용실 다녀온 지 한 달. 머리가 다시 덥수룩해졌다.' })
  }
  s.maxEnergy = Math.min(RULES.maxEnergyCap, RULES.baseEnergy + Math.floor(getVar(s, 'exercise') / RULES.exercisePerEnergy))
  s.forcedRest = overworked
  s.energy = overworked ? Math.floor(s.maxEnergy / 2) : s.maxEnergy
  if (overworked) s.log.push({ week: s.week, text: '지난주 무리한 탓에 몸살이 났다. 이번 주는 회복 주간.' })
  s.phase = s.week > RULES.seasonWeeks ? 'season_end' : 'plan'
  s.lastWeekChanges = out
  return s
}

export const allActivities = () => ACTIVITIES

/* ───────── 저장 ───────── */

const SAVE_KEY = 'campus-life-sim:save'

export function save(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s))
  } catch {
    /* 저장 불가 환경은 무시 */
  }
}

export function load(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as GameState
    return s.version === SAVE_VERSION ? s : null
  } catch {
    return null
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* noop */
  }
}
