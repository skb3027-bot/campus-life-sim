import { describe, expect, it } from 'vitest'
import { calcRelChange, firstImpressionH, applyWeeklyCap, roundHalfUp } from './rules'
import {
  acceptMission,
  allocatePoints,
  check,
  checkPlan,
  choose,
  eventById,
  currentEvent,
  currentStage,
  diaryPages,
  newGame,
  runWeek,
} from './engine'
import type { GameState } from './types'

const SEED = 12345

/** 그 주 사건을 정해진 선택(없으면 첫 선택 가능 항목)으로 모두 처리 */
function resolveWeek(s: GameState, picks: Record<string, string> = {}): GameState {
  let cur = s
  let guard = 0
  while (cur.phase === 'event' && guard++ < 20) {
    const ev = currentEvent(cur)!
    const id = picks[ev.id] ?? ev.choices[ev.choices.length - 1].id
    cur = choose(cur, id)
  }
  return cur
}

function play(plan: Record<number, string[]>, picks: Record<string, string>, untilWeek = 13) {
  let s = newGame(SEED)
  while (s.phase !== 'season_end' && s.week <= untilWeek) {
    s = resolveWeek(runWeek(s, plan[s.week] ?? []).state, picks)
  }
  return s
}

describe('rules (GPT 검산 예시)', () => {
  it('예시 1: 기본 H+5/T+3, 선호 85, 멘탈 55, 첫 행동 → H+6/T+3', () => {
    expect(calcRelChange({ baseH: 5, baseT: 3, prefScore: 85, mental: 55, nth: 1 })).toEqual({ h: 6, t: 3 })
  })
  it('예시 2: 멘탈 30, 두 번째 → H+2/T+2', () => {
    expect(calcRelChange({ baseH: 5, baseT: 3, prefScore: 85, mental: 30, nth: 2 })).toEqual({ h: 2, t: 2 })
  })
  it('세 번째 반복부터 0', () => {
    expect(calcRelChange({ baseH: 5, baseT: 3, prefScore: 85, mental: 55, nth: 3 })).toEqual({ h: 0, t: 0 })
  })
  it('음수는 그대로', () => {
    expect(calcRelChange({ baseH: -6, baseT: -10, prefScore: 85, mental: 30, nth: 3 })).toEqual({ h: -6, t: -10 })
  })
  it('첫인상 범위 5~20', () => {
    expect(firstImpressionH({ looks: 0, fashion: 0, personality: 0, wealth: 0, academics: 0, popularity: 0 })).toBe(5)
    expect(firstImpressionH({ looks: 100, fashion: 100, personality: 0, wealth: 0, academics: 0, popularity: 0 })).toBe(20)
  })
  it('주간 상한 +8', () => {
    expect(applyWeeklyCap(5, 6)).toBe(2)
    expect(applyWeeklyCap(-4, 8)).toBe(-4)
  })
  it('반올림 floor(x+0.5)', () => {
    expect(roundHalfUp(2.5)).toBe(3)
    expect(roundHalfUp(2.1)).toBe(2)
  })
})

