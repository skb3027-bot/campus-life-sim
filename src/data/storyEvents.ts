/**
 * 학기 중반 갈등과 시즌 1 마지막 떡밥
 * - 라이벌: 차도현 (🆕 임시 설정 · 4학년 만 25세 · 과에서 유명한 선배, 여유롭고 다정해 보이지만 은근히 사람을 재는 성격)
 *   악역이 아니라 "하늘에게 진심인 경쟁자". 주인공이 성장하면 인정한다.
 * - 일기 마지막 페이지: 주인공이 쓰지 않은 글씨 (정체는 시즌 2)
 */
import type { EventDef } from '../game/types'
import { PORTRAITS } from './characters'

const IF_EXCHANGE = { any: [{ flag: 'heard_exchange' }, { flag: 'heard_exchange_late' }, { flag: 'promise_adjusted' }] }

export const STORY_EVENTS: EventDef[] = [
  /* ───── 라이벌 1: 학식에서 처음 마주침 (4주) ───── */
  {
    id: 'ER_intro',
    title: '하늘이 옆의 선배',
    week: { from: 4 },
    order: 1,
    portrait: PORTRAITS.haneul,
    text: [
      '학식에서 하늘이와 밥을 먹는데, 누가 하늘이 옆자리에 식판을 내려놓는다.',
      '"하늘아, 여기 앉아도 되지?" 키 크고 웃는 얼굴이 예쁜 사람. 주변 테이블이 힐끔힐끔 이쪽을 본다.',
      '하늘이가 소개한다. "아, 차도현 선배. 4학년. 과 대표 행사 때마다 사회 보는." 선배가 나를 본다. "친구? …아, 그 복학생?" 웃는 얼굴 그대로, 시선이 내 후드티에서 잠깐 멈춘다.',
    ],
    textIf: [
      { if: { stat: 'looks', min: 30 }, text: '선배의 시선이 잠깐 내 얼굴에 머문다. "…생각보다 깔끔하네." 칭찬인지 아닌지 모를 말투다.' },
    ],
    choices: [
      {
        id: 'polite',
        text: '"안녕하세요." 자연스럽게 인사하고 대화에 낀다',
        effects: [{ stat: 'personality', delta: 1 }, { setFlag: 'rival_met' }, { setFlag: 'rival_polite' }],
        reaction: '선배는 나에게도 질문을 몇 개 던졌다. 대답할 때마다 고개를 끄덕였지만, 대화의 끝은 늘 하늘이를 향해 있었다. "하늘아, 다음 주 사회 연습 같이 하자."',
      },
      {
        id: 'quiet',
        text: '조용히 밥만 먹는다',
        effects: [{ setFlag: 'rival_met' }],
        reaction: '두 사람이 행사 얘기로 웃는 동안 나는 국만 떠먹었다. 하늘이가 테이블 밑으로 내 발을 툭 찼다. 왜 찬 건지는 모르겠다.',
      },
      {
        id: 'leave',
        text: '"먼저 갈게." 자리를 피한다',
        effects: [{ mental: -2 }, { rel: 'haneul', t: -1 }, { setFlag: 'rival_met' }, { setFlag: 'rival_retreat' }],
        reaction: '뒤에서 하늘이가 "야, 밥 다 먹고 가!" 하고 불렀다. 못 들은 척했다. 식판 위의 밥이 반이나 남아 있었다.',
      },
    ],
  },

  /* ───── 라이벌 2: 단둘이 떠보기 (6주) ───── */
  {
    id: 'ER_probe',
    title: '"너 하늘이랑 무슨 사이야?"',
    week: { from: 6 },
    when: { flag: 'rival_met' },
    order: 3,
    text: [
      '과방 앞 자판기. 도현 선배가 캔커피 두 개를 뽑아 하나를 나에게 내민다.',
      '"너 하늘이랑 오래 알았다며. 초등학교 때부터?" 선배가 캔을 딴다. "솔직히 물어볼게. 둘이 무슨 사이야?"',
      '"나 하늘이 좋아하거든. 돌려 말하는 거 싫어해서."',
    ],
    choices: [
      {
        id: 'friend',
        text: '"그냥 친구예요."',
        effects: [{ setFlag: 'rival_said_friend' }],
        reaction: '"그래? 다행이다." 선배가 웃으며 내 어깨를 두드렸다. "그럼 응원해 줘, 친구." 캔커피가 이상하게 썼다.',
      },
      {
        id: 'challenge',
        text: '"그걸 왜 선배한테 말해야 돼요?"',
        requires: { mental: { min: 50 } },
        showLocked: true,
        lockedHint: '멘탈 50 이상 필요',
        effects: [{ stat: 'popularity', delta: 1 }, { mental: 2 }, { setFlag: 'rival_challenged' }],
        reaction: '선배의 눈썹이 살짝 올라간다. 그리고 처음으로 웃음기 없는 얼굴. "…오케이. 그럼 정정당당하게 하자." 선배가 빈 캔을 정확히 쓰레기통에 던져 넣었다.',
      },
      {
        id: 'unsure',
        text: '"…잘 모르겠어요."',
        effects: [{ setFlag: 'rival_unsure' }],
        reaction: '"모르겠으면 아닌 거야." 선배는 친절하게 말했다. 그 말이 하루 종일 귀에 맴돌았다. 모르겠으면, 정말 아닌 걸까.',
      },
    ],
  },

  /* ───── 라이벌 3: 축제, 옆 부스 (9주, 공개 인정 결과 이후) ───── */
  {
    id: 'ER_festival',
    title: '옆 부스의 차도현',
    week: { from: 9 },
    when: { all: [{ flag: 'rival_met' }, { flag: 'e08_done' }] },
    order: 3,
    portrait: PORTRAITS.haneulSmile,
    text: ['축제 둘째 날 밤. 옆 4학년 부스는 도현 선배가 마이크를 잡자마자 줄이 두 배로 늘었다.'],
    textIf: [
      {
        if: { flag: 'recognized' },
        text: '그런데 오늘은 우리 부스 줄도 만만치 않다. 도현 선배가 마이크를 내려놓고 다가온다. "어제 서린이가 너 얘기 하더라. …너 좀 하네." 웃음기 없는 칭찬이었다.',
      },
      {
        if: { notFlag: 'recognized' },
        text: '우리 부스는 한산하다. 선배 부스 앞, 하늘이가 선배가 건넨 마이크를 받아 들고 웃고 있다.',
      },
      { if: { flag: 'rival_challenged' }, text: '선배와 눈이 마주친다. "정정당당하게"라던 말이 떠오른다.' },
    ],
    choices: [
      {
        id: 'find_haneul',
        text: '부스를 잠깐 맡기고 하늘이를 찾아간다',
        effects: [{ rel: 'haneul', h: 2, group: 'date' }, { setFlag: 'festival_with_haneul' }],
        reaction: '"어? 너 부스는?" 하늘이가 놀란다. "잠깐만." 나는 하늘이 손에 들린 막걸리 잔을 가져가 대신 마셨다. 하늘이가 웃음을 터뜨리고, 휴대폰을 들어 둘이 사진을 찍었다. 플래시 너머로 도현 선배가 우리를 보고 있었다.',
      },
      {
        id: 'congrats',
        text: '선배 부스에 가서 "대박이네요" 먼저 인사한다',
        effects: [{ stat: 'personality', delta: 1 }, { setFlag: 'rival_respect' }],
        reaction: '선배가 잠깐 멈칫하더니 손을 내밀었다. "…너 은근 멋있다." 악수는 짧았다. 고개를 돌리니, 하늘이가 우리 둘을 번갈아 보고 있었다.',
      },
      {
        id: 'work',
        text: '신경 쓰지 않고 우리 부스 일에 집중한다',
        effects: [{ stat: 'popularity', delta: 1 }, { setFlag: 'ER_festival_done' }],
        reaction: '마감까지 쉬지 않고 일했다. 정리를 끝내고 휴대폰을 보니, 하늘이 프로필 사진이 바뀌어 있었다. 축제 부스 앞, 하늘이 옆에 도현 선배가 서 있다.',
      },
    ],
  },

  /* ───── 시즌 1 마지막: 내가 쓰지 않은 페이지 (13주, 종강 뒤) ───── */
  {
    id: 'EZ_lastpage',
    title: '일기장의 마지막 페이지',
    week: { from: 13 },
    when: { flag: 'summer_plan_set' },
    order: 10,
    text: [
      '종강 파티가 끝난 새벽. 자취방 불을 켜고 일기장을 펼친다. 이번 학기 동안 바뀐 문장들 위로 볼펜 자국이 가득하다.',
      '맨 뒷장을 넘긴다. 분명 빈 페이지였던 곳에, 글씨가 있다.',
      '내 글씨가 아니다. 동글동글하고, 끝을 살짝 말아 올리는 글씨.',
      '"2학기 첫날, 너는 또 같은 선택을 하게 될 거야. 이번에는 내가 먼저 기다리지 않을게."',
    ],
    textIf: [
      {
        if: { flag: 'friend_aware' },
        text: '그 아래, 한 줄이 더 있다. "그래도 이번 학기의 너는, 조금 좋았어."',
      },
      {
        if: IF_EXCHANGE,
        text: '페이지 귀퉁이에 작게 적힌 날짜. 8월 31일. 하늘이가 말한 출국 날짜와 같다.',
      },
      {
        if: { flag: 'promise_broken' },
        text: '페이지 귀퉁이에 작게 적힌 날짜. 7주 토요일. 내가 가지 않은 날이다.',
      },
    ],
    choices: [
      {
        id: 'photo',
        text: '페이지를 사진으로 찍어 둔다',
        effects: [{ setFlag: 'lastpage_photo' }, { setFlag: 'lastpage_seen' }],
        reaction: '휴대폰 카메라로 찍었다. 사진 속 페이지에는 아무것도 적혀 있지 않았다. 다시 일기장을 보면, 글씨는 그대로 있다.',
      },
      {
        id: 'compare',
        text: '하늘이가 예전에 써 준 생일 카드를 찾아 글씨를 비교해 본다',
        effects: [{ setFlag: 'lastpage_compare' }, { setFlag: 'lastpage_seen' }],
        reaction: '책장 맨 아래 상자 속, 초등학교 때 받은 카드. "생일 축하해 바보야 — 하늘". 동글동글한 글씨. 비슷하다. 그런데 끝을 말아 올리는 버릇은… 하늘이에게 없다.',
      },
      {
        id: 'close',
        text: '일기장을 덮는다',
        effects: [{ setFlag: 'lastpage_seen' }],
        reaction: '덮어도 문장이 머릿속에서 지워지지 않았다. "이번에는 내가 먼저 기다리지 않을게." 누가 나를 기다렸었지?',
      },
    ],
  },
]
