/**
 * 회귀자의 일기 — "원래 실패한 미래의 기록"
 * 흐름: 기록 제시 → 플레이어 개입 → 실제 사건 → 문장 변화 → 다음 궁금증
 * 일기는 아직 일어나지 않은 일을 이미 일어난 것처럼 말하지 않는다 (원래 미래의 기록으로만 서술).
 */
import type { DiaryEntry } from '../game/types'

export const DIARY: DiaryEntry[] = [
  {
    id: 'd_saturday',
    title: '7주 토요일',
    showWhen: { flag: 'prologue_seen' },
    original:
      '7주 토요일. 하늘이가 할 얘기가 있다고 했다. 나는 과 회의를 핑계로 가지 않았고, 연락도 하지 않았다. 그 애가 무슨 말을 하려 했는지 나는 끝내 묻지 않았다. 2학기 첫날, 하늘이 자리는 비어 있었다.',
    outcomes: [
      {
        when: { flag: 'promise_broken' },
        kind: 'kept',
        text: '기록대로 되었다. 이 문장은 지워지지 않았다.',
      },
      {
        when: { flag: 'promise_adjusted' },
        kind: 'changed',
        text: '회의와 약속 사이를 뛰어다녔다. 하늘이는 반만 말했다. "나머지는 다음에." 그 애 책상 위에 일본어 서류가 있었다. 2학기 첫날의 빈자리는 아직 정해지지 않았다.',
      },
      {
        when: { flag: 'heard_exchange' },
        kind: 'changed',
        text: '7주 토요일, 나는 약속 장소에 갔다. 하늘이는 일본 교환학생 지원서를 내밀었다. "가 볼까 해. …넌 어떻게 생각해?" 2학기 첫날의 빈자리는 아직 정해지지 않았다.',
      },
      {
        when: { flag: 'heard_exchange_late' },
        kind: 'changed',
        text: '나는 미리 연락했다. 하늘이가 하려던 말은 한 주 늦게 들었다. 일본 교환학생. 기록 속의 나는 끝내 듣지 못한 말이다.',
      },
    ],
  },
  {
    id: 'd_classmate',
    title: '교양 수업 옆자리',
    showWhen: { flag: 'e02_seen' },
    original: '교양 수업 옆자리 그 애. 나는 그 애 이름도 모른 채 학기를 끝냈다.',
    outcomes: [
      {
        when: { flag: 'seoyun_interview' },
        kind: 'changed',
        text: '그 애 이름은 한서윤. 이번에는 그 애가 먼저 나에게 질문을 했다. 기록에 없던 대화다.',
      },
      {
        // 이름을 실제로 들은 뒤에만 (E03 대화 또는 도서관 대체 만남)
        when: { any: [{ flag: 'e03_talk' }, { flag: 'seoyun_helped' }] },
        kind: 'changed',
        text: '그 애 이름은 한서윤. 적어도 이름은 안다. 기록보다 한 줄 나아졌다.',
      },
    ],
  },
  {
    id: 'd_festival',
    title: '축제 전날',
    showWhen: { flag: 'noona_met' },
    original:
      '축제 전날, 서린 누나가 내게 맡긴 일을 나는 끝내지 않았다. 그날 이후 과에서 내 이름은 "도망간 복학생"이었다.',
    outcomes: [
      {
        when: { flag: 'recognized' },
        kind: 'changed',
        text: '축제 날, 누나가 모두 앞에서 내 이름을 불렀다. "도망간 복학생"이라는 말은 이제 어디에도 없다.',
      },
      {
        when: { all: [{ flag: 'e08_done' }, { flag: 'booth_did_role' }] },
        kind: 'changed',
        text: '박수는 없었다. 그래도 끝까지 남았다. "도망간 복학생"이라는 문장 위에 줄이 그어졌다.',
      },
      {
        when: { flag: 'e08_done' },
        kind: 'kept',
        text: '기록대로 되었다. 나는 또 빠졌다.',
      },
    ],
  },
  {
    id: 'd_photo',
    title: '축제 사진',
    showWhen: { flag: 'rival_met' },
    original: '축제 날, 하늘이 프로필 사진이 바뀌었다. 부스 앞, 하늘이 옆에는 도현 선배가 서 있었다. 나는 그 사진에 "좋아요"를 눌렀다.',
    outcomes: [
      {
        when: { flag: 'festival_with_haneul' },
        kind: 'changed',
        text: '축제 날, 하늘이 프로필 사진이 바뀌었다. 막걸리 잔을 뺏어 든 바보 같은 얼굴. 하늘이 옆에 있는 건 나였다.',
      },
      {
        when: { flag: 'rival_respect' },
        kind: 'changed',
        text: '축제 날, 도현 선배와 악수를 했다. 사진은 아직 모르겠다. 적어도 이번엔 "좋아요"만 누르고 있지는 않았다.',
      },
      {
        when: { flag: 'ER_festival_done' },
        kind: 'kept',
        text: '기록대로 되었다. 사진 속 하늘이 옆에는 도현 선배가 있었다.',
      },
    ],
  },
  {
    id: 'd_lastpage',
    title: '마지막 페이지 · 내 글씨가 아님',
    showWhen: { flag: 'lastpage_seen' },
    original: '"2학기 첫날, 너는 또 같은 선택을 하게 될 거야. 이번에는 내가 먼저 기다리지 않을게."',
    outcomes: [],
  },
  {
    id: 'd_friday',
    title: '그 주 금요일',
    showWhen: { all: [{ flag: 'recognized' }, { notFlag: 'note_exchange' }] },
    original:
      '그날 사람들은 처음으로 내 이름을 불렀다. 나는 그 목소리들을 듣느라, 오래전부터 내 이름을 불러 주던 사람을 못 봤다. 다음 주 금요일, 나는 약속을 술자리로 바꿨다.',
    outcomes: [
      {
        when: { flag: 'e10_good' },
        kind: 'changed',
        text: '다음 주 금요일, 나는 약속을 지켰다. 사람들이 부르는 이름보다, 원래 불러 주던 목소리를 골랐다.',
      },
      {
        when: { flag: 'e10_seen' },
        kind: 'kept',
        text: '기록대로 되었다. 금요일 밤, 나는 술자리에 있었다.',
      },
    ],
  },
]