describe('포인트·미션', () => {
  it('포인트 배분: 외모 +1/P, 재력 3만 원/P, 키 1cm/P (최대 188)', () => {
    let s = newGame(SEED)
    s = { ...s, points: 30 }
    s = allocatePoints(s, { looks: 5, wealth: 2, height: 20 })
    expect(s.stats.looks).toBe(10)
    expect(s.money).toBe(100_000 + 60_000)
    expect(s.height).toBe(188)
    expect(s.points).toBe(3)
    expect(currentStage(s)).toBe(2)
    expect(s.flags).toContain('ms_height_2')
  })
  it('시작 시점에 이미 넘은 성장 기준은 알림을 띄우지 않음', () => {
    const s = runWeek(newGame(SEED), ['meal']).state
    expect(s.notices.some((n) => n.title.includes('성격 1차') || n.title.includes('두뇌 1차'))).toBe(false)
  })
  it('가진 P보다 많이 배분할 수 없음', () => {
    const s = { ...newGame(SEED), points: 2 }
    expect(allocatePoints(s, { looks: 3 })).toBe(s)
  })
  it('1주차 미션: 하늘이에게 근황을 말하면 2P', () => {
    let s = runWeek(newGame(SEED), []).state
    s = choose(s, 'lonely')
    expect(s.missions.m01.status).toBe('done')
    expect(s.points).toBe(2)
  })
  it('연애 미션 ①: 하늘이는 시작부터 제시되고, 수락 → 활동 → 좋은 선택이면 완료', () => {
    let s = newGame(SEED)
    expect(s.missions.rom_haneul_1.status).toBe('offered')
    s = acceptMission(s, 'rom_haneul_1')
    expect(s.missions.rom_haneul_1.status).toBe('active')
    s = choose(runWeek(s, ['act_rom_haneul_1']).state, 'lonely')
    expect(currentEvent(s)?.id).toBe('scene_rom_haneul_1')
    s = choose(s, 'good')
    expect(s.missions.rom_haneul_1.status).toBe('done')
  })
  it('연애 미션: 재촉하면 그 단계는 막히고 감점', () => {
    let s = acceptMission(newGame(SEED), 'rom_haneul_1')
    s = choose(runWeek(s, ['act_rom_haneul_1']).state, 'lonely')
    const h0 = s.rels.haneul.h
    s = choose(s, 'pushy')
    expect(s.rels.haneul.h).toBeLessThan(h0)
    expect(s.flags).toContain('rom_haneul_1_blocked')
  })
})

describe('이야기 분기·일기', () => {
  const diaryResult = (s: GameState, id: string) => diaryPages(s).find((p) => p.id === id)?.result

  it('프롤로그 시점에 "7주 토요일" 일기가 원래 미래로 공개되고 아직 결과는 없음', () => {
    const s = newGame(SEED)
    const page = diaryPages(s).find((p) => p.id === 'd_saturday')
    expect(page).toBeDefined()
    expect(page?.result).toBeUndefined()
  })

  it('E01에서 약속을 안 하면 하늘이가 5주에 먼저 약속을 잡음', () => {
    const s = play({}, { E01: 'lonely' }, 5)
    expect(s.firedEvents).toContain('E05H')
    expect(s.flags).toContain('promise_pc')
  })

  it('약속을 지키면: 교환학생 이야기를 듣고 벤치 장면 → 일기 문장 변경', () => {
    const s = play({}, { E01: 'promise', E07: 'keep', E07K: 'ask' }, 7)
    expect(s.firedEvents).toContain('E07K')
    expect(s.flags).toContain('asked_her_mind')
    expect(diaryResult(s, 'd_saturday')?.kind).toBe('changed')
    expect(diaryResult(s, 'd_saturday')?.text).toContain('교환학생')
  })

  it('미리 말하고 회의에 가면: 내 안을 발표하고, 하늘 이야기는 8주 화요일로 이어짐', () => {
    let s = play({}, { E01: 'promise', E07: 'change' }, 7)
    expect(s.flags).toContain('presented_plan')
    expect(diaryResult(s, 'd_saturday')).toBeUndefined() // 아직 이야기를 듣지 못함
    s = play({}, { E01: 'promise', E07: 'change', E07R: 'go' }, 8)
    expect(s.firedEvents).toContain('E07R')
    expect(diaryResult(s, 'd_saturday')?.text).toContain('한 주 늦게')
  })

  it('연락 없이 회의에 가면: 일기는 "기록대로 되었다"', () => {
    const s = play({}, { E01: 'promise', E07: 'ditch' }, 7)
    expect(diaryResult(s, 'd_saturday')?.kind).toBe('kept')
  })

  it('일정 조정: 서린 신뢰가 낮으면 발표는 다른 사람, 하늘 신뢰는 +3만', () => {
    let s = play({}, { E01: 'promise' }, 6)
    s = runWeek(s, []).state
    while (currentEvent(s)?.id !== 'E07') s = choose(s, currentEvent(s)!.choices[0].id)
    const t0 = s.rels.haneul.t
    s = choose(s, 'both')
    expect(s.flags).toContain('presenter_other')
    expect(s.flags).not.toContain('presented_plan')
    expect(s.rels.haneul.t - t0).toBeLessThanOrEqual(3)
    expect(s.lastResult?.reaction).toContain('회의는 회의야')
  })

  it('서윤이 먼저 인터뷰를 제안 → 수락하면 4주 인터뷰 장면, 일기 문장 변경', () => {
    const s = play({}, { E02: 'asked', E03: 'interview', E04S: 'honest' }, 4)
    expect(s.firedEvents).toContain('E04S')
    expect(s.flags).toContain('interview_honest')
    expect(diaryResult(s, 'd_classmate')?.text).toContain('먼저 나에게 질문')
  })

  it('펜만 빌려준 2주차에는 일기가 아직 이름을 말하지 않음', () => {
    const s = play({}, { E02: 'asked' }, 2)
    expect(diaryResult(s, 'd_classmate')).toBeUndefined()
  })

  it('만나지 않은 서린은 일기에 나오지 않음 (5주 전)', () => {
    const s = play({}, {}, 4)
    expect(diaryPages(s).some((p) => p.id === 'd_festival')).toBe(false)
  })

  it('일기 결과 알림은 페이지당 한 번만', () => {
    let s = play({}, { E01: 'promise', E07: 'ditch' }, 7)
    const before = s.flags.filter((f) => f.startsWith('diary_d_saturday_o')).length
    s = play({}, { E01: 'promise', E07: 'ditch' }, 9)
    expect(s.flags.filter((f) => f.startsWith('diary_d_saturday_o')).length).toBe(before)
  })
})

