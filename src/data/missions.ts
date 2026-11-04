/**
 * 상태창 미션 (docs/v5_미션_일기.md)
 * 기본 13개(총 50P) · 도전 2개 · 연애 15개
 */
import type { MissionDef } from '../game/types'
import { ROMANCE_MISSIONS } from './romance'

const main = (
  id: string,
  week: number,
  deadline: number,
  title: string,
  desc: string,
  reward: number,
  success: MissionDef['success'],
): MissionDef => ({ id, kind: 'main', title, desc, reward, offerWeek: week, deadlineWeek: deadline, needsAccept: false, success })

export const MAIN_MISSIONS: MissionDef[] = [
  main('m01', 1, 1, '먼저 건넨 한마디', '먼저 인사하거나, 정하늘에게 근황을 이야기하라', 2, { flag: 'e01_opened' }),
  main('m02', 2, 4, '작은 친절의 방향', '펜을 빌려주거나, 도서관에서 한서윤을 도와라', 3, {
    any: [{ flag: 'pen_silent' }, { flag: 'pen_asked' }, { flag: 'pen_brave' }, { flag: 'seoyun_helped' }],
  }),
  main('m03', 3, 3, '거울 앞의 첫 결정', '미용실·옷 쇼핑·운동 중 하나를 실제로 하라', 3, {
    any: [{ flag: 'did_hair' }, { flag: 'did_clothes' }, { flag: 'went_gym' }],
  }),
  main('m04', 4, 4, '한 번 더 마주 앉기', '이미 만난 사람과 대화·식사를 한 번 더 하라', 3, {
    any: [{ flag: 'e03_talk' }, { varName: 'meals', min: 1 }],
  }),
  main('m05', 5, 6, '소문보다 먼저', '강서린과 처음 만나라', 4, { flag: 'noona_met' }),
  main('m06', 6, 6, '익숙한 사람의 낯선 하루', '하늘이의 이야기를 들어 주거나 함께 시간을 보내라', 4, {
    any: [{ flag: 'heard_friend' }, { flag: 'e06f_game' }],
  }),
  main('m07', 7, 7, '약속의 무게', '약속을 지키거나, 미리 상대와 변경을 합의하라', 4, {
    any: [{ flag: 'promise_kept' }, { flag: 'promise_changed' }, { all: [{ notFlag: 'promise_pc' }, { flag: 'act_meal_w7' }] }],
  }),
  main('m08', 8, 8, '내 몫의 일', '야간 정리·야식·가게 돕기 중 하나를 하라', 4, {
    any: [{ flag: 'stayed_late' }, { flag: 'noona_snack' }, { flag: 'act_shop_w8' }],
  }),
  main('m09', 9, 9, '결과에 남긴 이름', '축제 부스에서 맡은 역할을 수행하라', 5, { flag: 'booth_did_role' }),
  main('m10', 10, 10, '늘어난 시선 속에서', '인기가 생겨도 기존 약속을 지키거나, 동의를 받아 함께하라', 4, { flag: 'e10_good' }),
  main('m11', 11, 11, '말하지 못했던 한마디', '서운하게 한 사람에게 사과하거나, 도와준 사람에게 감사를 전하라', 4, { flag: 'e11a_done' }),
  main('m12', 12, 13, '일기에 없던 대답', '하늘이의 진심에 진지하게 답하라', 6, {
    any: [{ flag: 'friend_aware' }, { flag: 'e11c_sorry' }],
  }),
  main('m13', 13, 13, '아직 쓰이지 않은 여름', '학기를 돌아보고 방학 계획을 정하라', 4, {
    any: [{ flag: 'summer_work' }, { flag: 'summer_trip' }, { flag: 'summer_self' }],
  }),
]

export const CHALLENGE_MISSIONS: MissionDef[] = [
  {
    id: 'c01',
    kind: 'challenge',
    title: '네 이름으로 남긴 일',
    desc: '축제가 시작되기 전까지, 강서린이 네가 해낸 일을 인정하며 이름을 부르게 하라',
    reward: 8,
    offerWeek: 6,
    offerWhen: { flag: 'noona_met' },
    deadlineWeek: 9,
    needsAccept: true,
    success: { flag: 'recognized' },
  },
  {
    id: 'c02',
    kind: 'challenge',
    title: '단톡방에 남은 한 줄',
    desc: '3주 안에, 다른 과 사람이 네 도움을 언급하며 감사하게 하라',
    reward: 6,
    offerWeek: 10,
    offerWhen: { flag: 'e08_done' },
    deadlineAfter: 3,
    needsAccept: true,
    success: { flag: 'chat_thanks' },
  },
]

export const MISSIONS: MissionDef[] = [...MAIN_MISSIONS, ...CHALLENGE_MISSIONS, ...ROMANCE_MISSIONS]

export const missionById = (id: string) => {
  const m = MISSIONS.find((x) => x.id === id)
  if (!m) throw new Error(`unknown mission ${id}`)
  return m
}
