/**
 * 첫 시제품 사건 (대학 1학기 13주) — 기준: 시제품_사건12_대학.md r2
 * 등장인물 전원 만 20세 이상.
 */
import type { Condition, Effect, EventDef } from '../game/types'
import { PORTRAITS } from './characters'
import { ROMANCE_EVENTS } from './romance'
import { ACTIVITY_EVENTS } from './activityEvents'
import { STORY_EVENTS } from './storyEvents'

const CONFIDENT: Condition = { mental: { min: 50 } }
const CONFIDENT_HINT = '멘탈 50 이상 필요'

/* E08 가산·감산 (A~C 경로에만) */
const boothBonus: Effect[] = [
  { if: { rel: 'seorin', t: 20 }, then: [{ addVar: 'booth', delta: 1 }, { log: '서린 누나의 신뢰 덕에 일이 빨리 풀렸다.' }] },
  { if: { flag: 'cvs_order' }, then: [{ addVar: 'booth', delta: 1 }] },
  { if: { flag: 'missed_meeting' }, then: [{ addVar: 'booth', delta: -1 }] },
]

/* E11 트리거: 공개 인정 목격 · 인기 60+ · 직접 대화 조건 */
const E11_TRIGGER: Condition = {
  any: [
    { flag: 'saw_recognition' },
    { stat: 'popularity', min: 60 },
    { rel: 'haneul', h: 45, t: 60 },
  ],
}

/* E11 자각 성공 보상: 총합 15 고정 */
const awareReward: Effect[] = [
  {
    if: { flag: 'friend_reward_done' },
    then: [],
    else: [
      {
        if: { flag: 'friend_reward5' },
        then: [{ rel: 'haneul', h: 10, narrative: true }],
        else: [{ rel: 'haneul', h: 15, narrative: true }],
      },
      { setFlag: 'friend_reward_done' },
    ],
  },
  { setFlag: 'friend_aware' },
  { setFlag: 'e11_done' },
  {
    notice: {
      kind: 'diary',
      title: '회귀자의 일기',
      text: "'이날 하늘은 돌아섰다.' 그 문장이 번지더니, 처음 보는 한 줄이 나타났다. '여기서부터는 나도 모르는 미래다.'",
    },
  },
]