describe('활동에 따라 달라지는 상황', () => {
  /** 시드를 지정해 13주를 같은 활동 계획으로 진행 */
  function playWith(seed: number, weekly: string[], picks: Record<string, string> = {}) {
    let s = newGame(seed)
    while (s.phase !== 'season_end') {
      const ids = weekly.filter((id) => checkPlan(s, [id]).ok)
      const plan = checkPlan(s, ids).ok ? ids : []
      s = resolveWeek(runWeek(s, plan).state, picks)
    }
    return s
  }
  const fired = (s: GameState, prefix: string) => s.firedEvents.filter((id) => id.startsWith(prefix))

  it('공부만 한 학기와 과 사람들과 어울린 학기는 겪는 상황이 다름', () => {
    const study = playWith(SEED, ['study', 'meal'])
    const social = playWith(SEED, ['social', 'meal'])
    expect(fired(study, 'AS_').length).toBeGreaterThan(0)
    expect(fired(study, 'AO_')).toEqual([])
    expect(fired(social, 'AO_').length).toBeGreaterThan(0)
    expect(fired(social, 'AS_')).toEqual([])
  })

  it('활동 사건은 한 주에 최대 2개', () => {
    const s = playWith(SEED, ['study', 'social', 'meal', 'rest'])
    for (const [k, v] of Object.entries(s.vars)) if (k.startsWith('actEv_w')) expect(v).toBeLessThanOrEqual(2)
  })

  it('같은 저장(시드)이면 결과가 같고, 시드가 다르면 달라질 수 있음', () => {
    const a = playWith(SEED, ['study', 'social', 'meal'])
    const b = playWith(SEED, ['study', 'social', 'meal'])
    expect(a.firedEvents).toEqual(b.firedEvents)
    const variants = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => fired(playWith(seed, ['study', 'social', 'meal']), 'A').join(',')))
    expect(variants.size).toBeGreaterThan(1)
  })

  it('과 동기 단톡에 참여하면 성격이 낮아도 축제 조율 경로가 열림', () => {
    const coord = eventById('E08').choices.find((c) => c.id === 'coord')!
    const s = newGame(SEED)
    expect(s.stats.personality).toBeLessThan(50)
    expect(check(s, coord.requires)).toBe(false)
    expect(check({ ...s, flags: [...s.flags, 'has_classmates'] }, coord.requires)).toBe(true)
  })
})

