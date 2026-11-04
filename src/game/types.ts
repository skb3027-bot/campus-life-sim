export type StatKey = 'looks' | 'personality' | 'fashion' | 'wealth' | 'academics' | 'popularity'

export type Stats = Record<StatKey, number>

export type CharId = 'haneul' | 'seorin' | 'seoyun'

/** 행동군: 같은 주·같은 인물·같은 행동군 반복 시 보상이 줄어든다 */
export type ActionGroup = 'help' | 'remember' | 'promise' | 'gift' | 'talk' | 'date'

export interface Relationship {
  met: boolean
  h: number
  t: number
}

export interface CharacterDef {
  id: CharId
  name: string
  age: number
  role: string
  image: string
  /** 선호 점수 가중치 (합계 1) */
  preference: Partial<Record<StatKey, number>>
  /** 기존 관계로 시작하는 인물의 초기 수치 */
  initial?: { h: number; t: number }
}

export type Condition =
  | { flag: string }
  | { notFlag: string }
  | { stat: StatKey; min?: number; max?: number }
  | { mental: { min?: number; max?: number } }
  | { rel: CharId; met?: boolean; h?: number; t?: number; tBelow?: number }
  | { varName: string; min?: number; max?: number }
  | { money: number }
  /** 이 선택 후 남는 체력이 이 값 이상이어야 함 (과로 판정) */
  | { energyAfter: { cost: number; min: number } }
  | { any: Condition[] }
  | { all: Condition[] }

export type Effect =
  | { stat: StatKey; delta: number }
  | { mental: number }
  | { money: number }
  | { energy: number }
  | {
      rel: CharId
      h?: number
      t?: number
      group?: ActionGroup
      /** 일회성 서사 보상: 계수·반복·주간 상한 미적용 */
      narrative?: boolean
    }
  | { meet: CharId }
  | { setFlag: string }
  | { clearFlag: string }
  | { addVar: string; delta: number }
  | { reserveEnergy: { week: number; amount: number; key: string } }
  | { releaseReservation: string }
  | { log: string }
  /** 미용실(유지형) · 옷(착용형, 반복 감소) · 회복 주간 */
  | { special: 'hair' | 'clothes' | 'recovery' }
  | { if: Condition; then: Effect[]; else?: Effect[] }

export interface Choice {
  id: string
  text: string
  /** ⚑ 적극적 표현 등 표시 조건 */
  requires?: Condition
  /** 조건이 맞지 않을 때 숨김(기본) 대신 잠금 표시 */
  showLocked?: boolean
  lockedHint?: string
  effects: Effect[]
  reaction: string
}

export interface EventDef {
  id: string
  title: string
  /** 발생 주 (from~to 사이 조건 충족 시 1회) */
  week: { from: number; to?: number }
  when?: Condition
  speaker?: CharId
  portrait?: string
  /** 선택지 전에 자동 적용되는 효과 */
  onEnter?: Effect[]
  text: string[]
  choices: Choice[]
  /** 같은 주 안에서의 처리 순서 */
  order?: number
}

export interface ActivityDef {
  id: string
  name: string
  desc: string
  energy: number
  cost?: number
  perWeek: number
  requires?: Condition
  /** 회복 주간처럼 그 주의 다른 활동을 모두 막는 활동 */
  exclusive?: boolean
  effects?: Effect[]
  /** 일상 멘탈 회복량 (n번째 실행 → 값), 주간 회복 상한 적용 */
  mentalRecovery?: number[]
}

export interface Reservation {
  key: string
  week: number
  amount: number
}

export interface LogEntry {
  week: number
  text: string
}

export interface GameState {
  version: number
  week: number
  phase: 'plan' | 'event' | 'season_end'
  stats: Stats
  mental: number
  energy: number
  maxEnergy: number
  money: number
  rels: Record<CharId, Relationship>
  flags: string[]
  vars: Record<string, number>
  firedEvents: string[]
  eventQueue: string[]
  reservations: Reservation[]
  /** 이번 주 캐릭터별 상승량 (주간 상한 계산) */
  weeklyGain: Record<string, { h: number; t: number }>
  /** 이번 주 캐릭터·행동군별 반복 횟수 */
  weeklyRepeat: Record<string, number>
  weeklyMentalRecovered: number
  /** 다음 주 강제 회복 (과로) */
  forcedRest: boolean
  /** 미용실 효과 만료 주 */
  hairUntil: number
  log: LogEntry[]
  lastResult?: ResultSummary
  /** 현재 사건 진입 시 자동 적용된 변화 */
  lastEnterChanges?: string[]
  /** 지난 주 마감 정산 */
  lastWeekChanges?: string[]
}

export interface ResultSummary {
  title: string
  reaction: string
  changes: string[]
}
