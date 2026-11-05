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
  /** 이번 주에 이 활동을 했는지 */
  | { didActivity: string }
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
  /** 결과 카드로 띄울 알림 (회귀자의 일기 등) */
  | { notice: { title: string; text: string; kind?: NoticeKind } }
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
  /** 선택 당시 상태에 따라 반응 문장을 바꿈 (첫 번째로 맞는 것 사용) */
  reactionIf?: { if: Condition; text: string }[]
}

/** 회귀자의 일기 한 페이지: 원래(실패한) 미래 기록 → 플레이 결과로 수정 */
export interface DiaryEntry {
  id: string
  title: string
  showWhen: Condition
  original: string
  /** 첫 번째로 맞는 결과로 확정 (changed: 문장이 바뀜 / kept: 기록대로 됨) */
  outcomes: { when: Condition; kind: 'changed' | 'kept'; text: string }[]
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
  /** 앞선 선택을 기억하는 추가 문장 (조건이 맞으면 본문 뒤에 붙음) */
  textIf?: { if: Condition; text: string }[]
  choices: Choice[]
  /** 같은 주 안에서의 처리 순서 */
  order?: number
  /** 조건 플래그로만 제어되는 반복 사건 (firedEvents에 기록하지 않음) */
  repeatable?: boolean
  /** 활동 사건: 그 주에 고른 활동에서 생기는 상황 (주당 최대 2개) */
  pool?: 'activity'
  /** 발생 확률 0~1 (저장마다 고정된 시드로 판정 → 불러와도 결과 같음) */
  chance?: number
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
  /** 키 (cm) — 시스템 포인트로만 성장 */
  height: number
  /** 배분하지 않은 시스템 포인트 */
  points: number
  missions: Record<string, MissionState>
  /** 히로인별 마지막으로 반응을 보인 외형 묶음 (1: 1–4단계, 2: 5–7, 3: 8–10) */
  seenBand: Partial<Record<CharId, number>>
  /** 현재 사건에서 히로인이 외형 변화에 보인 반응 한마디 */
  reactionLine?: string
  /** UI가 꺼내 가는 알림 (미션·일기·상승 알림) */
  notices: ResultSummary[]
  /** 활동 사건 확률 판정용 시드 */
  seed?: number
  /** 주차별 P 기록 (성장 속도 검증) */
  pointLog: { week: number; earned: number; spent: number; stage: number }[]
}

export type NoticeKind = 'result' | 'mission' | 'diary' | 'levelup' | 'reaction'

export interface ResultSummary {
  title: string
  reaction: string
  changes: string[]
  kind?: NoticeKind
}

/* ───────── 미션 ───────── */

export type MissionKind = 'main' | 'challenge' | 'romance'

export interface MissionDef {
  id: string
  kind: MissionKind
  title: string
  desc: string
  reward: number
  /** 제시 조건 */
  offerWeek: number
  offerWhen?: Condition
  /** 절대 마감 주 (main) */
  deadlineWeek?: number
  /** 수락 후 N주 (challenge·romance) */
  deadlineAfter?: number
  /** 수락이 필요한 미션 (거절 가능) */
  needsAccept: boolean
  success: Condition
  heroine?: CharId
  stage?: number
  /** 실패 시 나중에 다시 제시 (romance) */
  reofferable?: boolean
}

export type MissionStatus = 'offered' | 'active' | 'done' | 'failed' | 'declined'

export interface MissionState {
  status: MissionStatus
  deadline: number
}

export type PointTarget = 'looks' | 'personality' | 'academics' | 'wealth' | 'height'