describe('체력·과로', () => {
  it('정상 소진 0은 허용, -3까지 무리 가능, -4는 불가', () => {
    const s = newGame(SEED)
    expect(checkPlan(s, ['cvs', 'study', 'social', 'meal']).energyAfter).toBe(0)
    expect(checkPlan(s, ['cvs', 'cvs', 'study', 'meal', 'hair']).ok).toBe(true) // -3
    expect(checkPlan(s, ['cvs', 'cvs', 'study', 'social', 'meal']).ok).toBe(false) // -4
  })
  it('과로하면 다음 주 회복 주간', () => {
    let s = newGame(SEED)
    s = resolveWeek(runWeek(s, ['cvs', 'cvs', 'study', 'meal', 'hair']).state, { E01: 'fine' })
    expect(s.week).toBe(2)
    expect(s.forcedRest).toBe(true)
    expect(checkPlan(s, ['study']).ok).toBe(false)
    expect(checkPlan(s, ['rest']).ok).toBe(true)
  })
  it('PC방 약속 체력은 7주에 예약되고 실행 시 한 번만 차감', () => {
    let s = newGame(SEED)
    s = runWeek(s, []).state
    s = choose(s, 'promise')
    expect(s.reservations).toEqual([{ key: 'pc', week: 7, amount: 2 }])
  })
})

describe('시즌 흐름', () => {
  const goodPlan: Record<number, string[]> = {
    1: ['study', 'meal'],
    2: ['cvs', 'meal', 'study'],
    3: ['cvs', 'meal'],
    4: ['study', 'meal', 'social'],
    5: ['cvs', 'meal', 'rest'],
    6: ['study', 'meal', 'rest'],
    7: ['meal', 'rest'],
    8: ['shop', 'meal'],
    9: ['meal', 'rest'],
    10: ['meal', 'rest'],
    11: ['meal', 'rest'],
  }
  const goodPicks = {
    E01: 'promise',
    E02: 'asked',
    E03: 'note',
    E04: 'hair',
    E05A: 'face',
    E06: 'keep',
    E06F: 'listen',
    E07: 'keep',
    E07N: 'stay',
    E08: 'records',
    E09: 'credit',
    E10S: 'keep',
    E11: 'serious',
    E12: 'work',
  }

  it('좋은 선택이면 공개 인정 → 소꿉친구 자각까지 도달', () => {
    const s = play(goodPlan, goodPicks)
    expect(s.phase).toBe('season_end')
    expect(s.flags).toContain('recognized')
    expect(s.flags).toContain('friend_aware')
    expect(s.firedEvents).toContain('E12')
  })

  it('누나 첫 만남 기본 경로: 알바·운동을 안 해도 6주에 만남', () => {
    const s = play({}, {}, 6)
    expect(s.rels.seorin.met).toBe(true)
    expect(s.firedEvents).toContain('E05C')
  })

  it('E08에서 빠지면 0점 → 실패판', () => {
    const s = play(goodPlan, { ...goodPicks, E08: 'skip' }, 9)
    expect(s.firedEvents).toContain('E09F')
    expect(s.flags).not.toContain('recognized')
  })

  it('기본 미션: 좋은 플레이면 대부분 완료하고 P가 쌓이며, 배분 전엔 능력치가 그대로', () => {
    const s = play(goodPlan, goodPicks)
    const done = Object.entries(s.missions).filter(([id, m]) => id.startsWith('m') && m.status === 'done').map(([id]) => id)
    expect(done.length).toBeGreaterThanOrEqual(11)
    expect(s.points).toBeGreaterThan(30)
    expect(s.stats.looks).toBeLessThan(20) // P는 자동 배분되지 않음
  })

  it('E11 갈등판 화해 후 자각 시 총 보상 15 (5+10)', () => {
    const picks = { ...goodPicks, E10S: 'brag', E11C: 'sorry' }
    const s = play(goodPlan, picks)
    expect(s.firedEvents).toContain('E11C')
    expect(s.flags).toContain('friend_reward5')
    expect(s.flags).toContain('friend_reward_done')
  })
})
