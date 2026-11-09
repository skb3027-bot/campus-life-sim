/**
 * 활동 사건: 그 주에 고른 활동에서 생기는 상황 (주당 최대 2개, 확률은 저장별로 고정)
 * 같은 주라도 무엇을 했느냐에 따라 만나는 사람·알게 되는 정보·이후 본편 대사가 달라진다.
 * 본편으로 이어지는 기억: has_classmates(E08 조율 경로·E09 대사), 서윤 대체 만남, 하늘 질투 복선 등
 */
import type { EventDef } from '../game/types'
import { PORTRAITS } from './characters'

const A = (e: Omit<EventDef, 'pool' | 'order'> & { order?: number }): EventDef => ({ pool: 'activity', order: -1, ...e })

export const ACTIVITY_EVENTS: EventDef[] = [
  /* ───────── 공부 ───────── */
  A({
    id: 'AS_library',
    title: '도서관 자리 전쟁',
    week: { from: 3, to: 13 },
    when: { didActivity: 'study' },
    chance: 0.8,
    text: ['시험 기간도 아닌데 도서관 열람실이 꽉 찼다. 빈자리마다 가방만 놓여 있다.'],
    choices: [
      {
        id: 'wait',
        text: '가방 주인이 올 때까지 기다린다',
        effects: [{ stat: 'academics', delta: 1 }, { mental: -1 }],
        reaction: '40분 뒤에야 자리가 났다. 그래도 그 40분 동안 서서 단어를 외웠다.',
      },
      {
        id: 'other_room',
        text: '구석 그룹 스터디룸으로 간다',
        effects: [
          {
            if: { rel: 'seoyun', met: false },
            then: [{ meet: 'seoyun' }, { rel: 'seoyun', h: 2, t: 2, group: 'help' }, { setFlag: 'seoyun_helped' }],
            else: [{ rel: 'seoyun', h: 1, group: 'talk' }],
          },
        ],
        reaction: '스터디룸에 먼저 와 있던 사람이 고개를 든다. 교양 수업 옆자리 그 사람이다. "같이 써도 돼요. 한서윤이에요." 그녀는 노트에 사람 이름을 잔뜩 적어 두고 있었다.',
        reactionIf: [
          {
            if: { rel: 'seoyun', met: true },
            text: '스터디룸에 서윤이 있다. "어, 또 만났네요." 그녀가 의자를 하나 빼 준다. 노트에는 인터뷰 질문 같은 문장이 빼곡하다.',
          },
        ],
      },
    ],
  }),
  A({
    id: 'AS_freerider',
    title: '조별과제 단톡방',
    week: { from: 3, to: 12 },
    when: { didActivity: 'study' },
    chance: 0.7,
    text: ['조별과제 마감 사흘 전. 단톡방에 "자료 조사 누가 함?"이라고 올렸는데, 읽음 4개, 답장 0개.'],
    choices: [
      {
        id: 'solo',
        text: '그냥 내가 다 한다',
        effects: [{ stat: 'academics', delta: 2 }, { mental: -3 }, { setFlag: 'carried_team' }],
        reaction: '밤새 혼자 끝냈다. 발표 날 조원들이 "형 덕분에 살았다"며 커피를 돌렸다. 고마운데, 좀 허무했다.',
      },
      {
        id: 'divide',
        text: '역할을 나눠서 이름까지 적어 공지한다',
        effects: [{ stat: 'personality', delta: 2 }, { stat: 'popularity', delta: 1 }, { setFlag: 'has_classmates' }],
        reaction: '"아 넵 형 제가 3번 할게요" 답장이 줄줄이 달렸다. 처음으로 조원들 이름을 외웠다.',
      },
      {
        id: 'ghost',
        text: '나도 잠수 탄다',
        effects: [{ mental: 2 }, { stat: 'popularity', delta: -1 }],
        reaction: '과제는 엉망으로 제출됐다. 다음 주, 조원 하나가 나를 보고 고개를 돌렸다.',
      },
    ],
  }),
  A({
    id: 'AS_professor',
    title: '교수님의 지목',
    week: { from: 4, to: 12 },
    when: { didActivity: 'study' },
    chance: 0.5,
    text: ['전공 수업. 교수님이 출석부를 훑더니 내 이름에서 멈춘다. "복학생이구나. 이 문제, 한번 풀어 볼래?"'],
    choices: [
      {
        id: 'answer',
        text: '공부한 대로 답한다',
        requires: { stat: 'academics', min: 50 },
        showLocked: true,
        lockedHint: '두뇌 50 이상',
        effects: [{ stat: 'popularity', delta: 2 }, { mental: 3 }],
        reaction: '"좋아요. 군대 갔다 와도 머리는 안 굳었네." 강의실에 웃음이 터졌다. 비웃음이 아니었다.',
      },
      {
        id: 'honest',
        text: '"아직 모르겠습니다. 찾아보겠습니다."',
        effects: [{ stat: 'personality', delta: 1 }],
        reaction: '"솔직해서 좋네요. 다음 시간에 물어볼게요." 수업이 끝나고 앞자리 동기가 필기를 보여 줬다.',
      },
    ],
  }),

  /* ───────── 편의점 알바 ───────── */
  A({
    id: 'AC_rude',
    title: '새벽 2시의 손님',
    week: { from: 2, to: 13 },
    when: { didActivity: 'cvs' },
    chance: 0.7,
    text: ['술 취한 손님이 담배 이름을 웅얼거리다 내가 못 알아듣자 계산대를 내리친다. "알바가 그것도 몰라?"'],
    choices: [
      {
        id: 'endure',
        text: '고개 숙이고 참는다',
        effects: [{ mental: -3 }],
        reaction: '손님은 한참 더 소리치다 나갔다. 손이 떨려서 바코드가 잘 안 찍혔다.',
      },
      {
        id: 'firm',
        text: '"정확히 말씀해 주셔야 드릴 수 있습니다." 또박또박 말한다',
        effects: [{ stat: 'personality', delta: 1 }, { mental: 2 }],
        reaction: '손님이 멈칫하더니 진열대를 가리켰다. 계산이 끝나고 혼자 남은 매장에서, 처음으로 숨을 크게 쉬었다.',
      },
    ],
  }),
  A({
    id: 'AC_regular',
    title: '삼각김밥 할아버지',
    week: { from: 3, to: 13 },
    when: { didActivity: 'cvs' },
    chance: 0.6,
    text: ['매일 새벽 5시에 참치마요 삼각김밥 하나를 사 가는 할아버지. 오늘은 동전을 세다 하나를 떨어뜨린다.'],
    choices: [
      {
        id: 'talk',
        text: '동전을 주워 드리며 "매일 일찍 나오시네요" 말을 건다',
        effects: [{ mental: 3 }, { setFlag: 'cvs_regular' }],
        reaction: '"손주 놈이 군대 갔어. 걔도 여기서 알바했거든." 할아버지는 그날 삼각김밥 하나를 더 사서 내게 밀어 줬다.',
      },
      {
        id: 'quiet',
        text: '조용히 계산만 한다',
        effects: [],
        reaction: '할아버지는 늘 그렇듯 고개를 한 번 끄덕이고 나갔다.',
      },
    ],
  }),
  A({
    id: 'AC_disposal',
    title: '폐기 도시락',
    week: { from: 2, to: 13 },
    when: { didActivity: 'cvs' },
    chance: 0.5,
    text: ['마감 정리. 유통기한 지난 도시락 두 개. 점장님이 "가져가도 돼"라고 했다.'],
    choices: [
      {
        id: 'haneul',
        text: '하늘이 자취방 앞에 하나 걸어 두고 온다',
        effects: [{ rel: 'haneul', h: 2, group: 'gift' }],
        reaction: '아침에 톡이 와 있었다. "폐기 도시락 셰프님 감사합니다ㅋㅋ 근데 왜 내 거가 더 큼?"',
      },
      {
        id: 'self',
        text: '둘 다 내가 먹는다',
        effects: [{ energy: 1 }],
        reaction: '배가 부르니 잠이 잘 왔다. 아침에 체력이 조금 남아 있었다.',
      },
    ],
  }),
  A({
    id: 'AC_seorin',
    title: '마감 직전, 다시 그 손님',
    week: { from: 6, to: 13 },
    when: { all: [{ didActivity: 'cvs' }, { flag: 'noona_saved_face' }] },
    chance: 0.8,
    portrait: PORTRAITS.seorin,
    speaker: 'seorin',
    text: ['마감 10분 전. 가죽 재킷. 서린 누나가 컵라면 두 개를 계산대에 올린다. 이번엔 카드가 한 번에 된다.', '누나가 하나를 내 쪽으로 밀어 놓는다. "…하나는 너 먹어. 지난번 거."'],
    choices: [
      {
        id: 'eat',
        text: '"같이 먹어요. 마감까지 10분 남았어요."',
        effects: [{ rel: 'seorin', h: 2, t: 1, group: 'talk' }],
        reaction: '누나는 편의점 창가 의자에 앉아 말없이 라면을 먹었다. 다 먹고 나서 한마디. "여기 라면 맛있네." 처음 듣는 말투였다.',
      },
      {
        id: 'thanks',
        text: '"감사합니다." 받아 두고 계산을 마친다',
        effects: [{ rel: 'seorin', t: 1, group: 'talk' }],
        reaction: '누나는 고개만 까딱하고 나갔다. 컵라면 뚜껑에 볼펜으로 "ㄱㅅ"라고 적혀 있었다.',
      },
    ],
  }),

  /* ───────── 운동 ───────── */
  A({
    id: 'AG_rack',
    title: '스쿼트 랙 앞에서',
    week: { from: 2, to: 13 },
    when: { didActivity: 'gym' },
    chance: 0.6,
    text: ['스쿼트 랙 하나에 두 사람. 옆 사람이 눈치를 보며 내가 끝나길 기다린다.'],
    choices: [
      {
        id: 'share',
        text: '"번갈아 써요." 세트 사이에 교대하자고 한다',
        effects: [{ stat: 'popularity', delta: 1 }, { setFlag: 'gym_buddy' }],
        reaction: '같은 과 3학년 선배였다. "너 복학생이지? 다음 주에 과 체육대회 나올래?" 체육관 밖에서 처음 생긴 아는 사람이다.',
      },
      {
        id: 'yield',
        text: '먼저 쓰시라고 양보한다',
        effects: [{ stat: 'personality', delta: 1 }],
        reaction: '"아, 감사합니다." 기다리는 동안 덤벨로 다른 운동을 했다.',
      },
    ],
  }),
  A({
    id: 'AG_seorin',
    title: '관장님 대타, 또',
    week: { from: 6, to: 13 },
    when: { all: [{ didActivity: 'gym' }, { flag: 'noona_met' }] },
    chance: 0.5,
    portrait: PORTRAITS.seorin,
    speaker: 'seorin',
    text: ['오늘도 관장님 대신 서린 누나가 카운터를 보고 있다. 내 데드리프트를 보더니 팔짱을 낀다.', '"…좀 늘었네. 근데 무릎."'],
    choices: [
      {
        id: 'learn',
        text: '"봐 주세요." 자세를 다시 잡는다',
        effects: [{ rel: 'seorin', t: 2, group: 'help' }, { stat: 'looks', delta: 1 }],
        reaction: '누나가 내 등에 손바닥을 대고 각도를 잡아 준다. "됐어. 이거야." 손은 금방 떨어졌지만, 등이 오래 따뜻했다.',
      },
      {
        id: 'show',
        text: '"오늘은 제 방식대로 해 볼게요."',
        effects: [{ rel: 'seorin', h: 1, group: 'talk' }],
        reaction: '"그래. 다치면 네 책임." 누나는 끝까지 지켜보더니, 마지막 세트가 끝나자 아무 말 없이 물병을 던져 줬다.',
      },
    ],
  }),

  /* ───────── 미용실 ───────── */
  A({
    id: 'AH_stylist',
    title: '"어떻게 해 드릴까요?"',
    week: { from: 2, to: 13 },
    when: { didActivity: 'hair' },
    chance: 0.9,
    text: ['디자이너가 거울 너머로 묻는다. "평소 스타일 유지할까요, 아니면 이번에 확 바꿔 볼까요? 이마 드러내면 인상 완전 달라질 것 같은데."'],
    choices: [
      {
        id: 'bold',
        text: '"확 바꿔 주세요."',
        effects: [{ stat: 'looks', delta: 2 }, { stat: 'popularity', delta: 1 }, { mental: -1 }],
        reaction: '거울 속 사람이 낯설다. 다음 날 강의실에서 동기 하나가 두 번 쳐다봤다. 좋은 쪽이었으면 좋겠다.',
      },
      {
        id: 'safe',
        text: '"너무 티 안 나게요."',
        effects: [{ mental: 1 }],
        reaction: '깔끔하게 다듬어졌다. 티는 안 나지만, 나는 안다.',
      },
    ],
  }),

  /* ───────── 옷 쇼핑 ───────── */
  A({
    id: 'AL_haneul',
    title: '쇼핑몰에서 마주친 하늘',
    week: { from: 2, to: 13 },
    when: { didActivity: 'clothes' },
    chance: 0.7,
    portrait: PORTRAITS.haneulSmile,
    speaker: 'haneul',
    text: ['셔츠 두 장을 들고 고민하는데 뒤에서 누가 어깨를 친다. 하늘이다.', '"야, 둘 다 별로야. 이리 와 봐." 하늘이가 내 손에서 옷을 뺏어 간다.'],
    choices: [
      {
        id: 'follow',
        text: '하늘이가 골라 주는 대로 입어 본다',
        effects: [{ stat: 'fashion', delta: 2 }, { rel: 'haneul', h: 2, t: 1, group: 'date' }],
        reaction: '탈의실 커튼을 열자 하늘이가 잠깐 말이 없다. "…괜찮네. 아니, 그냥 괜찮다고." 계산대 앞에서 하늘이가 괜히 휴대폰만 봤다.',
      },
      {
        id: 'own',
        text: '"오늘은 내가 골라 볼게."',
        effects: [{ mental: 2 }, { rel: 'haneul', t: 1, group: 'talk' }],
        reaction: '"오~ 자기 주장 생겼네?" 하늘이가 팔짱을 끼고 구경했다. 내가 고른 셔츠를 보고는 "…생각보다 안 구림"이라고 했다.',
      },
    ],
  }),
  A({
    id: 'AL_upsell',
    title: '점원의 추천 세트',
    week: { from: 2, to: 13 },
    when: { didActivity: 'clothes' },
    chance: 0.4,
    text: ['"이 바지랑 같이 입으면 완전 달라요. 세트로 하시면 할인돼요. 5만 원만 더."'],
    choices: [
      {
        id: 'buy',
        text: '세트로 산다 (5만 원)',
        requires: { money: 50_000 },
        showLocked: true,
        lockedHint: '돈 부족',
        effects: [{ money: -50_000 }, { stat: 'fashion', delta: 3 }],
        reaction: '거울 앞에서 처음으로 "어울린다"는 생각이 들었다. 통장 잔고는 생각하지 않기로 했다.',
      },
      {
        id: 'no',
        text: '정중히 거절한다',
        effects: [{ mental: 1 }],
        reaction: '"네~ 다음에 오세요." 거절하는 것도 연습이 필요하다는 걸 알았다.',
      },
    ],
  }),

  /* ───────── 과 사람들과 어울리기 ───────── */
  A({
    id: 'AO_groupchat',
    title: '과 동기 단톡방',
    week: { from: 2, to: 13 },
    when: { didActivity: 'social' },
    chance: 0.9,
    text: ['과 행사 뒤풀이에서 누군가 "형도 단톡 들어와요"라며 초대 링크를 보낸다. 들어가 보니 메시지 999+.'],
    choices: [
      {
        id: 'join',
        text: '자기소개를 올리고 대화에 낀다',
        effects: [{ stat: 'popularity', delta: 2 }, { setFlag: 'has_classmates' }],
        reaction: '"복학생입니다. 아저씨 아닙니다. 아직은." 아재 개그가 먹혔다. ㅋㅋㅋ가 30개 달렸다.',
      },
      {
        id: 'lurk',
        text: '알림만 끄고 눈팅한다',
        effects: [{ mental: 1 }],
        reaction: '조용히 읽기만 했다. 그래도 이제 누가 누군지는 대충 안다.',
      },
    ],
  }),
  A({
    id: 'AO_drink',
    title: '선배의 원샷',
    week: { from: 3, to: 13 },
    when: { didActivity: 'social' },
    chance: 0.6,
    text: ['술자리. 4학년 선배가 소주잔을 내민다. "복학생이 한 잔 받아야지? 원샷!"', '테이블이 조용해지고 다들 나를 본다.'],
    choices: [
      {
        id: 'refuse',
        text: '"오늘은 콜라로 받을게요." 웃으며 거절한다',
        effects: [{ stat: 'personality', delta: 2 }, { mental: 1 }],
        reaction: '선배가 잠깐 머쓱해하더니 "어? 그래 그래" 하고 넘어갔다. 옆자리 후배가 작게 말했다. "형 멋있다. 저도 그렇게 말해 볼래요."',
      },
      {
        id: 'drink',
        text: '받아서 마신다',
        effects: [{ stat: 'popularity', delta: 2 }, { energy: -1 }, { mental: -2 }],
        reaction: '"오~" 박수가 터졌다. 다음 날 아침, 박수 소리보다 두통이 더 오래 갔다.',
      },
    ],
  }),
  A({
    id: 'AO_nickname',
    title: '"복학생 아저씨"',
    week: { from: 3, to: 9 },
    when: { didActivity: 'social' },
    chance: 0.6,
    text: ['신입생 하나가 악의 없이 말한다. "아저씨… 아, 아니 형! 형은 군대 어디 나오셨어요?" 테이블이 웃음바다가 된다.'],
    choices: [
      {
        id: 'laugh',
        text: '"아저씨 맞아. 아저씨가 밥 산다." 웃어넘긴다',
        effects: [{ stat: 'popularity', delta: 2 }, { money: -20_000 }],
        reaction: '그날부터 별명이 "밥 사는 아저씨"가 됐다. 나쁘지 않았다.',
      },
      {
        id: 'joke_self',
        text: '자학 개그로 받아친다',
        effects: [{ stat: 'popularity', delta: 3 }, { mental: -3 }],
        reaction: '다들 배를 잡고 웃었다. 집에 오는 길에 그 개그가 조금 씁쓸하게 떠올랐다.',
      },
      {
        id: 'straight',
        text: '"형이라고 불러 줘." 담담하게 말한다',
        effects: [{ mental: 2 }],
        reaction: '"아, 넵! 형!" 신입생이 바로 고쳐 불렀다. 생각보다 간단한 일이었다.',
      },
    ],
  }),
  A({
    id: 'AO_counsel',
    title: '동기의 고민',
    week: { from: 5, to: 13 },
    when: { all: [{ didActivity: 'social' }, { flag: 'has_classmates' }] },
    chance: 0.7,
    text: ['단톡방에서 알게 된 동기 하나가 술자리 끝에 따로 남는다. "형, 저 휴학할까 고민 중인데… 군대 가기 전에 형은 어땠어요?"'],
    choices: [
      {
        id: 'listen',
        text: '내 얘기를 솔직하게 해 준다',
        effects: [{ stat: 'personality', delta: 2 }, { setFlag: 'classmate_trust' }],
        reaction: '"형 그런 시절이 있었구나." 동기는 한참 듣더니 말했다. "축제 때 뭐 필요하면 저 불러요. 진짜로."',
      },
      {
        id: 'advice',
        text: '"하고 싶은 거 해. 후회는 어차피 해." 짧게 조언한다',
        effects: [{ stat: 'popularity', delta: 1 }],
        reaction: '"오… 명언 저장." 동기가 휴대폰에 받아 적었다.',
      },
    ],
  }),

  /* ───────── 하늘이와 밥 ───────── */
  A({
    id: 'AM_senior',
    title: '하늘의 질문',
    week: { from: 5, to: 11 },
    when: { all: [{ didActivity: 'meal' }, { flag: 'rival_met' }] },
    chance: 0.7,
    portrait: PORTRAITS.haneul,
    speaker: 'haneul',
    text: [
      '국밥집. 하늘이가 깍두기를 뒤적이다 불쑥 묻는다.',
      '"야, 도현 선배가 자꾸 밥 먹자고 연락하는데. 너라면 어떻게 할 거 같아?" 장난처럼 말하지만 눈은 웃지 않는다.',
    ],
    choices: [
      {
        id: 'serious',
        text: '"네가 어떤데? 그게 먼저지."',
        effects: [{ rel: 'haneul', t: 2, group: 'talk' }],
        reaction: '"…몰라. 별 생각 없어서 물어본 거야." 하늘이는 그 뒤로 선배 얘기를 하지 않았다. 대신 국밥을 내 쪽으로 조금 밀어 줬다.',
      },
      {
        id: 'go',
        text: '"만나 봐. 손해 볼 건 없잖아."',
        effects: [{ rel: 'haneul', h: -1, group: 'talk' }, { setFlag: 'said_meet_senior' }],
        reaction: '"그치? 그렇지." 하늘이가 웃었다. 그런데 국밥을 반이나 남겼다.',
      },
      {
        id: 'dislike',
        text: '"…그 선배 별로던데."',
        effects: [{ rel: 'haneul', h: 2, group: 'talk' }, { setFlag: 'showed_jealousy' }],
        reaction: '하늘이가 숟가락을 멈추고 나를 빤히 본다. "너 그 선배 알아?" "…아니." "근데 왜 별로야?" 하늘이는 한참 웃었다. 이유는 끝까지 안 물었다.',
      },
    ],
  }),
  A({
    id: 'AM_hair',
    title: '"머리 했네?"',
    week: { from: 2, to: 13 },
    when: { all: [{ didActivity: 'meal' }, { flag: 'did_hair' }] },
    chance: 0.9,
    portrait: PORTRAITS.haneulSmile,
    speaker: 'haneul',
    text: ['하늘이가 자리에 앉자마자 내 머리를 손가락으로 툭 건드린다.', '"머리 했네? 누구 보여 주려고?"'],
    choices: [
      {
        id: 'you',
        text: '"너." 장난처럼 받아친다',
        requires: { mental: { min: 40 } },
        showLocked: true,
        lockedHint: '멘탈 40 이상',
        effects: [{ rel: 'haneul', h: 2, group: 'talk' }],
        reaction: '"…미쳤냐." 하늘이가 물을 벌컥벌컥 마셨다. 귀 끝이 빨갰다.',
      },
      {
        id: 'just',
        text: '"그냥. 거울 보기 싫어서."',
        effects: [{ rel: 'haneul', t: 1, group: 'talk' }],
        reaction: '"그럼 이제 좀 볼 만하냐?" 하늘이가 웃었다. "응. 볼 만해."',
      },
    ],
  }),
  A({
    id: 'AM_japanese',
    title: '단어장 퀴즈',
    week: { from: 8, to: 13 },
    when: { all: [{ didActivity: 'meal' }, { any: [{ flag: 'heard_exchange' }, { flag: 'heard_exchange_late' }, { flag: 'promise_adjusted' }] }] },
    chance: 0.8,
    portrait: PORTRAITS.haneul,
    speaker: 'haneul',
    text: ['하늘이가 밥 먹다 말고 일본어 단어장을 내민다. "퀴즈 내 줘. 틀리면 내가 계산."'],
    choices: [
      {
        id: 'quiz',
        text: '단어 퀴즈를 내 준다',
        effects: [{ rel: 'haneul', h: 1, t: 2, group: 'help' }],
        reaction: '"さびしい(사비시이)"에서 하늘이가 막혔다. 뜻을 알려 주자 하늘이가 잠깐 말이 없다. "…외로운. 이건 외웠다."',
      },
      {
        id: 'ask_go',
        text: '"진짜 갈 거야?"',
        effects: [{ rel: 'haneul', t: 1, group: 'talk' }, { setFlag: 'asked_really_go' }],
        reaction: '"…왜? 가지 말라고?" 하늘이가 웃으며 되묻는다. 대답을 기다리는 1초가 길었다. "아냐, 됐어. 먹자."',
      },
    ],
  }),

  /* ───────── 휴식 ───────── */
  A({
    id: 'AR_dream',
    title: '일기장 꿈',
    week: { from: 2, to: 12 },
    when: { didActivity: 'rest' },
    chance: 0.5,
    text: ['낮잠에서 꿈을 꿨다. 2학기 첫날의 강의실. 하늘이 자리가 비어 있다. 아무도 그걸 이상하게 여기지 않는다.', '깨어 보니 일기장이 배 위에 펼쳐져 있었다.'],
    choices: [
      {
        id: 'reread',
        text: '일기를 처음부터 다시 읽는다',
        effects: [{ mental: -2 }, { stat: 'academics', delta: 1 }, { setFlag: 'reread_diary' }],
        reaction: '미래의 나는 같은 실수를 여러 번 했다. 다 "괜찮겠지"로 시작했다. 그 문장에 볼펜으로 밑줄을 그었다.',
      },
      {
        id: 'close',
        text: '덮고 다시 잔다',
        effects: [{ mental: 2 }],
        reaction: '이번엔 꿈을 꾸지 않았다.',
      },
    ],
  }),

  /* ───────── 취미 ───────── */
  A({
    id: 'AB_club',
    title: '사진 동아리 홍보 부스',
    week: { from: 2, to: 8 },
    when: { didActivity: 'hobby' },
    chance: 0.7,
    text: ['학생회관 앞 동아리 홍보 부스. "필름 카메라 빌려드려요! 체험만 해도 돼요!"'],
    choices: [
      {
        id: 'join',
        text: '체험 신청서를 쓴다',
        effects: [
          { mental: 2 },
          { setFlag: 'photo_club' },
          { if: { rel: 'seoyun', met: true }, then: [{ rel: 'seoyun', h: 2, group: 'talk' }] },
        ],
        reaction: '부스 뒤에서 카메라를 정리하던 사람이 고개를 든다. 서윤이다. "어? 사진 해요? 저도 여기 회원이에요. 인터뷰 사진은 제가 직접 찍거든요."',
        reactionIf: [
          {
            if: { rel: 'seoyun', met: false },
            text: '필름 카메라를 들어 보니 생각보다 무겁다. 셔터 소리가 좋았다. 동아리 명단 맨 위에 "한서윤"이라는 이름이 보였다.',
          },
        ],
      },
      {
        id: 'pass',
        text: '그냥 지나간다',
        effects: [],
        reaction: '셔터 소리가 등 뒤로 몇 번 들렸다.',
      },
    ],
  }),

  /* ───────── 서린 누나 가게 돕기 ───────── */
  A({
    id: 'AP_auntie',
    title: '단골 아주머니',
    week: { from: 7, to: 13 },
    when: { didActivity: 'shop' },
    chance: 0.7,
    portrait: PORTRAITS.seorin,
    speaker: 'seorin',
    text: ['분식집 단골 아주머니가 떡볶이를 기다리며 나에게 속삭인다.', '"서린이가 무섭게 굴지? 걔 원래 고등학교 때 동생 학원비 대느라 알바 세 개 했어. 착한 애야."'],
    choices: [
      {
        id: 'listen',
        text: '조용히 듣고, 누나에게는 모른 척한다',
        effects: [{ rel: 'seorin', t: 1, group: 'help' }, { setFlag: 'knows_seorin_past' }],
        reaction: '주방에서 누나가 "아줌마, 쓸데없는 소리 하지 마세요" 하고 소리쳤다. 다 들렸나 보다. 그날 누나는 평소보다 떡을 두 개 더 넣어 줬다.',
      },
      {
        id: 'ask',
        text: '"누나, 진짜예요?" 바로 물어본다',
        effects: [{ rel: 'seorin', h: 1, t: -1 }],
        reaction: '"…일이나 해." 누나는 대답 대신 앞치마를 던졌다. 뒷모습이 조금 굳어 있었다.',
      },
    ],
  }),
  A({
    id: 'AP_call',
    title: '울리는 전화',
    week: { from: 8, to: 13 },
    when: { all: [{ didActivity: 'shop' }, { notFlag: 'noona_secret_leaked' }] },
    chance: 0.5,
    portrait: PORTRAITS.seorin,
    speaker: 'seorin',
    text: ['계산대 옆 누나 휴대폰이 계속 울린다. "○○캐피탈". 누나는 화면을 엎어 놓고 튀김을 뒤집는다.'],
    choices: [
      {
        id: 'ignore',
        text: '못 본 척 주문을 받는다',
        effects: [{ rel: 'seorin', t: 2, group: 'help' }],
        reaction: '마감 후 누나가 혼잣말처럼 말했다. "…고맙다고는 안 할 거야." 그게 고맙다는 말이라는 걸 이제는 안다.',
      },
      {
        id: 'offer',
        text: '"제가 대신 받아서 나중에 연락드린다고 할까요?"',
        effects: [{ rel: 'seorin', t: -2 }],
        reaction: '"네가 왜." 누나의 목소리가 한 톤 낮아졌다. "선 넘지 마." 그날 가게는 유난히 조용했다.',
      },
    ],
  }),
]
