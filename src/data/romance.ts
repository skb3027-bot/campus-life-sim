/**
 * 연애 미션 5단계 × 히로인 3명 (docs/v5_미션_일기.md r2)
 * 원칙: 관계 수치 + 사건 조건이 맞을 때만 제시 · 거절/보류는 감점 없음 · 재촉은 기존 감점
 * 등장인물 전원 만 20세 이상. ⑤단계는 분위기 묘사 후 다음 날로 장면 전환.
 */
import type { ActivityDef, CharId, Condition, EventDef, MissionDef } from '../game/types'
import { PORTRAITS } from './characters'

interface Scene {
  activity: string
  activityDesc: string
  energy: number
  cost?: number
  text: string[]
  good: { text: string; reaction: string }
  soft: { text: string; reaction: string }
  pushy: { text: string; reaction: string }
}

interface RomanceSpec {
  heroine: CharId
  stage: number
  title: string
  desc: string
  scene: Scene
}

const STAGE_REQ: { h: number; t: number; reward: number }[] = [
  { h: 0, t: 0, reward: 0 },
  { h: 5, t: 10, reward: 2 },
  { h: 25, t: 30, reward: 4 },
  { h: 50, t: 50, reward: 6 },
  { h: 65, t: 65, reward: 8 },
  { h: 75, t: 75, reward: 10 },
]

const PORTRAIT: Record<CharId, string> = {
  haneul: PORTRAITS.haneulSmile,
  seorin: PORTRAITS.seorin,
  seoyun: PORTRAITS.seoyun,
}