export const EVENTS: EventDef[] = [
  /* ───── E01 ───── */
  {
    id: 'E01',
    title: '복학 첫 주',
    week: { from: 1 },
    speaker: 'haneul',
    portrait: PORTRAITS.haneul,
    text: [
      '복학 첫 주. 강의실 맨 뒷줄. 앞자리 애들은 다 아는 사이 같고, 과 단톡방에서 내 이름을 아는 사람은 없다.',
      '학식에서 혼자 밥을 먹는데, 맞은편에 식판이 탁 놓인다.',
      '"야, 너 살아 있었냐? 전역했으면 연락을 해야지."',
      '정하늘. 어릴 때부터 옆집에 살던 애. 여전히 대충 묶은 머리에 후드티 차림이다.',
      '하늘이 가방 사이로 서류 봉투 하나가 삐죽 나와 있다. 내 시선을 느꼈는지 하늘이가 봉투를 쑥 밀어 넣는다. "아, 이거? 나중에 얘기해 줄게. 아직 확실한 게 아니라서."',
    ],
    choices: [
      {
        id: 'lonely',
        text: '"솔직히… 좀 외롭다. 아는 사람이 하나도 없어."',
        effects: [{ mental: 6 }, { rel: 'haneul', h: 1, t: 3, group: 'talk' }, { setFlag: 'told_friend' }, { setFlag: 'e01_opened' }],
        reaction: '하늘이가 젓가락을 멈추고 한참 보더니 웃는다. "그럼 나 있잖아. 바보냐."',
      },
      {
        id: 'fine',
        text: '"괜찮아. 할 만해."',
        effects: [{ mental: 2 }, { rel: 'haneul', t: -1 }, { setFlag: 'e01_opened' }],
        reaction: '"표정은 안 괜찮은데." 하늘이는 더 묻지 않고 반찬을 하나 덜어 준다.',
      },
      {
        id: 'snap',
        text: '"넌 인기 많아서 모르잖아."',
        effects: [{ rel: 'haneul', h: -3, t: -4 }, { setFlag: 'snapped_friend' }],
        reaction: '"…뭐래." 하늘이는 아무렇지 않은 척 밥을 먹었지만, 그날은 먼저 일어났다.',
      },
      {
        id: 'promise',
        text: '"중간고사 끝나는 날(7주 토요일) PC방 가자."',
        effects: [
          { setFlag: 'promise_pc' },
          { setFlag: 'e01_opened' },
          { reserveEnergy: { week: 7, amount: 2, key: 'pc' } },
        ],
        reaction: '"오, 콜. 지는 사람이 떡볶이." 하늘이가 새끼손가락을 내민다. 초등학생도 아니고.',
      },
    ],
  },

  /* ───── E02 ───── */
  {
    id: 'E02',
    title: '여분의 펜',
    week: { from: 2 },
    portrait: PORTRAITS.seoyun,
    onEnter: [{ setFlag: 'e02_seen' }],
    text: [
      '교양 수업. 옆자리 여학생이 필통을 뒤집어 보고, 가방을 들여다보고, 다시 필통을 본다. 손이 멈춘다.',
      '내 필통에는 펜이 세 자루 있다.',
      '뒷자리에서 누군가 "저 복학생 아저씨 또 혼자 앉았네" 하고 낄낄거리는 게 들린다.',
    ],
    choices: [
      {
        id: 'silent',
        text: '펜 하나를 말없이 그녀 책상 위로 밀어 둔다',
        effects: [{ meet: 'seoyun' }, { rel: 'seoyun', h: 3, t: 2, group: 'help' }, { setFlag: 'pen_silent' }],
        reaction: '그녀가 펜을 보고, 나를 보고, 작게 고개를 숙인다. 쉬는 시간에 노트 귀퉁이에 작은 글씨가 보였다. "고마워요."',
      },
      {
        id: 'asked',
        text: '"…이거 쓸래요?" 작게 묻는다',
        effects: [{ meet: 'seoyun' }, { rel: 'seoyun', h: 3, t: 2, group: 'help' }, { mental: 2 }, { setFlag: 'pen_asked' }],
        reaction: '"어? 아, 네. 고마워요." 생각보다 목소리가 컸는지 그녀가 먼저 웃는다. 나도 얼떨결에 따라 웃었다.',
      },
      {
        id: 'none',
        text: '못 본 척 화면을 본다',
        effects: [{ setFlag: 'pen_none' }],
        reaction: '그녀는 결국 앞자리 사람에게 펜을 빌렸다. 아무 일도 없었다. 오늘도.',
      },
      {
        id: 'brave',
        text: '"복학생 아저씨가 펜 빌려준대~" 비웃음이 들리지만, 그래도 건넨다',
        effects: [{ meet: 'seoyun' }, { rel: 'seoyun', h: 4, t: 3, group: 'help' }, { mental: -3 }, { setFlag: 'pen_brave' }],
        reaction: '그녀는 펜을 받으며 뒤를 한 번 돌아보고 또박또박 말했다. "네. 고마워서 받는 건데요." 웃음소리가 조금 줄었다.',
      },
    ],
  },

  /* ───── E02L (펜을 지나친 경우의 대체 첫 만남) ───── */
  {
    id: 'E02L',
    title: '도서관 계단',
    week: { from: 4 },
    when: { all: [{ flag: 'pen_none' }, { rel: 'seoyun', met: false }] },
    portrait: PORTRAITS.seoyun,
    text: ['도서관 계단에서 누군가 책을 와르르 떨어뜨린다. 교양 수업 옆자리였던 그 사람이다.'],
    choices: [
      {
        id: 'pick',
        text: '같이 주워 준다',
        effects: [{ meet: 'seoyun' }, { rel: 'seoyun', h: 2, t: 2, group: 'help' }, { setFlag: 'seoyun_helped' }],
        reaction: '"아, 교양 옆자리… 맞죠?" 그녀가 책을 받아 들며 웃는다. "한서윤이에요."',
      },
      {
        id: 'pass',
        text: '그냥 지나간다',
        effects: [],
        reaction: '뒤에서 책 줍는 소리가 한참 들렸다.',
      },
    ],
  },

  /* ───── E03 ───── */
  {
    id: 'E03',
    title: '돌아온 펜',
    week: { from: 3 },
    when: { any: [{ flag: 'pen_silent' }, { flag: 'pen_asked' }, { flag: 'pen_brave' }] },
    portrait: PORTRAITS.seoyun,
    order: 1,
    text: [
      '다음 교양 시간. 그녀가 펜과 함께 노란 포스트잇을 내민다. "한서윤이에요. 지난번에 고마웠어요."',
      '그런데 그녀가 바로 자리로 돌아가지 않는다. 수첩을 펼쳐 들고, 조금 망설이다가 먼저 묻는다.',
      '"저 학보사 기자인데요. 이번 호 주제가 \'다시 돌아온 사람들\'이에요. 복학생 인터뷰… 한 번만 해 주실 수 있어요? 솔직한 얘기면 좋겠어요."',
    ],
    choices: [
      {
        id: 'interview',
        text: '"…저 같은 사람 얘기도 괜찮으면요." 인터뷰를 수락한다',
        effects: [{ rel: 'seoyun', h: 2, t: 2, group: 'talk' }, { setFlag: 'e03_talk' }, { setFlag: 'seoyun_interview' }],
        reaction: '서윤이 수첩에 날짜를 적는다. "다음 주 수요일, 학생회관 2층이요. 저 질문 많이 해요. 각오하세요." 처음 보는 단호한 얼굴이었다.',
      },
      {
        id: 'note',
        text: '인터뷰는 사양하고, 포스트잇에 "대신 서윤 씨 얘기가 궁금해요"라고 써서 돌려준다',
        effects: [{ rel: 'seoyun', h: 3, t: 2, group: 'talk' }, { setFlag: 'note_exchange' }, { setFlag: 'e03_talk' }],
        reaction:
          '포스트잇을 읽은 서윤이 입을 가리고 웃는다. 수업이 끝날 때 노트 사이에 한 장이 더 끼워져 있었다. "저는 사람들 이야기를 사진이랑 글로 남기는 게 꿈이에요. 남의 얘기만 묻다가 제 얘기 질문받은 건 처음이네요."',
      },
      {
        id: 'name',
        text: '이름만 말하고 "인터뷰는 좀…" 정중히 거절한다',
        effects: [{ rel: 'seoyun', h: 2, t: 1, group: 'talk' }, { setFlag: 'e03_talk' }],
        reaction: '"아, 네. 괜찮아요." 서윤이 수첩을 덮는다. "그래도 마음 바뀌면 말해 주세요. 저 꽤 끈질겨요."',
      },
      {
        id: 'nod',
        text: '고개만 끄덕인다',
        effects: [],
        reaction: '"아… 네." 그녀는 조금 머쓱하게 펜을 돌려놓았다.',
      },
    ],
  },

  /* ───── E04 ───── */
  {
    id: 'E04',
    title: '거울 앞에서',
    week: { from: 3 },
    order: 2,
    text: [
      '자취방 거울 앞. 전역하고 한 번도 안 자른 머리, 군대 가기 전에 산 후드티.',
      '"이러니까 아저씨 소리를 듣지." 혼잣말이 나왔다.',
    ],
    choices: [
      {
        id: 'hair',
        text: '미용실에 간다 (3만 원)',
        requires: { money: 30_000 },
        showLocked: true,
        lockedHint: '돈 부족',
        effects: [{ money: -30_000 }, { special: 'hair' }],
        reaction: '"손님, 이마 드러내시는 게 훨씬 나아요." 거울 속 사람이 조금 낯설다.',
      },
      {
        id: 'clothes',
        text: '옷을 산다 (10만 원)',
        requires: { money: 100_000 },
        showLocked: true,
        lockedHint: '돈 부족',
        effects: [{ money: -100_000 }, { special: 'clothes' }],
        reaction: '점원이 골라 준 셔츠와 바지. 통장 잔고가 비었지만, 쇼윈도에 비친 모습이 나쁘지 않다.',
      },
      {
        id: 'gym',
        text: '운동부터 한다 (체력 2)',
        effects: [{ energy: -2 }, { stat: 'looks', delta: 1 }, { addVar: 'exercise', delta: 1 }, { setFlag: 'went_gym' }],
        reaction: '학교 앞 체육관에 등록했다. 첫날부터 팔이 떨린다.',
      },
      {
        id: 'skip',
        text: '그냥 둔다',
        effects: [],
        reaction: '거울을 등지고 누웠다. 다음에 하지 뭐.',
      },
    ],
  },

  /* ───── E04S: 서윤의 인터뷰 (서윤이 먼저 질문) ───── */
  {
    id: 'E04S',
    title: '수요일, 학생회관 2층',
    week: { from: 4 },
    when: { flag: 'seoyun_interview' },
    order: 3,
    portrait: PORTRAITS.seoyun,
    speaker: 'seoyun',
    text: [
      '서윤이 녹음 앱을 켜고 수첩을 펼친다. 질문지에는 형광펜이 잔뜩 칠해져 있다.',
      '"첫 질문이요. 군대 가기 전엔 어떤 사람이었어요?"',
      '"기사로 나가는 거니까 멋있게 말해도 돼요. …근데 저는 진짜 얘기가 더 궁금하긴 해요."',
    ],
    choices: [
      {
        id: 'honest',
        text: '"솔직히… 아무도 저를 몰랐어요. 그게 편하다고 생각했고요."',
        effects: [{ rel: 'seoyun', h: 2, t: 3, group: 'talk' }, { setFlag: 'interview_honest' }],
        reaction:
          '서윤이 녹음 버튼을 끈다. "이건 기사에 안 쓸게요." 잠깐 말이 없다가. "저도 고등학교 때 그랬어요. 그래서 남의 얘기를 묻는 일을 골랐어요. 질문하면, 적어도 혼자는 아니니까."',
      },
      {
        id: 'polished',
        text: '"새로 시작하려고 돌아왔습니다." 기사에 맞게 깔끔하게 답한다',
        effects: [{ stat: 'popularity', delta: 3 }, { rel: 'seoyun', t: 1, group: 'talk' }, { setFlag: 'interview_published' }],
        reaction:
          '"좋네요. 제목으로 쓸게요." 다음 주 학보 3면에 내 사진이 실렸다. 과 단톡방에 누군가 링크를 올렸다. "이 형 우리 과임?" 서윤은 기사 끝에 작게 적었다. — 인터뷰이는 끝까지 웃지 않았다.',
      },
    ],
  },

  /* ───── E05H: 하늘이 먼저 잡는 약속 (E01에서 약속을 안 했을 때) ───── */
  {
    id: 'E05H',
    title: '7주 토요일 비워 둬',
    week: { from: 5 },
    when: { notFlag: 'promise_pc' },
    order: 0,
    portrait: PORTRAITS.haneul,
    speaker: 'haneul',
    text: [
      '밤 11시, 하늘이에게서 톡이 온다.',
      '"7주 토요일, 중간고사 끝나는 날. 비워 둬."',
      '"할 얘기 있어. 카톡으로 하기엔 좀 길어."',
      '일기장의 첫 페이지가 떠오른다. 7주 토요일.',
    ],
    choices: [
      {
        id: 'ok',
        text: '"알았어. 무슨 얘긴데?"',
        effects: [{ setFlag: 'promise_pc' }, { reserveEnergy: { week: 7, amount: 2, key: 'pc' } }],
        reaction: '"얼굴 보고 할 거야. 늦으면 죽음." 읽음 표시가 뜨자마자 하늘이는 잠수를 탔다.',
      },
      {
        id: 'maybe',
        text: '"그날 과 일정이 생길 수도 있는데… 생기면 미리 말할게."',
        effects: [{ setFlag: 'promise_pc' }, { setFlag: 'warned_maybe' }, { reserveEnergy: { week: 7, amount: 2, key: 'pc' } }],
        reaction: '"그래. 대신 진짜 미리 말해. 그날 아니면 다른 날 잡으면 되니까." 장난 이모티콘 하나 없이 온 답장이었다.',
      },
    ],
  },

  /* ───── E04R: 첫 변화에 대한 반응 ───── */
  {
    id: 'E04R',
    title: '형, 달라졌네?',
    week: { from: 4, to: 6 },
    when: { varName: 'glowup', min: 8 },
    order: 0,
    portrait: PORTRAITS.haneulSmile,
    onEnter: [{ stat: 'popularity', delta: 3 }, { mental: 5 }, { rel: 'haneul', h: 1, group: 'remember' }],
    text: [
      '과 동기 하나가 강의실 앞에서 멈칫한다. "어? 형… 맞죠? 달라졌네?"',
      '점심때 하늘이는 내 머리를 손가락으로 툭 친다. "오, 사람 됐네."',
    ],
    choices: [{ id: 'ok', text: '머쓱하게 웃는다', effects: [], reaction: '별것 아닌데 하루 종일 기분이 좋았다.' }],
  },

  /* ───── E05-A: 편의점 ───── */
  {
    id: 'E05A',
    title: '마감 직전의 손님',
    week: { from: 5 },
    when: { all: [{ flag: 'worked_cvs' }, { notFlag: 'noona_met' }] },
    order: 1,
    portrait: PORTRAITS.seorin,
    text: [
      '편의점 야간 알바, 마감 20분 전. 검은 가죽 재킷을 입은 사람이 계산대에 어린이 감기약과 컵라면 두 개를 올려놓는다.',
      '"삑—" 카드 결제가 거절됐다. 한도 초과. 뒤에 손님 셋이 줄을 서 있다.',
      '그 사람의 턱에 힘이 들어가는 게 보였다.',
    ],
    choices: [
      {
        id: 'face',
        text: '"포스기가 가끔 이래요." 뒷손님부터 계산하고 조용히 다시 묻는다',
        effects: [{ meet: 'seorin' }, { rel: 'seorin', h: 3, t: 4, group: 'help' }, { setFlag: 'noona_saved_face' }, { setFlag: 'noona_met' }],
        reaction: '줄이 빠진 뒤 그녀가 다른 카드를 내민다. 결제가 된다. 나가면서 한마디. "…눈치는 있네."',
      },
      {
        id: 'pay',
        text: '내 돈으로 대신 계산한다 (8,000원)',
        requires: { money: 8_000 },
        effects: [{ meet: 'seorin' }, { money: -8_000 }, { rel: 'seorin', h: 1, t: -1 }, { setFlag: 'noona_pitied' }, { setFlag: 'noona_met' }],
        reaction: '"뭐 하는 거야." 차가운 목소리. 그녀는 다음 날 8,000원을 계산대에 탁 놓고 갔다.',
      },
      {
        id: 'rule',
        text: '규정대로 "결제가 안 됩니다"라고 안내한다',
        effects: [{ meet: 'seorin' }, { setFlag: 'noona_met' }],
        reaction: '그녀는 아무 말 없이 컵라면을 빼고 약만 현금으로 샀다.',
      },
    ],
  },

  /* ───── E05-B: 체육관 ───── */
  {
    id: 'E05B',
    title: '허리 나간다',
    week: { from: 5 },
    when: { all: [{ flag: 'went_gym' }, { notFlag: 'noona_met' }] },
    order: 2,
    portrait: PORTRAITS.seorin,
    text: [
      '체육관. 관장님 대신 PT를 맡았다는 사람이 팔짱을 끼고 내 데드리프트를 본다.',
      '"그렇게 하면 허리 나가." 짧은 머리, 무표정. 관원들이 슬금슬금 자리를 피한다.',
    ],
    choices: [
      {
        id: 'learn',
        text: '순순히 배운다',
        effects: [{ meet: 'seorin' }, { rel: 'seorin', h: 2, t: 2, group: 'help' }, { setFlag: 'noona_met' }],
        reaction: '"엉덩이 뒤로. 그렇지." 그녀는 딱 세 번 고쳐 주고 갔다.',
      },
      {
        id: 'self',
        text: '"알아서 할게요."',
        effects: [{ meet: 'seorin' }, { rel: 'seorin', h: 1 }, { setFlag: 'noona_met' }],
        reaction: '"그래. 허리 나가면 그때 와." 그녀가 처음으로 피식 웃었다.',
      },
      {
        id: 'grit',
        text: '지적받은 자세를 고친 뒤 끝까지 해낸다 (체력 2)',
        effects: [
          { meet: 'seorin' },
          { energy: -2 },
          { rel: 'seorin', h: 3, t: 2, group: 'help' },
          { setFlag: 'noona_grit' },
          { setFlag: 'noona_met' },
        ],
        reaction: '마지막 세트가 끝나자 그녀가 물병을 던져 준다. "독하네. 이름이 뭐야?"',
      },
    ],
  },

  /* ───── E05-C: 기본 경로 ───── */
  {
    id: 'E05C',
    title: '부스 첫 회의',
    week: { from: 6 },
    when: { notFlag: 'noona_met' },
    order: 1,
    portrait: PORTRAITS.seorin,
    text: [
      '과 축제 부스 첫 회의. 웅성거리던 강의실이 한 사람이 들어오자 조용해진다.',
      '"이번 부스 내가 맡는다. 강서린. 일할 사람?" 아무도 손을 들지 않는다.',
      '옆자리 후배가 속삭인다. "저 선배 진짜 무서워요."',
    ],
    choices: [
      {
        id: 'hand',
        text: '손을 든다',
        effects: [{ meet: 'seorin' }, { rel: 'seorin', h: 2, t: 3, group: 'help' }, { setFlag: 'noona_met' }, { setFlag: 'noona_met_booth' }],
        reaction: '그녀의 시선이 나에게 꽂힌다. "복학생? 좋아. 너 내 옆."',
      },
      {
        id: 'ifasked',
        text: '"시키면 할게요."',
        effects: [{ meet: 'seorin' }, { rel: 'seorin', t: 1 }, { setFlag: 'noona_met' }, { setFlag: 'noona_met_booth' }],
        reaction: '"시킬게." 그녀가 명단에 내 이름을 적는다.',
      },
      {
        id: 'quiet',
        text: '조용히 있는다',
        effects: [{ meet: 'seorin' }, { setFlag: 'noona_met' }, { setFlag: 'noona_silent' }],
        reaction: '회의가 끝날 때까지 그녀와 눈이 마주치지 않았다. …아마도.',
      },
    ],
  },

  /* ───── E06-F ───── */
  {
    id: 'E06F',
    title: '자취방 라면',
    week: { from: 6 },
    order: 2,
    portrait: PORTRAITS.haneulSmile,
    text: ['밤 10시. 초인종도 없이 문이 열린다. 하늘이가 라면 두 봉지를 흔든다.', '"너네 집 냄비 아직 있냐?"'],
    choices: [
      {
        id: 'listen',
        text: '고민을 들어 준다',
        effects: [{ rel: 'haneul', h: 3, t: 3, group: 'talk' }, { setFlag: 'heard_friend' }],
        reaction:
          '라면이 다 불도록 하늘이는 취업 얘기를 했다. 그러다 가방에서 일본어 단어장이 떨어졌다. 하늘이가 재빨리 주워 넣는다. "…이건 토요일에 말할게. 이런 얘기 너한테만 한다."',
      },
      {
        id: 'game',
        text: '게임하면서 수다 떤다',
        effects: [{ rel: 'haneul', h: 2, group: 'talk' }, { setFlag: 'e06f_game' }],
        reaction: '새벽 2시까지 3연패. "너 군대에서 게임 안 했냐?"',
      },
      {
        id: 'tired',
        text: '피곤하다고 돌려보낸다',
        effects: [{ rel: 'haneul', t: -1 }],
        reaction: '"아, 그래? 그럼 잘 자." 문이 닫히고 라면 한 봉지가 신발장 위에 남아 있었다.',
      },
    ],
  },

  /* ───── E06 ───── */
  {
    id: 'E06',
    title: '누나의 사정',
    week: { from: 7 },
    when: { flag: 'noona_met' },
    order: 1,
    portrait: PORTRAITS.seorin,
    text: [
      '늦은 밤, 학교 앞 작은 분식집. 셔터를 내리는 사람이 서린 누나다.',
      '안에서 아주머니 목소리가 들린다. "서린아, 이번 달 이자는…" 누나가 "내가 알아서 해"라고 끊는다.',
      '다음 날, 과 단톡방에는 "그 무서운 선배 밤마다 어디 간대" 같은 소문이 돌고 있다.',
    ],
    choices: [
      {
        id: 'keep',
        text: '모른 척 비밀을 지킨다',
        effects: [
          { rel: 'seorin', t: 5, group: 'help' },
          { setFlag: 'noona_secret_kept' },
          { setFlag: 'noona_e06_done' },
          { setFlag: 'booth_plan_assigned' },
        ],
        reaction:
          '며칠 뒤, 누나가 지나가며 말했다. "단톡 봤어. 너는 아무 말 안 하더라." 그리고 서류 한 장을 내민다. "부스 동선안. 네가 짜. 토요일 회의 때 네가 설명하고."',
      },
      {
        id: 'tell',
        text: '"저 아무한테도 말 안 했어요." 직접 말한다',
        effects: [
          { rel: 'seorin', h: 2, t: 4, group: 'talk' },
          { setFlag: 'noona_secret_kept' },
          { setFlag: 'noona_e06_done' },
          { setFlag: 'booth_plan_assigned' },
        ],
        reaction:
          '누나가 한참 나를 본다. "…봤구나." 그리고 짧게. "고맙다." 다음 날 누나가 메시지를 보냈다. "부스 동선안 네가 짜. 토요일 회의에서 네가 설명해. 말로 고마운 건 이걸로 갚아."',
      },
      {
        id: 'leak',
        text: '단톡방에 누나 사정을 설명해 소문을 해명한다',
        effects: [{ rel: 'seorin', h: -6, t: -15 }, { setFlag: 'noona_secret_leaked' }, { setFlag: 'noona_e06_done' }],
        reaction: '소문은 멈췄다. 대신 누나는 다음 날부터 나를 보지 않았다. "남의 집 일을 왜 네가 떠들어."',
      },
      {
        id: 'lend',
        text: '50만 원을 빌려주겠다고 한다',
        effects: [{ rel: 'seorin', t: -2 }, { setFlag: 'noona_pitied' }, { setFlag: 'noona_e06_done' }],
        reaction: '"불쌍해 보이냐?" 누나의 눈빛이 식었다. "넣어 둬."',
      },
    ],
  },

  /* ───── E07 ───── */
  {
    id: 'E07',
    title: '같은 날의 두 약속',
    week: { from: 7 },
    when: { flag: 'promise_pc' },
    order: 2,
    portrait: PORTRAITS.haneul,
    text: [
      '중간고사 마지막 날 오후. 하늘이에게서 톡이 온다.',
      '"토요일 7시 기억하지? 근데 이번엔 게임 말고… 너한테 할 얘기가 있어. 진지한 거."',
      '10분 뒤, 서린 누나의 메시지.',
      '"토요일 7시 부스 회의. 빠지는 사람은 개인 연락."',
      '책상 위의 일기장이 저절로 펼쳐져 있다. 7주 토요일. "나는 과 회의를 핑계로 가지 않았고, 연락도 하지 않았다."',
    ],
    textIf: [
      {
        if: { flag: 'booth_plan_assigned' },
        text: '누나의 메시지가 하나 더 온다. "그리고 네가 짠 동선안, 네가 직접 설명해. 이번엔 네 이름으로 올릴 거야."',
      },
      {
        if: { flag: 'warned_maybe' },
        text: '하늘이에게 "과 일정 생기면 미리 말할게"라고 했던 게 떠오른다. 지금이 그 "미리"다.',
      },
    ],
    choices: [
      {
        id: 'keep',
        text: '하늘이에게 간다. 회의는 빠진다고 누나에게만 연락한다 (체력 2)',
        effects: [
          { energy: -2 },
          { rel: 'haneul', t: 6, group: 'promise' },
          { setFlag: 'promise_kept' },
          { setFlag: 'missed_meeting' },
          { setFlag: 'heard_exchange' },
          { setFlag: 'presenter_other' },
          { releaseReservation: 'pc' },
        ],
        reaction:
          '하늘이는 PC방이 아니라 학교 앞 벤치에 앉아 있었다. 무릎 위에 서류 봉투. "일본 교환학생. 2학기부터 1년. 붙을지는 모르겠는데, 낼까 말까 고민 중이야." 하늘이가 처음으로 장난 없이 나를 본다. "…넌 어떻게 생각해? 솔직하게." 회의에서는 다른 동기가 내 동선안을 대신 발표했다고, 밤늦게 누나에게서 짧은 메시지가 왔다. "다음엔 네가 해."',
      },
      {
        id: 'change',
        text: '하늘이에게 미리 사정을 말하고, 회의에서 내 안을 직접 발표한다',
        effects: [
          { rel: 'haneul', h: -1, t: -2 },
          { rel: 'seorin', t: 2, group: 'help' },
          { setFlag: 'promise_changed' },
          { setFlag: 'presented_plan' },
          { releaseReservation: 'pc' },
        ],
        reaction:
          '"…알았어. 회의 잘해." 하늘이는 그렇게 답하고 10분 뒤에 한 줄을 더 보냈다. "다음 주 화요일. 그날은 진짜야." 회의실에서 나는 처음으로 사람들 앞에서 내 이름이 적힌 안을 설명했다. 누나는 팔짱을 낀 채 끝까지 듣고 한 단어만 말했다. "통과."',
      },
      {
        id: 'both',
        text: '두 사람에게 사정을 말하고 시간을 조정해 본다 (체력 4)',
        requires: { energyAfter: { cost: 4, min: -3 } },
        showLocked: true,
        lockedHint: '체력 부족 (행동 후 -3 미만)',
        effects: [
          { energy: -4 },
          { rel: 'haneul', t: 3, group: 'promise' },
          { setFlag: 'promise_kept' },
          { setFlag: 'promise_adjusted' },
          {
            if: { rel: 'seorin', t: 20 },
            then: [{ rel: 'seorin', t: 1, group: 'help' }, { setFlag: 'presented_plan' }],
            else: [{ setFlag: 'presenter_other' }],
          },
          { releaseReservation: 'pc' },
        ],
        reaction:
          '누나는 "회의는 회의야"라며 순서를 바꿔 주지 않았다. 동선안은 다른 동기가 발표했다. 나는 회의 중간에 빠져나와 하늘이에게 달려갔다. 40분 지각. 하늘이는 서류 봉투를 무릎에 올려 둔 채 말했다. "시간 없지? 그럼 반만 말할게. …나 일본 갈지도 몰라. 나머지는 다음에."',
        reactionIf: [
          {
            if: { rel: 'seorin', t: 20 },
            text: '누나는 잠깐 생각하더니 "네 순서 맨 앞. 15분."이라고 답했다. 나는 동선안을 설명하자마자 회의실을 나와 하늘이에게 달려갔다. 20분 지각. 하늘이는 서류 봉투를 무릎에 올려 둔 채 말했다. "시간 없지? 그럼 반만 말할게. …나 일본 갈지도 몰라. 나머지는 다음에."',
          },
        ],
      },
      {
        id: 'ditch',
        text: '연락 없이 회의에 간다 (체력 2)',
        effects: [
          { energy: -2 },
          { rel: 'haneul', h: -6, t: -10 },
          { setFlag: 'promise_broken' },
          { setFlag: 'presented_plan' },
          { releaseReservation: 'pc' },
        ],
        reaction:
          '회의는 잘 끝났다. 밤 9시, 하늘이의 마지막 톡. "ㅇㅋ." 읽음 표시가 오래 남았다. 일기장의 문장은 한 글자도 바뀌지 않았다.',
      },
    ],
  },

  /* ───── E07K: 토요일 벤치 (약속을 지킨 경우, 같은 주) ───── */
  {
    id: 'E07K',
    title: '토요일 7시, 벤치',
    week: { from: 7 },
    when: { all: [{ flag: 'heard_exchange' }, { notFlag: 'promise_adjusted' }] },
    order: 3,
    portrait: PORTRAITS.haneul,
    speaker: 'haneul',
    text: [
      '"…넌 어떻게 생각해? 솔직하게."',
      '하늘이는 대답을 기다리는 동안 봉투 모서리만 접었다 폈다 한다. 늘 먼저 말을 끊던 애가 오늘은 가만히 기다린다.',
    ],
    choices: [
      {
        id: 'go',
        text: '"가. 너 그거 오래 준비했잖아."',
        effects: [{ rel: 'haneul', t: 3, group: 'talk' }, { setFlag: 'told_go' }],
        reaction: '"역시 그렇게 말할 줄 알았어." 하늘이가 웃으며 일어선다. "떡볶이 먹으러 가자. 오늘은 내가 쏜다." 봉투를 쥔 손에 힘이 조금 들어가 있었다.',
      },
      {
        id: 'ask',
        text: '"네가 가고 싶은지부터 듣고 싶어."',
        effects: [{ rel: 'haneul', h: 2, t: 2, group: 'talk' }, { setFlag: 'asked_her_mind' }],
        reaction: '하늘이가 한참 말이 없다. "…모르겠어. 가고 싶은데, 여기 두고 가는 게 좀 걸려." 무엇이 걸리는지는 말하지 않았다. 대신 내 어깨를 한 번 툭 쳤다. "아, 몰라. 떡볶이나 먹자."',
      },
    ],
  },

  /* ───── E07R: 미뤄진 이야기 (사전 변경·일정 조정한 경우, 8주) ───── */
  {
    id: 'E07R',
    title: '화요일, 미뤄진 이야기',
    week: { from: 8 },
    when: { any: [{ flag: 'promise_changed' }, { flag: 'promise_adjusted' }] },
    order: 0,
    portrait: PORTRAITS.haneul,
    speaker: 'haneul',
    text: ['화요일 저녁, 학교 앞 벤치. 하늘이가 먼저 와 있다. 무릎 위에 서류 봉투.'],
    textIf: [
      {
        if: { flag: 'promise_changed' },
        text: '"토요일엔 좀 서운했어. 근데 미리 말해 준 건… 고마웠어. 예전 너였으면 그냥 안 왔을 거야."',
      },
      {
        if: { flag: 'promise_adjusted' },
        text: '"토요일엔 너 숨넘어가는 거 보느라 반밖에 못 했잖아. 오늘은 끝까지 할게."',
      },
      { if: { flag: 'promise_pc' }, text: '"나, 일본 교환학생 지원하려고. 2학기부터 1년. 마감은 이번 주 금요일. …넌 어떻게 생각해?"' },
    ],
    choices: [
      {
        id: 'go',
        text: '"가. 너 그거 오래 준비했잖아."',
        effects: [{ rel: 'haneul', t: 3, group: 'talk' }, { setFlag: 'heard_exchange_late' }, { setFlag: 'told_go' }],
        reaction: '하늘이가 피식 웃는다. "역시 그렇게 말할 줄 알았어." 그런데 봉투를 쥔 손에 힘이 조금 들어가 있었다.',
      },
      {
        id: 'ask',
        text: '"네가 가고 싶은지부터 듣고 싶어."',
        effects: [{ rel: 'haneul', h: 2, t: 2, group: 'talk' }, { setFlag: 'heard_exchange_late' }, { setFlag: 'asked_her_mind' }],
        reaction: '하늘이가 한참 말이 없다. "…모르겠어. 가고 싶은데, 여기 두고 가는 게 좀 걸려." 무엇이 걸리는지는 말하지 않았다.',
      },
    ],
  },

  /* ───── E07-N ───── */
  {
    id: 'E07N',
    title: '밤 11시의 과방',
    week: { from: 8 },
    when: { flag: 'noona_met' },
    portrait: PORTRAITS.seorin,
    text: ['부스 준비 마지막 날 밤 11시. 다들 하나둘 빠지고, 과방에는 누나와 나만 남았다.', '누나가 박스 테이프를 뜯으며 말한다. "너도 가. 내가 마저 할게."'],
    choices: [
      {
        id: 'stay',
        text: '끝까지 남아 정리한다 (체력 2)',
        effects: [{ energy: -2 }, { rel: 'seorin', h: 2, t: 6, group: 'help' }, { setFlag: 'stayed_late' }],
        reaction: '새벽 1시. 마지막 박스를 쌓자 누나가 캔커피를 내민다. "…수고했어."',
      },
      {
        id: 'go',
        text: '먼저 들어간다',
        effects: [],
        reaction: '"내일 봐." 누나는 고개도 들지 않았다.',
      },
      {
        id: 'snack',
        text: '편의점에서 야식을 사 온다 (6,000원)',
        requires: { money: 6_000 },
        showLocked: true,
        lockedHint: '돈 부족',
        effects: [{ money: -6_000 }, { rel: 'seorin', h: 3, t: 2, group: 'gift' }, { setFlag: 'noona_snack' }],
        reaction: '"떡볶이? …매운 거 어떻게 알았어." 누나가 처음으로 의자를 끌어다 앉았다.',
      },
    ],
  },

  /* ───── E08 ───── */
  {
    id: 'E08',
    title: '축제 전날, 부스 위기',
    week: { from: 9 },
    order: 1,
    portrait: PORTRAITS.seorin,
    text: [
      '축제 전날 밤. 근무표가 엉망이다. 같은 시간에 다섯 명이 겹치고, 아무도 없는 시간이 있다.',
      '설상가상으로 내일 쓸 재료 발주가 빠져 있었다.',
      '서린 누나가 근무표를 내 앞에 내려놓는다. "너 해."',
      '누나는 밤을 새워서라도 몸으로 밀어붙이자는 쪽이고, 나는 표부터 다시 짜자는 쪽이다. "말 길게 할 시간 없어. 네 방식이면 네 방식대로 증명해."',
    ],
    textIf: [
      { if: { flag: 'presented_plan' }, text: '"동선은 네가 짠 거니까 네가 끝까지 책임져. 난 재료 쪽 뛴다."' },
      { if: { flag: 'presenter_other' }, text: '"토요일에 네 안 대신 발표한 애는 오늘 연락이 안 돼. 결국 너야."' },
      { if: { flag: 'stayed_late' }, text: '어젯밤 새벽까지 같이 박스를 쌓던 누나가, 오늘은 내 쪽을 먼저 본다.' },
      { if: { flag: 'classmate_trust' }, text: '휴대폰이 울린다. 휴학 고민을 들어 줬던 동기다. "형, 축제 때 필요하면 부르라고 했죠? 지금 갈게요."' },
      { if: { flag: 'carried_team' }, text: '조별과제를 혼자 끝냈던 밤이 떠오른다. 그때처럼 혼자 다 할 수도 있다. 이번에도 그게 맞을까.' },
    ],
    choices: [
      {
        id: 'records',
        text: '준비 기록을 펼쳐 정리하고, 거래처에 재주문한다',
        requires: { any: [{ stat: 'academics', min: 50 }, { flag: 'cvs_order' }] },
        showLocked: true,
        lockedHint: '학업 50 이상 또는 편의점 발주 경험',
        effects: [{ addVar: 'booth', delta: 2 }, ...boothBonus, { setFlag: 'e08_done' }, { setFlag: 'booth_did_role' }],
        reaction: '엑셀 하나에 근무표와 재고를 다 넣었다. 거래처 사장님이 "내일 아침 8시"라고 답했다.',
      },
      {
        id: 'coord',
        text: '사람들을 모아 근무를 다시 짜고, 옆 과 부스와 재료를 맞교환한다',
        // 과 동기들과 어울려 둔 경우(활동 사건)에도 열림
        requires: { any: [{ stat: 'personality', min: 50 }, { flag: 'has_classmates' }] },
        showLocked: true,
        lockedHint: '성격 50 이상 또는 과 동기들과 친해지기',
        effects: [{ addVar: 'booth', delta: 2 }, ...boothBonus, { setFlag: 'e08_done' }, { setFlag: 'booth_did_role' }],
        reaction: '"제가 3시 타임 할게요." 한 명이 손을 들자 줄줄이 따라 들었다. 옆 과 부스는 양파를 주고 소주잔을 받아 갔다.',
      },
      {
        id: 'help',
        text: '도움을 요청하고, 내가 맡은 일은 끝까지 한다',
        effects: [
          { addVar: 'booth', delta: 1 },
          ...boothBonus,
          {
            if: { flag: 'note_exchange' },
            then: [{ log: '서윤이 마트까지 같이 가 줬다.' }],
            else: [{ log: '하늘이가 투덜대면서 마트까지 같이 가 줬다.' }],
          },
          { setFlag: 'e08_done' },
          { setFlag: 'booth_did_role' },
        ],
        reaction: '마트에서 재료를 양손 가득 들고 돌아왔다. 근무표는 반쯤 해결됐다.',
      },
      {
        id: 'skip',
        text: '"저는 잘 모르겠어요." 빠진다',
        effects: [{ setFlag: 'e08_done' }],
        reaction: '누나가 근무표를 다시 가져간다. 아무 말도 하지 않았다.',
      },
    ],
  },

  /* ───── E09 대표 반전 ───── */
  {
    id: 'E09',
    title: '판이 뒤집힌 날',
    week: { from: 9 },
    when: { all: [{ flag: 'e08_done' }, { varName: 'booth', min: 3 }] },
    order: 2,
    portrait: PORTRAITS.seorin,
    onEnter: [
      { stat: 'popularity', delta: 15 },
      { mental: 10 },
      { rel: 'seorin', h: 5, t: 5, narrative: true },
      { setFlag: 'recognized' },
      { setFlag: 'saw_recognition' },
    ],
    text: [
      '축제 첫날 밤 9시. 과 부스 앞에 줄이 골목까지 늘어섰다. 어제까지 엉망이던 근무표는 지금 내 손에 있다.',
      '학생회 선배가 다가와 부스를 훑어본다. "올해 2학년 부스 누가 굴렸어? 작년엔 개판이었는데."',
      '사람들 시선이 서린 누나에게 간다. 누나가 앞치마를 벗으며 고개로 나를 가리킨다.',
      '"내가 맡겼고, 얘가 해냈어. 다음에도 같이 할 거야."',
      '3초쯤 조용했다. 누군가 작게 "…복학생 형이?"라고 했다. 하늘이가 들고 있던 컵을 내려놓는 게 보였다.',
    ],
    textIf: [
      { if: { flag: 'presented_plan' }, text: '누나가 한마디를 덧붙인다. "동선도 얘가 짰어. 회의 때 직접 설명한 거 기억하지?"' },
      { if: { flag: 'interview_published' }, text: '"아, 학보에 나온 그 형이구나." 누군가 휴대폰으로 기사를 찾아 보여 준다.' },
      { if: { flag: 'has_classmates' }, text: '단톡방에서 매일 떠들던 동기들이 부스 앞으로 몰려와 소리친다. "우리 형이다!"' },
      { if: { flag: 'gym_buddy' }, text: '체육관에서 랙을 나눠 쓰던 3학년 선배가 엄지를 들어 보인다.' },
    ],
    choices: [
      {
        id: 'credit',
        text: '"누나가 다 정리해 준 거예요." 공을 돌린다',
        effects: [{ rel: 'seorin', t: 2, group: 'talk' }, { stat: 'popularity', delta: 2 }],
        reaction: '누나가 눈썹을 올린다. "겸손 떨지 마. 재수 없어." 그런데 입꼬리가 올라가 있었다.',
      },
      {
        id: 'own',
        text: '"네, 제가 했습니다." 짧게 인정한다',
        requires: { mental: { min: 50 } },
        showLocked: true,
        lockedHint: '멘탈 50 이상 필요',
        effects: [{ stat: 'popularity', delta: 3 }, { mental: 3 }],
        reaction: '"오—" 하는 소리가 부스 전체로 번졌다. 누나가 내 어깨를 툭 친다. "그렇지."',
      },
      {
        id: 'work',
        text: '어색하게 웃고 다시 일하러 간다',
        effects: [],
        reaction: '뒤에서 수군거리는 소리가 들린다. 비웃음이 아니었다. "저 형 원래 저랬어?"',
      },
    ],
  },
  {
    id: 'E09P',
    title: '나쁘지 않았어',
    week: { from: 9 },
    when: { all: [{ flag: 'e08_done' }, { varName: 'booth', min: 1, max: 2 }] },
    order: 2,
    portrait: PORTRAITS.seorin,
    onEnter: [{ stat: 'popularity', delta: 3 }, { setFlag: 'partial' }],
    text: ['축제는 그럭저럭 굴러갔다. 마감 후 쓰레기봉투를 묶는데, 누나가 옆에 와서 선다.', '"…나쁘지 않았어. 2학기 행사 때 또 해 봐."'],
    choices: [{ id: 'ok', text: '"네. 다음엔 더 잘할게요."', effects: [{ setFlag: 'retry_next_term' }], reaction: '누나가 고개를 끄덕였다. 다음 기회가 생겼다.' }],
  },
  {
    id: 'E09F',
    title: '혼자 수습한 밤',
    week: { from: 9 },
    when: { all: [{ flag: 'e08_done' }, { varName: 'booth', max: 0 }] },
    order: 2,
    portrait: PORTRAITS.seorin,
    onEnter: [{ mental: -5 }],
    text: ['축제 내내 부스는 삐걱거렸다. 누나가 혼자 뛰어다니며 수습했다.', '나는 계산대 뒤에서 그 모습을 보기만 했다.'],
    choices: [{ id: 'ok', text: '다음엔 다르게 하겠다고 다짐한다', effects: [], reaction: '아직 시간은 있다.' }],
  },

  /* ───── E10 ───── */
  {
    id: 'E10S',
    title: '인기가 생긴 뒤',
    week: { from: 10 },
    when: { all: [{ flag: 'note_exchange' }, { rel: 'seoyun', met: true }] },
    portrait: PORTRAITS.seoyun,
    onEnter: [{ setFlag: 'e10_seen' }],
    text: [
      '축제 이후 과 단톡방에서 내 이름이 자주 나온다. 인싸 무리가 금요일 술자리에 부른다.',
      '같은 시간, 서윤이와의 스터디 약속이 있다. 약속을 먼저 잡은 건 서윤이었다. "금요일 7시 도서관이요. 이번엔 제가 질문 말고 제 얘기 할 차례예요."',
    ],
    textIf: [
      { if: { flag: 'interview_honest' }, text: '"아, 그 인터뷰 기사요. 결국 안 냈어요. 그 얘기는 저만 갖고 있고 싶어서요."' },
    ],
    choices: [
      {
        id: 'keep',
        text: '서윤이와의 약속을 지킨다',
        effects: [{ rel: 'seoyun', t: 4, group: 'promise' }, { setFlag: 'e10_good' }, { setFlag: 'seoyun_shared_goal' }],
        reaction:
          '"진짜 왔네요." 서윤이가 노트에 날짜를 적는다. "약속 지킨 사람." 그리고 정말로 자기 얘기를 했다. 졸업 전에 사람들 인터뷰를 모아 사진집을 내고 싶다고. "출판사에 원고 보낼 거예요. 떨어져도 계속 보낼 거고요." 조용한 목소리인데, 물러설 생각이 하나도 없는 말투였다.',
      },
      {
        id: 'party',
        text: '술자리에 간다',
        effects: [{ stat: 'popularity', delta: 5 }, { rel: 'seoyun', h: -2, t: -3 }],
        reaction: '재밌었다. 새벽에 확인한 톡에는 "괜찮아요, 다음에 해요"만 와 있었다. 서윤이가 하려던 자기 얘기는, 그 뒤로 다시 나오지 않았다.',
      },
      {
        id: 'invite',
        text: '"서윤이도 같이 가도 돼요?" 제안한다',
        requires: { stat: 'personality', min: 50 },
        showLocked: true,
        lockedHint: '성격 50 이상',
        effects: [{ stat: 'popularity', delta: 3 }, { rel: 'seoyun', t: 2, group: 'talk' }, { setFlag: 'e10_good' }],
        reaction: '서윤이는 구석에서 콜라만 마셨지만, 돌아오는 길에 "생각보다 재밌었어요"라고 했다.',
      },
      {
        id: 'brag',
        text: '술자리에 가서 하늘이 얘기를 가볍게 떠벌린다',
        effects: [{ stat: 'popularity', delta: 5 }, { rel: 'haneul', t: -8 }, { setFlag: 'ignored_friend' }, { setFlag: 'friend_conflict_open' }],
        reaction: '"정하늘이랑 소꿉친구라고? 대박." 다들 웃었다. 그 얘기는 이틀 만에 하늘이 귀에 들어갔다.',
      },
    ],
  },
  {
    id: 'E10H',
    title: '인기가 생긴 뒤',
    week: { from: 10 },
    when: { notFlag: 'note_exchange' },
    portrait: PORTRAITS.haneul,
    onEnter: [{ setFlag: 'e10_seen' }],
    text: [
      '축제 이후 과 단톡방에서 내 이름이 자주 나온다. 인싸 무리가 금요일 술자리에 부른다.',
      '같은 시간, 하늘이와 밥 약속이 있다. 하늘이가 먼저 잡은 약속이다. "금요일 국밥. 네가 쏘는 거다."',
    ],
    textIf: [
      {
        if: { any: [{ flag: 'heard_exchange' }, { flag: 'heard_exchange_late' }, { flag: 'promise_adjusted' }] },
        text: '"그리고 교환학생 서류 결과 나왔어. 그날 얘기해 줄게."',
      },
      {
        if: { flag: 'diary_d_friday_shown' },
        text: '일기장의 문장이 떠오른다. "다음 주 금요일, 나는 약속을 술자리로 바꿨다."',
      },
    ],
    choices: [
      {
        id: 'keep',
        text: '하늘이와의 약속을 지킨다',
        effects: [{ rel: 'haneul', t: 4, group: 'promise' }, { setFlag: 'e10_good' }],
        reaction: '"뭐야, 인싸 됐다며. 나랑 국밥 먹어도 돼?" 하늘이가 웃으며 깍두기를 덜어 준다.',
        reactionIf: [
          {
            if: { any: [{ flag: 'heard_exchange' }, { flag: 'heard_exchange_late' }, { flag: 'promise_adjusted' }] },
            text: '"뭐야, 인싸 됐다며. 나랑 국밥 먹어도 돼?" 하늘이가 깍두기를 덜어 주며 휴대폰 화면을 보여 준다. 합격 통지. "붙었어." 그런데 하늘이는 축하한다는 말을 기다리지 않고 화제를 돌렸다. "…근데 아직 간다고는 안 했어."',
          },
        ],
      },
      {
        id: 'party',
        text: '술자리에 간다',
        effects: [{ stat: 'popularity', delta: 5 }, { rel: 'haneul', h: -2, t: -3 }, { setFlag: 'friend_conflict_open' }],
        reaction: '새벽에 확인한 톡. "국밥 혼자 먹었다. 맛있더라." 마침표가 유난히 컸다.',
      },
      {
        id: 'invite',
        text: '"하늘이도 같이 가도 돼요?" 제안한다',
        requires: { stat: 'personality', min: 50 },
        showLocked: true,
        lockedHint: '성격 50 이상',
        effects: [{ stat: 'popularity', delta: 3 }, { rel: 'haneul', t: 2, group: 'talk' }, { setFlag: 'e10_good' }],
        reaction: '하늘이가 오자 술자리 분위기가 확 바뀌었다. 하늘이는 내 옆자리를 끝까지 지켰다.',
      },
      {
        id: 'brag',
        text: '술자리에 가서 하늘이 얘기를 가볍게 떠벌린다',
        effects: [{ stat: 'popularity', delta: 5 }, { rel: 'haneul', t: -8 }, { setFlag: 'ignored_friend' }, { setFlag: 'friend_conflict_open' }],
        reaction: '"정하늘이랑 소꿉친구라고? 대박." 다들 웃었다. 그 얘기는 이틀 만에 하늘이 귀에 들어갔다.',
      },
    ],
  },

  /* ───── E11A 말하지 못했던 한마디 (11주) ───── */
  {
    id: 'E11A',
    title: '말하지 못했던 한마디',
    week: { from: 11 },
    portrait: PORTRAITS.haneul,
    text: [
      '시험 기간 도서관. 휴대폰 메모장에 쓰다 지운 문장이 몇 줄 남아 있다.',
      '그동안 고맙다는 말도, 미안하다는 말도 제대로 해 본 적이 없다.',
    ],
    choices: [
      {
        id: 'sorry',
        text: '하늘이에게 서운하게 했던 일을 구체적으로 사과한다',
        requires: { any: [{ flag: 'friend_conflict_open' }, { flag: 'promise_broken' }, { flag: 'snapped_friend' }] },
        effects: [{ rel: 'haneul', t: 3, group: 'talk' }, { setFlag: 'e11a_done' }],
        reaction: '"…알았어. 근데 그거 직접 말하러 와라. 톡 말고." 답장이 3분 만에 왔다.',
      },
      {
        id: 'thanks_haneul',
        text: '하늘이에게 지난 학기 고마웠던 일을 하나 짚어 감사를 전한다',
        effects: [{ rel: 'haneul', h: 2, t: 2, group: 'remember' }, { setFlag: 'e11a_done' }],
        reaction: '"갑자기 왜 이래, 무섭게." 그래도 하늘이는 하트 이모티콘을 세 개나 보냈다.',
      },
      {
        id: 'thanks_seorin',
        text: '서린 누나에게 축제 때 믿고 맡겨 준 일을 고맙다고 말한다',
        requires: { rel: 'seorin', met: true },
        effects: [{ rel: 'seorin', t: 2, group: 'remember' }, { setFlag: 'e11a_done' }],
        reaction: '"뭘 새삼." 누나의 답장은 짧았다. 1분 뒤 하나가 더 왔다. "다음에도 같이 하자고 했잖아."',
      },
      {
        id: 'skip',
        text: '메모장을 닫는다',
        effects: [],
        reaction: '다음에 하지 뭐. 일기 속의 나도 그렇게 말했을 것이다.',
      },
    ],
  },

  /* ───── 도전 미션 c02: 단톡방 감사 ───── */
  {
    id: 'ECHAT',
    title: '단톡방에 남은 한 줄',
    week: { from: 10, to: 13 },
    when: { all: [{ flag: 'mission_c02_active' }, { varName: 'helpedOthers', min: 2 }] },
    order: 8,
    text: [
      '저녁, 연합 동아리 단톡방에 알림이 뜬다.',
      '"오늘 과제 자료 정리해 준 2학년 선배님 진짜 감사합니다ㅠㅠ 덕분에 살았어요"',
    ],
    choices: [
      { id: 'ok', text: '"별말씀을요" 짧게 답한다', effects: [{ setFlag: 'chat_thanks' }, { stat: 'popularity', delta: 2 }], reaction: '그 아래로 "누구?", "그 복학생 형?" 하는 메시지가 줄줄이 달렸다.' },
    ],
  },

  /* ───── E11 갈등판 ───── */
  {
    id: 'E11C',
    title: '나 같은 건 안 보이지?',
    week: { from: 12, to: 13 },
    when: { all: [E11_TRIGGER, { flag: 'friend_conflict_open' }] },
    order: 1,
    portrait: PORTRAITS.haneulPout,
    text: ['자취방 앞. 하늘이가 벽에 기대 서 있다. 손에 든 캔맥주는 따지도 않았다.', '"너 요즘 바쁘더라. 나 같은 건 이제 안 보이지?"'],
    choices: [
      {
        id: 'sorry',
        text: '"그날 일, 미안해. 내가 잘못했어."',
        effects: [
          {
            if: { all: [{ notFlag: 'friend_reward5' }, { notFlag: 'friend_reward_done' }] },
            then: [{ rel: 'haneul', h: 5, narrative: true }, { setFlag: 'friend_reward5' }],
          },
          { clearFlag: 'friend_conflict_open' },
          { setFlag: 'e11c_sorry' },
        ],
        reaction: '하늘이가 캔을 내민다. "…따 줘. 손 시려." 그게 화해의 신호라는 걸 안다.',
      },
      {
        id: 'excuse',
        text: '"그냥 분위기가 그랬어."',
        effects: [{ rel: 'haneul', t: -2 }],
        reaction: '"그래. 분위기." 하늘이는 캔을 내 손에 쥐여 주고 돌아섰다.',
      },
    ],
  },

  /* ───── E11 자각판 (T ≥ 60) ───── */
  {
    id: 'E11',
    title: '처음 느낀 감정',
    week: { from: 12, to: 13 },
    when: { all: [E11_TRIGGER, { notFlag: 'friend_conflict_open' }, { notFlag: 'e11_done' }, { rel: 'haneul', t: 60 }] },
    order: 2,
    portrait: PORTRAITS.haneul,
    text: [
      '기말 직전, 자취방 앞 편의점. 하늘이가 평소처럼 맥주 두 캔을 사 들고 왔다.',
      '"야, 너 요즘 단톡에서 말 좀 나오더라. \'복학생 형 은근 괜찮다\'고."',
      '(캔을 따다 멈추고) "…웃기지. 나 그 말 듣고 좀 짜증났어. 왜 짜증났는지 모르겠어."',
      '장난이 붙어 있지 않은 목소리였다.',
    ],
    textIf: [
      {
        if: { flag: 'asked_her_mind' },
        text: '"너 그때 나한테 \'가고 싶은지부터 듣고 싶다\'고 했잖아. …그 질문 때문에 아직 서류 확정을 못 했어. 여기 두고 가는 게 뭔지, 요즘 좀 알 것 같아서."',
      },
      {
        if: { flag: 'told_go' },
        text: '"너 그때 가라고 했잖아. 맞는 말인데… 이상하게 그 말이 좀 서운했어. 왜 서운했는지 모르겠어."',
      },
      {
        if: { flag: 'showed_jealousy' },
        text: '"아, 그 선배? 안 만났어. 너가 별로라며. …그 말이 왜 계속 생각났는지 모르겠네."',
      },
      {
        if: { flag: 'rival_challenged' },
        text: '"도현 선배가 그러더라. 너한테 무슨 사이냐고 물었더니 \'그걸 왜 선배한테 말해야 돼요\' 했다며. …너 그런 말도 할 줄 알아?"',
      },
      {
        if: { flag: 'rival_said_friend' },
        text: '"도현 선배가 그러던데. 너가 나랑 그냥 친구라고 했다고." 하늘이가 캔을 꽉 쥔다. "…맞는 말인데. 그 말을 너한테서 들으니까 좀 이상했어."',
      },
      {
        if: { flag: 'festival_with_haneul' },
        text: '"축제 때 너 부스 버리고 나 찾아왔잖아. 그 사진, 아직 내 앨범 맨 위에 있어."',
      },
      {
        if: { flag: 'said_meet_senior' },
        text: '"그 선배랑 밥 한 번 먹었어. 네가 만나 보라며. …재미없더라. 너랑 먹는 국밥이 더 나았어."',
      },
    ],
    choices: [
      {
        id: 'ask',
        text: '"왜 짜증났는데?" 정면으로 묻는다',
        requires: CONFIDENT,
        showLocked: true,
        lockedHint: CONFIDENT_HINT,
        effects: awareReward,
        reaction: '"몰라. …네가 다른 애들이랑 웃고 있으면, 원래 그 자리 내 거였던 것 같아서." 말하고 나서 본인이 더 놀란 얼굴이다.',
      },
      {
        id: 'promise',
        text: '"PC방 약속 지킨 거, 기억해?"',
        requires: { flag: 'promise_kept' },
        effects: awareReward,
        reaction: '"축제 회의 빼고 왔잖아, 너." 캔을 부딪친다. "그때부터 좀 이상했어, 나."',
      },
      {
        id: 'dodge',
        text: '"에이, 너 원래 다 짜증 내잖아." 넘긴다',
        effects: [{ setFlag: 'awareness_pending' }, { setFlag: 'e11_done' }],
        reaction: '"…그치?" 웃었지만 캔을 다 마실 때까지 말이 없었다.',
      },
      {
        id: 'serious',
        text: '"장난 안 칠게. 무슨 마음인지 말해 줘."',
        effects: [
          ...awareReward,
          { if: { flag: 'heard_friend' }, then: [{ log: '"너는 내 얘기 들어 줬잖아." 하늘이가 덧붙였다.' }] },
        ],
        reaction: '하늘이가 한참 캔만 본다. "…너 진지할 때 좀 낯설다." 그리고 작게. "나도 잘 모르겠어. 근데 너 딴 데 가는 건 싫어."',
      },
    ],
  },

  /* ───── E11 유예판 ───── */
  {
    id: 'E11P',
    title: '좋은 거겠지',
    week: { from: 12, to: 13 },
    when: { all: [E11_TRIGGER, { notFlag: 'friend_conflict_open' }, { notFlag: 'e11_done' }, { rel: 'haneul', tBelow: 60 }] },
    order: 2,
    portrait: PORTRAITS.haneul,
    text: ['편의점 앞. 하늘이가 캔을 따며 나를 위아래로 훑는다.', '"너 요즘 좀 달라졌다? 뭐, 좋은 거겠지."'],
    textIf: [
      {
        if: { any: [{ flag: 'heard_exchange' }, { flag: 'heard_exchange_late' }, { flag: 'promise_adjusted' }] },
        text: '"교환학생 출국 서류 냈어. 8월이야." 하늘이는 그 말을 캔 따는 소리에 섞어서 했다.',
      },
      {
        if: { flag: 'promise_broken' },
        text: '하늘이는 토요일 얘기를 한 번도 꺼내지 않았다. 그날 하려던 말이 뭐였는지, 나는 아직도 모른다.',
      },
    ],
    choices: [{ id: 'ok', text: '"그런가."', effects: [{ setFlag: 'awareness_pending' }, { setFlag: 'e11_done' }], reaction: '하늘이는 더 묻지 않았다. 아직은.' }],
  },

  /* ───── E12 ───── */
  {
    id: 'E12',
    title: '종강',
    week: { from: 13 },
    order: 9,
    text: [
      '1학기 종강 파티. 시끄러운 술집 구석에서 지난 13주를 떠올린다.',
      '복학 첫 주, 아무도 내 이름을 몰랐다. 지금은 테이블 건너편에서 누군가 "형, 이리 와요!" 하고 부른다.',
      '여름방학이 시작된다.',
    ],
    choices: [
      { id: 'work', text: '방학엔 알바로 돈을 모은다', effects: [{ setFlag: 'summer_work' }, { setFlag: 'summer_plan_set' }], reaction: '2학기에 쓸 돈을 모아 두자.' },
      { id: 'trip', text: '방학엔 여행을 간다', effects: [{ setFlag: 'summer_trip' }, { setFlag: 'summer_plan_set' }], reaction: '어디로 갈지, 누구와 갈지는 아직 모른다.' },
      { id: 'self', text: '방학엔 자기관리에 집중한다', effects: [{ setFlag: 'summer_self' }, { setFlag: 'summer_plan_set' }], reaction: '2학기엔 더 달라진 모습으로.' },
    ],
  },

  /* ───── 연애 미션 장면 (data/romance.ts) ───── */
  ...ROMANCE_EVENTS,

  /* ───── 라이벌·마지막 페이지 (data/storyEvents.ts) ───── */
  ...STORY_EVENTS,

  /* ───── 활동 사건 (data/activityEvents.ts) ───── */
  ...ACTIVITY_EVENTS,
]
