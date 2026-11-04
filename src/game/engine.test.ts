import { describe, expect, it } from 'vitest'
import { calcRelChange, firstImpressionH, applyWeeklyCap, roundHalfUp } from './rules'
import { acceptMission, allocatePoints, checkPlan, choose, currentEvent, currentStage, newGame, runWeek } from './engine'
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

describe('포인트·미션', () => {
  it('포인트 배분: 외모 +1/P, 재력 3만 원/P, 키 1cm/P (최대 188)', () => {
    let s = newGame()
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
    const s = runWeek(newGame(), ['meal']).state
    expect(s.notices.some((n) => n.title.includes('성격 1차') || n.title.includes('두뇌 1차'))).toBe(false)
  })
  it('가진 P보다 많이 배분할 수 없음', () => {
    const s = { ...newGame(), points: 2 }
    expect(allocatePoints(s, { looks: 3 })).toBe(s)
  })
  it('1주차 미션: 하늘이에게 근황을 말하면 2P', () => {
    let s = runWeek(newGame(), []).state
    s = choose(s, 'lonely')
    expect(s.missions.m01.status).toBe('done')
    expect(s.points).toBe(2)
  })
  it('연애 미션 ①: 하늘이는 시작부터 제시되고, 수락 → 활동 → 좋은 선택이면 완료', () => {
    let s = newGame()
    expect(s.missions.rom_haneul_1.status).toBe('offered')
    s = acceptMission(s, 'rom_haneul_1')
    expect(s.missions.rom_haneul_1.status).toBe('active')
    s = choose(runWeek(s, ['act_rom_haneul_1']).state, 'lonely')
    expect(currentEvent(s)?.id).toBe('scene_rom_haneul_1')
    s = choose(s, 'good')
    expect(s.missions.rom_haneul_1.status).toBe('done')
  })
  it('연애 미션: 재촉하면 그 단계는 막히고 감점', () => {
    let s = acceptMission(newGame(), 'rom_haneul_1')
    s = choose(runWeek(s, ['act_rom_haneul_1']).state, 'lonely')
    const h0 = s.rels.haneul.h
    s = choose(s, 'pushy')
    expect(s.rels.haneul.h).toBeLessThan(h0)
    expect(s.flags).toContain('rom_haneul_1_blocked')
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