const SPECS: RomanceSpec[] = [
  /* ───── 정하늘 ───── */
  {
    heroine: 'haneul',
    stage: 1,
    title: '오늘은 네 얘기',
    desc: '같이 점심을 먹으며 하늘의 최근 고민을 끝까지 듣는다',
    scene: {
      activity: '하늘이와 점심 (고민 듣기)',
      activityDesc: '연애 미션 ① 하늘',
      energy: 1,
      text: ['학식 창가 자리. 하늘이가 숟가락으로 국을 휘젓기만 한다.', '"…야, 너 취업 걱정 같은 거 해?"'],
      good: { text: '"해. 너는? 끝까지 들을게."', reaction: '하늘이가 피식 웃더니 30분 동안 쏟아냈다. "…후련하다. 너한테 말하길 잘했네."' },
      soft: { text: '"나야 뭐… 너는 잘하잖아."', reaction: '"그런가." 하늘이는 화제를 돌렸다. 다음에 다시 물어보자.' },
      pushy: { text: '"그런 건 그냥 하면 돼." 말을 끊는다', reaction: '"…됐다." 하늘이가 식판을 들고 일어났다.' },
    },
  },
  {
    heroine: 'haneul',
    stage: 2,
    title: '익숙한 길, 새로운 약속',
    desc: '둘이 합의한 날, 예전에 함께 다니던 동네를 걸으며 지금의 고민을 나눈다',
    scene: {
      activity: '하늘이와 옛 동네 산책',
      activityDesc: '연애 미션 ② 하늘',
      energy: 2,
      text: ['초등학교 앞 문방구는 편의점이 됐다. 하늘이가 그 앞에서 멈춘다.', '"여기서 너 맨날 울었잖아. 내가 다 쫓아 줬고."'],
      good: { text: '"그때 고마웠다고, 한 번도 말 못 했네. 고마워."', reaction: '하늘이가 한참 말이 없다. "…새삼스럽게." 귀가 빨갰다.' },
      soft: { text: '"그런 얘기 하지 마, 쪽팔려."', reaction: '"뭐 어때." 하늘이는 웃었지만, 그 뒤로 옛날 얘기는 꺼내지 않았다.' },
      pushy: { text: '"이제 내가 너 지켜 줄게. 그러니까 나랑만 놀아."', reaction: '"뭐래, 갑자기." 하늘이가 한 발짝 물러섰다.' },
    },
  },
  {
    heroine: 'haneul',
    stage: 3,
    title: '오늘은 데이트라고 부르자',
    desc: '평소의 영화 약속을 둘 다 데이트라고 인정하고 함께 보낸다',
    scene: {
      activity: '하늘이와 영화 (데이트)',
      activityDesc: '연애 미션 ③ 하늘',
      energy: 3,
      cost: 30_000,
      text: [
        '영화관 앞. 하늘이가 평소와 달리 원피스를 입고 왔다.',
        '"…뭘 봐." 하늘이가 내 셔츠 깃을 손가락으로 툭 건드린다. "너야말로 오늘 왜 이렇게 신경 썼어? …나 만나는 날이라고 그런 건 아니지?"',
      ],
      good: { text: '"오늘 데이트 맞지? 나는 그렇게 생각하고 왔어."', reaction: '"…응. 데이트." 하늘이가 팝콘으로 얼굴을 가렸다.' },
      soft: { text: '"잘 어울린다." 여기까지만 말한다', reaction: '"알거든." 하늘이는 웃었다. 아직은 이름 붙이지 않은 하루.' },
      pushy: { text: '"이 정도면 사귀는 거지?" 대답을 재촉한다', reaction: '"…그런 걸 왜 네가 정해." 영화 내내 팔걸이 사이가 멀었다.' },
    },
  },
  {
    heroine: 'haneul',
    stage: 4,
    title: '친구라는 말 다음에',
    desc: '"친구로만 있고 싶지는 않아"라고 마음을 전하고 교제를 서로 확인한다',
    scene: {
      activity: '하늘이에게 마음 전하기',
      activityDesc: '연애 미션 ④ 하늘',
      energy: 2,
      text: ['하늘이 집 앞 놀이터. 어릴 때 같이 타던 그네가 아직 있다.', '하늘이가 그네를 밀며 말한다. "할 말 있다며."'],
      good: { text: '"나, 너랑 친구로만 있고 싶지는 않아."', reaction: '그네가 멈췄다. "…늦었어, 바보야. 나 기다렸잖아." 하늘이가 먼저 손을 잡았다.' },
      soft: { text: '"…아니다. 다음에 말할게."', reaction: '"뭐야, 김빠지게." 하늘이는 웃었지만 조금 아쉬운 얼굴이었다.' },
      pushy: { text: '"너도 나 좋아하잖아. 그치?" 몰아붙인다', reaction: '"그걸 왜 네가 확인받으려고 해." 하늘이가 그네에서 내려왔다.' },
    },
  },
  {
    heroine: 'haneul',
    stage: 5,
    title: '함께 맞는 첫 아침',
    desc: '일정과 숙박 방식을 합의한 1박 바다 여행을 다녀온다',
    scene: {
      activity: '하늘이와 1박 바다 여행',
      activityDesc: '연애 미션 ⑤ 하늘',
      energy: 4,
      cost: 150_000,
      text: ['강릉 바닷가 숙소. 창밖으로 파도 소리가 들린다.', '하늘이가 캔맥주를 내밀며 작게 말한다. "…오늘 같이 있자. 나도 그러고 싶어."'],
      good: { text: '"나도. 네가 괜찮으면."', reaction: '그날 밤 이야기는 둘만의 것으로 남았다. 아침, 하늘이가 먼저 눈을 뜨고 웃었다. "좋은 아침."' },
      soft: { text: '"오늘은 이렇게 얘기만 하자."', reaction: '둘은 새벽까지 이야기했다. "너 진짜 변했다. …좋은 쪽으로."' },
      pushy: { text: '하늘이가 망설이는데도 재촉한다', reaction: '"…잠깐만. 나 아직이야." 하늘이가 창가로 몸을 돌렸다.' },
    },
  },

  /* ───── 강서린 ───── */
  {
    heroine: 'seorin',
    stage: 1,
    title: '커피 취향 하나',
    desc: '쉬는 시간에 취향을 물어보고, 받겠다는 답을 들은 뒤 커피를 건넨다',
    scene: {
      activity: '서린 누나에게 커피',
      activityDesc: '연애 미션 ① 서린',
      energy: 1,
      cost: 5_000,
      text: ['과방 앞. 서린 누나가 휴대폰을 보며 하품을 참는다.'],
      good: { text: '"누나, 커피 뭐 드세요? 사 올까요?"', reaction: '"…아아. 샷 추가." 받아 든 누나가 한 모금 마시고 말했다. "기억해 둬."' },
      soft: { text: '말을 걸려다 그냥 지나간다', reaction: '누나는 나를 보지 못했다. 다음 기회에.' },
      pushy: { text: '묻지도 않고 달달한 라떼를 내민다', reaction: '"나 단 거 안 마셔." 누나가 컵을 도로 밀었다.' },
    },
  },
  {
    heroine: 'seorin',
    stage: 2,
    title: '선배의 휴일',
    desc: '일과 관계없는 식사를 제안하고, 서린이 받아들인 약속을 지킨다',
    scene: {
      activity: '서린 누나와 식사',
      activityDesc: '연애 미션 ② 서린',
      energy: 2,
      cost: 20_000,
      text: ['일요일 점심, 학교 앞 국밥집. 누나가 처음으로 가죽 재킷이 아닌 맨투맨을 입고 왔다.', '"일 얘기 하면 바로 일어난다."'],
      good: { text: '"그럼 누나 얘기 해 주세요. 쉬는 날엔 뭐 해요?"', reaction: '"…잠. 고양이 영상." 누나가 자기 말에 웃었다. 처음 보는 웃음이었다.' },
      soft: { text: '조용히 국밥만 먹는다', reaction: '누나는 휴대폰을 봤다. 편했지만, 그뿐이었다.' },
      pushy: { text: '"누나 가게 빚은 좀 어때요?" 사정을 캐묻는다', reaction: '"일 얘기도 아니고 그 얘기는 더 아니지." 누나가 계산서를 집었다.' },
    },
  },
  {
    heroine: 'seorin',
    stage: 3,
    title: '지시받지 않은 약속',
    desc: '서린이 좋아하는 공연을 함께 고르고, 일 이야기에만 머무르지 않는 첫 데이트를 마친다',
    scene: {
      activity: '서린 누나와 공연 (데이트)',
      activityDesc: '연애 미션 ③ 서린',
      energy: 3,
      cost: 50_000,
      text: ['홍대 작은 공연장. 누나가 좋아한다던 밴드의 공연이 끝났다.', '누나의 목소리가 쉬어 있다. "…소리 질렀더니 목 나갔네."'],
      good: { text: '"누나 오늘 진짜 즐거워 보였어요. 그거 보러 온 거예요."', reaction: '"…너 그런 말 어디서 배웠냐." 누나가 고개를 돌렸다. 손등이 살짝 닿았다.' },
      soft: { text: '"재밌었어요. 들어가요."', reaction: '"그래." 누나는 택시에 오르며 손을 한 번 흔들었다.' },
      pushy: { text: '"이제 우리 사귀는 거죠?" 바로 묻는다', reaction: '"내가 그렇게 쉬워 보이냐." 누나가 먼저 걸어갔다.' },
    },
  },
  {
    heroine: 'seorin',
    stage: 4,
    title: '인정받고 싶은 이유',
    desc: '"일 잘하는 후배 말고, 다른 사이가 되고 싶어요"라고 고백한다',
    scene: {
      activity: '서린 누나에게 고백',
      activityDesc: '연애 미션 ④ 서린',
      energy: 2,
      text: [
        '가게 셔터를 반쯤 내린 밤. 누나가 앞치마를 벗어 의자 등받이에 건다.',
        '"일은 끝났어." 누나는 계산대에 기댄 채 나를 보지 않고 말한다. "더 있다 갈지는 네가 정해."',
      ],
      good: { text: '"일 잘하는 후배 말고, 다른 사이가 되고 싶어요."', reaction: '누나가 한참 나를 본다. "…드디어 하네." 그리고 짧게. "좋아. 대신 도망가면 죽는다."' },
      soft: { text: '"…아니에요. 그냥 수고하셨다고요."', reaction: '"싱겁긴." 누나는 셔터를 마저 내렸다.' },
      pushy: { text: '"누나도 저 좋아하잖아요." 확답을 요구한다', reaction: '"건방지네." 누나의 눈빛이 고교 시절처럼 식었다.' },
    },
  },
  {
    heroine: 'seorin',
    stage: 5,
    title: '오늘은 조금 더 같이',
    desc: '서린의 집 초대와 외박 의사를 각각 확인한 뒤, 다음 날 아침까지 함께 보낸다',
    scene: {
      activity: '서린 누나 집 초대',
      activityDesc: '연애 미션 ⑤ 서린',
      energy: 3,
      cost: 30_000,
      text: ['누나의 작은 자취방. 고양이가 내 발밑을 맴돈다.', '영화가 끝나고, 누나가 리모컨을 내려놓는다. "…자고 가. 내가 그러고 싶어서 하는 말이야."'],
      good: { text: '"누나가 원하면요. 저도 그래요."', reaction: '그날 밤 이야기는 둘만의 것으로 남았다. 아침, 누나가 커피를 내밀었다. "아아. 샷 추가. 기억하지?"' },
      soft: { text: '"오늘은 들어갈게요. 다음에 또 와도 돼요?"', reaction: '"…그래. 언제든." 누나가 현관까지 배웅했다.' },
      pushy: { text: '누나가 머뭇거리는데도 다가간다', reaction: '"멈춰." 짧은 한마디에 방 안이 조용해졌다.' },
    },
  },

  /* ───── 한서윤 ───── */
  {
    heroine: 'seoyun',
    stage: 1,
    title: '공책 밖의 이야기',
    desc: '수업 후 대화를 제안하고, 서윤이 읽던 책에 관해 이야기를 나눈다',
    scene: {
      activity: '서윤이와 수업 후 대화',
      activityDesc: '연애 미션 ① 서윤',
      energy: 1,
      text: ['교양 수업이 끝났다. 서윤이 가방에 책 한 권을 넣는다. 표지가 낯익다.'],
      good: { text: '"그 책, 저도 읽었어요. 어디까지 봤어요?"', reaction: '"어, 진짜요?" 서윤의 눈이 커졌다. 다음 수업까지 이야기가 이어졌다.' },
      soft: { text: '"수업 수고했어요." 인사만 한다', reaction: '"네, 수고하셨어요." 서윤이 작게 고개를 숙였다.' },
      pushy: { text: '"그런 책 재미없지 않아요?"', reaction: '"…저는 재밌던데요." 서윤이 책을 가방 깊숙이 넣었다.' },
    },
  },
  {
    heroine: 'seoyun',
    stage: 2,
    title: '같이 고른 책 한 권',
    desc: '함께 서점에 가서 서로에게 책을 추천한다',
    scene: {
      activity: '서윤이와 서점',
      activityDesc: '연애 미션 ② 서윤',
      energy: 2,
      text: ['종로 대형 서점. 서윤이 소설 코너에서 한참을 고민한다.', '"추천해 주실래요? 제가 안 읽어 봤을 것 같은 걸로."'],
      good: { text: '고민 끝에 한 권을 골라 이유를 말해 준다', reaction: '서윤이 첫 장을 펼쳐 보고 웃었다. "이거 사 갈게요. 다 읽으면 얘기해요."' },
      soft: { text: '"베스트셀러가 무난하지 않을까요?"', reaction: '"아… 그렇죠." 서윤은 매대의 책을 하나 집었다.' },
      pushy: { text: '"이거 사요, 제가 사 줄게요." 계산대로 가져간다', reaction: '"아, 괜찮아요…" 서윤이 당황해 책을 도로 꽂았다.' },
    },
  },
  {
    heroine: 'seoyun',
    stage: 3,
    title: '오늘 일정에는 공부가 없다',
    desc: '스터디와 구분해 전시회 데이트를 약속하고 서로의 취향을 알아본다',
    scene: {
      activity: '서윤이와 전시회 (데이트)',
      activityDesc: '연애 미션 ③ 서윤',
      energy: 3,
      cost: 30_000,
      text: [
        '미술관을 나온 저녁. 원래는 전시만 보고 각자 과제를 하기로 한 날이다.',
        '"오늘은 공부 얘기 안 하기로 했죠." 서윤이 휴대폰 시계를 한 번 보고, 다시 주머니에 넣는다. "…저는 조금 더 같이 있고 싶은데."',
      ],
      good: { text: '"그럼 저녁도 같이 먹어요. 저도 그러고 싶었어요."', reaction: '서윤이 나를 돌아본다. "…오늘 데이트 맞죠? 저 그렇게 생각하고 나왔어요."' },
      soft: { text: '"오늘은 피곤하니까 들어가서 쉬어요. 다음에 또 봐요."', reaction: '"아… 네. 그래요." 서윤은 웃으며 손을 흔들었지만, 휴대폰을 다시 꺼내 시계를 봤다.' },
      pushy: { text: '"그럼 우리 집에서 더 있을래요?" 너무 빨리 들이댄다', reaction: '"…네?" 서윤이 한 걸음 물러섰다. "그런 뜻으로 말한 건 아니었어요." 돌아가는 길은 어색했다.' },
    },
  },
  {
    heroine: 'seoyun',
    stage: 4,
    title: '쪽지 대신 직접',
    desc: '쪽지에 숨기던 마음을 직접 말하고, 연인이 되기로 합의한다',
    scene: {
      activity: '서윤이에게 직접 고백',
      activityDesc: '연애 미션 ④ 서윤',
      energy: 2,
      text: ['도서관 옥상. 서윤이 노란 포스트잇을 하나 내민다. 빈 종이다.', '"오늘은… 여기 쓰지 말고 말로 해 주세요."'],
      good: { text: '"서윤 씨 좋아해요. 쪽지 말고, 옆에서 계속 말하고 싶어요."', reaction: '서윤이 포스트잇에 작게 썼다. "저도요." 그리고 그걸 내 손바닥에 붙였다.' },
      soft: { text: '"…조금만 더 생각해 볼게요."', reaction: '"네. 기다릴게요." 서윤은 포스트잇을 다시 접었다.' },
      pushy: { text: '"대답은 지금 해 줘요." 재촉한다', reaction: '"…지금은 대답 못 하겠어요." 서윤이 계단을 내려갔다.' },
    },
  },
  {
    heroine: 'seoyun',
    stage: 5,
    title: '책장 사이의 주말',
    desc: '둘이 고른 숙소에서 1박 북스테이를 하고 이야기를 나눈다',
    scene: {
      activity: '서윤이와 1박 북스테이',
      activityDesc: '연애 미션 ⑤ 서윤',
      energy: 4,
      cost: 120_000,
      text: ['파주의 북스테이. 벽 한 면이 전부 책장이다.', '서윤이 책을 덮고 작게 말한다. "…불 끌까요? 저, 오늘은 그러고 싶어요."'],
      good: { text: '"서윤 씨가 원하면요."', reaction: '그날 밤 이야기는 둘만의 것으로 남았다. 아침, 머리맡에 포스트잇이 붙어 있었다. "좋은 아침이에요."' },
      soft: { text: '"오늘은 책 얘기하다 잠들어요."', reaction: '서윤이 웃었다. "그것도 좋아요." 새벽까지 책 이야기가 이어졌다.' },
      pushy: { text: '서윤이 망설이는데도 재촉한다', reaction: '"…잠깐만요." 서윤이 이불을 끌어당겼다.' },
    },
  },
]

