/**
 * 수치 규칙 (밸런스 가설 — 플레이 검증 전).
 * 기준 문서: 시제품_사건12_대학.md r2
 */
import type { CharId, Stats } from './types'
import { CHARACTERS } from '../data/characters'

export const RULES = {
  baseEnergy: 10,
  maxEnergyCap: 14,
  exercisePerEnergy: 4,
  overworkFloor: -3,
  weeklyRelCap: 8,
  weeklyMentalRecoveryCap: 30,
  recoveryWeekMental: 40,
  allowance: 50_000,
  cvsPay: 40_000,
  startMoney: 100_000,
  startMental: 30,
  seasonWeeks: 13,
  confidentMental: 50,
  startLooks: 5,
  startHeight: 168,
  maxHeight: 188,
  wealthUnit: 30_000,
  pointCash: 30_000,
} as const

/** 외형 10단계: 외모 10점 구간마다 1단계 */
export const appearanceStage = (looks: number) => Math.min(10, Math.floor(looks / 10) + 1)

/** 히로인 반응 묶음: 1–4 → 1, 5–7 → 2, 8–10 → 3 */
export const appearanceBand = (stage: number) => (stage <= 4 ? 1 : stage <= 7 ? 2 : 3)

/** 키를 화면 크기로 반영 (168cm → 0.9, 188cm → 1.0) */
export const heightScale = (cm: number) => 0.9 + ((clamp(cm, 168, 188) - 168) / 20) * 0.1

/** 능력 상승 알림 기준 */
export const MILESTONES: { key: string; label: string; at: number[]; lines: string[] }[] = [
  { key: 'looks', label: '외모', at: [40, 60, 80], lines: ['거울 속 인상이 또렷해졌다.', '주변이 변화를 알아보기 시작했다.', '이제 시선을 피하지 않아도 괜찮다.'] },
  { key: 'personality', label: '성격', at: [40, 60, 80], lines: ['하고 싶은 말을 끝까지 전했다.', '상대의 말에도 여유 있게 답할 수 있다.', '어색한 순간에도 내 방식으로 대화를 이어 간다.'] },
  { key: 'academics', label: '두뇌', at: [40, 60, 80], lines: ['흩어진 개념이 연결된다.', '복잡한 문제에서도 흐름이 보인다.', '배운 것을 처음 보는 상황에 응용한다.'] },
  { key: 'money', label: '재력', at: [300_000, 1_000_000, 3_000_000], lines: ['잔고에 작은 여유가 생겼다.', '미뤄 둔 계획을 다시 펼쳤다.', '다음 학기의 선택까지 생각할 수 있다.'] },
  { key: 'height', label: '키', at: [173, 180, 188], lines: ['익숙한 풍경의 눈높이가 달라졌다.', '옷의 길이를 다시 확인했다.', '일기가 허락한 최대 성장에 도달했다.'] },
]

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

/** 양수 반올림 규칙: floor(x + 0.5) */
export const roundHalfUp = (x: number) => Math.floor(x + 0.5)

/** 첫인상 H: 5 + floor(외모/10) + floor(패션/20) → 5~20 */
export const firstImpressionH = (stats: Stats) =>
  5 + Math.floor(stats.looks / 10) + Math.floor(stats.fashion / 20)

/** 선호 점수: 0~100 가중합 */
export const preferenceScore = (stats: Stats, char: CharId) => {
  const pref = CHARACTERS[char].preference
  let score = 0
  for (const [k, w] of Object.entries(pref)) score += stats[k as keyof Stats] * (w ?? 0)
  return clamp(score)
}

export const preferenceCoef = (score: number) => {
  if (score >= 80) return 1.2
  if (score >= 60) return 1.1
  if (score >= 30) return 1.0
  return 0.8
}

export const mentalCoef = (mental: number) => (mental < 40 ? 0.7 : 1.0)

/** 같은 주·같은 인물·같은 행동군: 1회차 1, 2회차 0.5, 3회차부터 0 */
export const repeatCoef = (nth: number) => (nth <= 1 ? 1 : nth === 2 ? 0.5 : 0)

/** 멘탈 20 미만이면 스탯 성장 0.5배 */
export const statGrowthCoef = (mental: number) => (mental < 20 ? 0.5 : 1)

export type MentalTier = '번아웃' | '위축' | '보통' | '자신감'
export const mentalTier = (m: number): MentalTier =>
  m < 20 ? '번아웃' : m < 40 ? '위축' : m < 70 ? '보통' : '자신감'

/** 재력 = 현금 요약 지표 (3만 원당 1점) */
export const wealthFromMoney = (money: number) => clamp(Math.floor(money / 30_000))

export interface RelCalcInput {
  baseH: number
  baseT: number
  prefScore: number
  mental: number
  nth: number
}

/** 사건/활동 1회의 실제 H·T 변화 (주간 상한 적용 전) */
export const calcRelChange = ({ baseH, baseT, prefScore, mental, nth }: RelCalcInput) => {
  const rep = repeatCoef(nth)
  const h = baseH > 0 ? roundHalfUp(baseH * preferenceCoef(prefScore) * mentalCoef(mental) * rep) : baseH
  const t = baseT > 0 ? roundHalfUp(baseT * rep) : baseT
  return { h, t }
}

/** 주간 상한 적용: 이미 오른 만큼을 빼고 남은 범위까지만 */
export const applyWeeklyCap = (delta: number, gainedThisWeek: number, cap: number = RULES.weeklyRelCap) =>
  delta > 0 ? Math.max(0, Math.min(delta, cap - gainedThisWeek)) : delta
