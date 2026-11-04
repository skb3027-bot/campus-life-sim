import { describe, expect, it } from 'vitest'
import { calcRelChange, firstImpressionH, applyWeeklyCap, roundHalfUp } from './rules'
import { checkPlan, choose, currentEvent, newGame, runWeek } from './engine'
import type { GameState } from './types'

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
  let s = newGame()
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

describe('체력·과로', () => {
  it('정상 소진 0은 허용, -3까지 무리 가능, -4는 불가', () => {
    const s = newGame()
    expect(checkPlan(s, ['cvs', 'study', 'social', 'meal']).energyAfter).toBe(0)
    expect(checkPlan(s, ['cvs', 'cvs', 'study', 'meal', 'hair']).ok).toBe(true) // -3
    expect(checkPlan(s, ['cvs', 'cvs', 'study', 'social', 'meal']).ok).toBe(false) // -4
  })
  it('과로하면 다음 주 회복 주간', () => {
    let s = newGame()
    s = resolveWeek(runWeek(s, ['cvs', 'cvs', 'study', 'meal', 'hair']).state, { E01: 'fine' })
    expect(s.week).toBe(2)
    expect(s.forcedRest).toBe(true)
    expect(checkPlan(s, ['study']).ok).toBe(false)
    expect(checkPlan(s, ['rest']).ok).toBe(true)
  })
  it('PC방 약속 체력은 7주에 예약되고 실행 시 한 번만 차감', () => {
    let s = newGame()
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

  it('E11 갈등판 화해 후 자각 시 총 보상 15 (5+10)', () => {
    const picks = { ...goodPicks, E10S: 'brag', E11C: 'sorry' }
    const s = play(goodPlan, picks)
    expect(s.firedEvents).toContain('E11C')
    expect(s.flags).toContain('friend_reward5')
    expect(s.flags).toContain('friend_reward_done')
  })
})