const mid = (h: CharId, stage: number) => `rom_${h}_${stage}`

const offerCondition = (s: RomanceSpec): Condition => {
  const req = STAGE_REQ[s.stage]
  const all: Condition[] = [
    { rel: s.heroine, met: true, h: req.h, t: req.t },
    { notFlag: `${mid(s.heroine, s.stage)}_blocked` },
  ]
  if (s.stage > 1) all.push({ flag: `mission_done_${mid(s.heroine, s.stage - 1)}` })
  if (s.stage === 3) all.push({ flag: `mutual_${s.heroine}` })
  if (s.stage === 4) all.push({ varName: `dates_${s.heroine}`, min: 2 })
  if (s.stage === 5) all.push({ flag: `couple_${s.heroine}` })
  return { all }
}

export const ROMANCE_MISSIONS: MissionDef[] = SPECS.map((s) => ({
  id: mid(s.heroine, s.stage),
  kind: 'romance',
  title: s.title,
  desc: s.desc,
  reward: STAGE_REQ[s.stage].reward,
  offerWeek: 1,
  offerWhen: offerCondition(s),
  deadlineAfter: 4,
  needsAccept: true,
  success: { flag: `${mid(s.heroine, s.stage)}_ok` },
  heroine: s.heroine,
  stage: s.stage,
  reofferable: true,
}))

