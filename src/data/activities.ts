import type { ActivityDef } from '../game/types'
import { ROMANCE_ACTIVITIES } from './romance'

export const ACTIVITIES: ActivityDef[] = [
  {
    id: 'study',
    name: '공부',
    desc: '두뇌 +3',
    energy: 3,
    perWeek: 2,
    effects: [{ stat: 'academics', delta: 3 }],
  },
  {
    id: 'cvs',
    name: '편의점 야간 알바',
    desc: '4만 원 (주말 지급)',
    energy: 4,
    perWeek: 2,
    effects: [
      { addVar: 'pendingPay', delta: 40_000 },
      { addVar: 'cvsShifts', delta: 1 },
      { setFlag: 'worked_cvs' },
      { if: { varName: 'cvsShifts', min: 2 }, then: [{ setFlag: 'cvs_order' }] },
    ],
  },
  {
    id: 'gym',
    name: '운동',
    desc: '외모 +1 · 4회마다 최대 체력 +1',
    energy: 2,
    perWeek: 2,
    effects: [{ stat: 'looks', delta: 1 }, { addVar: 'exercise', delta: 1 }, { setFlag: 'went_gym' }],
  },
  {
    id: 'hair',
    name: '미용실',
    desc: '외모 +5 (4주 유지)',
    energy: 1,
    cost: 30_000,
    perWeek: 1,
    effects: [{ special: 'hair' }],
  },
  {
    id: 'clothes',
    name: '옷 쇼핑',
    desc: '패션 +8 (반복 시 효과 감소)',
    energy: 1,
    cost: 100_000,
    perWeek: 1,
    effects: [{ special: 'clothes' }],
  },
  {
    id: 'social',
    name: '과 사람들과 어울리기',
    desc: '인기 +2 · 성격 +1',
    energy: 2,
    perWeek: 1,
    effects: [
      { stat: 'popularity', delta: 2 },
      { stat: 'personality', delta: 1 },
    ],
  },
  {
    id: 'meal',
    name: '하늘이와 밥',
    desc: '하늘 H+2 T+1',
    energy: 1,
    perWeek: 1,
    effects: [{ rel: 'haneul', h: 2, t: 1, group: 'talk' }, { addVar: 'meals', delta: 1 }],
  },
  {
    id: 'shop',
    name: '서린 누나 가게 돕기',
    desc: '서린 T+2',
    energy: 2,
    perWeek: 1,
    requires: { all: [{ flag: 'noona_e06_done' }, { notFlag: 'noona_secret_leaked' }] },
    effects: [{ rel: 'seorin', t: 2, group: 'help' }],
  },
  {
    id: 'helpOthers',
    name: '다른 과 과제 도와주기',
    desc: '도전 미션 중 · 성격 +1',
    energy: 2,
    perWeek: 1,
    requires: { flag: 'mission_c02_active' },
    effects: [{ stat: 'personality', delta: 1 }, { addVar: 'helpedOthers', delta: 1 }],
  },
  {
    id: 'rest',
    name: '휴식',
    desc: '멘탈 +12 (두 번째 +6)',
    energy: 2,
    perWeek: 2,
    mentalRecovery: [12, 6],
  },
  {
    id: 'hobby',
    name: '취미',
    desc: '멘탈 +8',
    energy: 2,
    cost: 20_000,
    perWeek: 1,
    mentalRecovery: [8],
  },
  {
    id: 'recovery',
    name: '회복 주간',
    desc: '이번 주 다른 활동 없이 멘탈 +40',
    energy: 0,
    perWeek: 1,
    exclusive: true,
    effects: [{ special: 'recovery' }],
  },
  ...ROMANCE_ACTIVITIES,
]

export const activityById = (id: string) => {
  const a = ACTIVITIES.find((x) => x.id === id)
  if (!a) throw new Error(`unknown activity ${id}`)
  return a
}