export const ROMANCE_ACTIVITIES: ActivityDef[] = [
  ...SPECS.map((s) => {
    const id = mid(s.heroine, s.stage)
    return {
      id: `act_${id}`,
      name: s.scene.activity,
      desc: s.scene.activityDesc,
      energy: s.scene.energy,
      cost: s.scene.cost,
      perWeek: 1,
      requires: { all: [{ flag: `mission_${id}_active` }, { notFlag: `scene_${id}` }] },
      effects: [{ setFlag: `scene_${id}` }],
    } satisfies ActivityDef
  }),
  /* ③ 이후 데이트 누적 (④ 조건: 다른 날 데이트 2회) */
  ...(['haneul', 'seorin', 'seoyun'] as CharId[]).map(
    (h) =>
      ({
        id: `date_${h}`,
        name: `${{ haneul: '하늘이', seorin: '서린 누나', seoyun: '서윤이' }[h]}와 데이트`,
        desc: '호감 +3 · 신뢰 +2 · 데이트 횟수 +1',
        energy: 3,
        cost: 30_000,
        perWeek: 1,
        requires: { flag: `mission_done_${mid(h, 3)}` },
        effects: [{ rel: h, h: 3, t: 2, group: 'date' }, { addVar: `dates_${h}`, delta: 1 }],
      }) satisfies ActivityDef,
  ),
]

export const ROMANCE_EVENTS: EventDef[] = SPECS.map((s) => {
  const id = mid(s.heroine, s.stage)
  const stageBonus =
    s.stage === 2
      ? [{ if: { rel: s.heroine, h: 45 } as Condition, then: [{ setFlag: `mutual_${s.heroine}` }, { log: '서로 마음이 있다는 걸 알 것 같다.' }] }]
      : s.stage === 3
        ? [{ addVar: `dates_${s.heroine}`, delta: 1 }]
        : s.stage === 4
          ? [{ setFlag: `couple_${s.heroine}` }, { log: '연인이 되었다.' }]
          : []
  return {
    id: `scene_${id}`,
    title: s.title,
    week: { from: 1, to: 99 },
    when: { flag: `scene_${id}` },
    portrait: PORTRAIT[s.heroine],
    speaker: s.heroine,
    repeatable: true,
    order: 5,
    text: s.scene.text,
    choices: [
      {
        id: 'good',
        text: s.scene.good.text,
        effects: [
          { clearFlag: `scene_${id}` },
          { setFlag: `${id}_ok` },
          { rel: s.heroine, h: 3, t: 3, group: 'date' },
          ...stageBonus,
        ],
        reaction: s.scene.good.reaction,
      },
      {
        id: 'soft',
        text: s.scene.soft.text,
        effects: [{ clearFlag: `scene_${id}` }],
        reaction: s.scene.soft.reaction,
      },
      {
        id: 'pushy',
        text: s.scene.pushy.text,
        effects: [{ clearFlag: `scene_${id}` }, { rel: s.heroine, h: -6, t: -8 }, { setFlag: `${id}_blocked` }],
        reaction: s.scene.pushy.reaction,
      },
    ],
  }
})
