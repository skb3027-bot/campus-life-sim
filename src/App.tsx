import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { CharId, GameState, PointTarget, ResultSummary, StatKey } from './game/types'
import {
  POINT_LABEL,
  STAT_LABEL,
  acceptMission,
  activityAvailable,
  allActivities,
  allocatePoints,
  checkPlan,
  choiceEnabled,
  choiceVisible,
  choose,
  clearSave,
  currentEvent,
  currentStage,
  declineMission,
  isRestWeek,
  load,
  missionList,
  diaryPages,
  eventText,
  newGame,
  reservedEnergy,
  runWeek,
  save,
} from './game/engine'
import { RULES, heightScale, mentalTier } from './game/rules'
import { CHARACTERS, CHAR_IDS, heroImage } from './data/characters'
import { activityById } from './data/activities'
import { PROLOGUE } from './data/prologue'

const STAT_ORDER: StatKey[] = ['looks', 'personality', 'fashion', 'wealth', 'academics', 'popularity']
const POINT_TARGETS: PointTarget[] = ['looks', 'personality', 'academics', 'wealth', 'height']
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

function relStage(s: GameState, id: CharId) {
  const r = s.rels[id]
  if (!r.met) return '아직 모르는 사이'
  if (s.flags.includes(`couple_${id}`)) return '연인'
  if (id === 'haneul' && s.flags.includes('friend_aware')) return '감정 자각'
  if (s.flags.includes(`mutual_${id}`)) return '서로 관심'
  if (id === 'haneul') return '소꿉친구'
  if (r.h >= 30 && r.t >= 20) return '친구'
  return '아는 사이'
}

function Bar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="bar" aria-hidden>
      <div className={`bar-fill ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export default function App() {
  const [state, setState] = useState<GameState>(() => load() ?? newGame())
  const [plan, setPlan] = useState<string[]>([])
  const [notices, setNotices] = useState<ResultSummary[]>([])

  useEffect(() => save(state), [state])

  const apply = (next: GameState, first?: ResultSummary) => {
    setNotices((n) => [...n, ...(first ? [first] : []), ...next.notices])
    setState(next)
  }

  if (!state.flags.includes('prologue_done')) {
    return <Prologue onDone={() => setState((s) => ({ ...s, flags: [...s.flags, 'prologue_done'] }))} />
  }

  const ev = state.phase === 'event' ? currentEvent(state) : undefined
  const notice = notices[0]

  const startWeek = () => {
    const { state: next, activityChanges } = runWeek(state, plan)
    setPlan([])
    apply(
      next,
      activityChanges.length ? { title: `${state.week}주차 활동`, reaction: '', changes: activityChanges } : undefined,
    )
  }

  const restart = () => {
    if (!confirm('처음부터 다시 시작할까요? 지금 진행은 지워져요.')) return
    clearSave()
    setState(newGame())
    setPlan([])
    setNotices([])
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">복학생</span>
          <span className="brand-sub">회귀자의 일기</span>
        </div>
        <div className="week">
          <span className="week-big">{Math.min(state.week, RULES.seasonWeeks)}</span>
          <span>주차 · 2학년 1학기</span>
        </div>
        <div className="progress" aria-label="학기 진행">
          <div style={{ width: `${(Math.min(state.week - 1, RULES.seasonWeeks) / RULES.seasonWeeks) * 100}%` }} />
        </div>
        <button className="ghost" onClick={restart}>
          처음부터
        </button>
      </header>

      <main className="layout">
        <aside className="col">
          <Profile state={state} />
          <StatusWindow state={state} apply={apply} />
          <StatsCard state={state} />
        </aside>

        <section className="col center">
          {notice ? (
            <div className={`card notice notice-${notice.kind ?? 'result'}`}>
              <h3>{notice.title}</h3>
              {notice.reaction && <p className="reaction">{notice.reaction}</p>}
              {notice.changes.length > 0 && (
                <ul className="changes">
                  {notice.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              )}
              <button className="primary" onClick={() => setNotices((n) => n.slice(1))}>
                계속
              </button>
            </div>
          ) : state.phase === 'season_end' ? (
            <SeasonEnd state={state} onRestart={restart} />
          ) : ev ? (
            <div className="card event">
              <div className="event-head">
                <span className="tag">사건</span>
                <span className="muted">{state.week}주차</span>
              </div>
              <div className="event-body">
                {ev.portrait && <img className="portrait" src={asset(ev.portrait)} alt="" />}
                <div className="event-text">
                  <h2>{ev.title}</h2>
                  {state.reactionLine && <p className="reaction-line">{state.reactionLine}</p>}
                  {eventText(state, ev).map((t, i) => (
                    <p key={i} className={t.startsWith('"') ? 'line' : ''}>
                      {t}
                    </p>
                  ))}
                </div>
              </div>
              <ol className="choices">
                {ev.choices
                  .filter((c) => choiceVisible(state, c))
                  .map((c, i) => {
                    const enabled = choiceEnabled(state, c)
                    return (
                      <li key={c.id}>
                        <button disabled={!enabled} onClick={() => apply(choose(state, c.id))}>
                          <span className="num">{i + 1}</span>
                          <span>{c.text}</span>
                          {!enabled && <em className="lock">🔒 {c.lockedHint}</em>}
                        </button>
                      </li>
                    )
                  })}
              </ol>
            </div>
          ) : (
            <Planner state={state} plan={plan} setPlan={setPlan} onStart={startWeek} />
          )}
        </section>

        <aside className="col">
          <Diary state={state} />
          <Relationships state={state} />
          <section className="card log">
            <h3>기록</h3>
            <ul>
              {[...state.log]
                .reverse()
                .slice(0, 30)
                .map((l, i) => (
                  <li key={i}>
                    <span className="muted">{l.week}주</span>
                    {l.text}
                  </li>
                ))}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  )
}

/* ───────── 프롤로그 ───────── */

function Prologue({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0)
  const p = PROLOGUE[page]
  const last = page === PROLOGUE.length - 1
  return (
    <div className={`prologue prologue-${p.kind}`}>
      <div className="prologue-box" key={page}>
        {p.kind === 'diary' && <div className="diary-head">낡은 일기장 · 첫 페이지</div>}
        {p.lines.map((l, i) => (
          <p key={i} style={{ animationDelay: `${i * 0.5}s` }}>
            {l}
          </p>
        ))}
      </div>
      <div className="prologue-nav">
        <button className="ghost" onClick={onDone}>
          건너뛰기
        </button>
        <span className="muted">
          {page + 1} / {PROLOGUE.length}
        </span>
        <button className="primary" onClick={() => (last ? onDone() : setPage(page + 1))}>
          {last ? '복학하기' : '다음'}
        </button>
      </div>
    </div>
  )
}

/* ───────── 프로필 ───────── */

function Profile({ state }: { state: GameState }) {
  const stage = currentStage(state)
  return (
    <section className="card profile">
      <div className="card-band">신원 기록 · 복학생</div>
      <div className="hero-frame">
        <img
          className="hero"
          src={asset(heroImage(stage))}
          alt="주인공"
          style={{ transform: `scale(${heightScale(state.height)})` }}
        />
        <span className="stage-badge">외형 {stage}단계</span>
      </div>
      <div className="profile-body">
        <dl className="kv">
          <dt>나이</dt>
          <dd>23살 (만 22세) · 군 전역</dd>
          <dt>키</dt>
          <dd>{state.height}cm</dd>
          <dt>현금</dt>
          <dd>{won(state.money)}</dd>
        </dl>
      </div>
    </section>
  )
}

function StatsCard({ state }: { state: GameState }) {
  const tier = mentalTier(state.mental)
  return (
    <section className="card">
      <h3>능력치</h3>
      {STAT_ORDER.map((k) => (
        <div className="stat" key={k}>
          <span>{STAT_LABEL[k]}</span>
          <Bar value={state.stats[k]} tone={k} />
          <b>{state.stats[k]}</b>
        </div>
      ))}
      <div className="divider" />
      <div className="stat">
        <span>멘탈</span>
        <Bar value={state.mental} tone="mental" />
        <b>{state.mental}</b>
      </div>
      <p className={`tier tier-${tier}`}>
        {tier}
        {tier === '위축' && ' · 호감 상승 0.7배, 적극적 표현 제한'}
        {tier === '번아웃' && ' · 스탯 성장 0.5배'}
        {tier === '자신감' && ' · 자신감 있는 표현 가능'}
      </p>
      <div className="stat">
        <span>체력</span>
        <Bar value={(Math.max(0, state.energy) / state.maxEnergy) * 100} tone="energy" />
        <b>
          {state.energy}/{state.maxEnergy}
        </b>
      </div>
    </section>
  )
}

/* ───────── 상태창: 포인트 배분 · 미션 ───────── */

function StatusWindow({ state, apply }: { state: GameState; apply: (s: GameState) => void }) {
  const [alloc, setAlloc] = useState<Partial<Record<PointTarget, number>>>({})
  const used = Object.values(alloc).reduce((a, b) => a + (b ?? 0), 0)
  const left = state.points - used
  const missions = missionList(state)
  const active = missions.filter((m) => m.state.status === 'active')
  const offered = missions.filter((m) => m.state.status === 'offered')
  const done = missions.filter((m) => m.state.status === 'done').length

  const bump = (k: PointTarget, d: number) =>
    setAlloc((a) => {
      const cur = a[k] ?? 0
      const next = cur + d
      if (next < 0 || (d > 0 && left <= 0)) return a
      if (k === 'height' && state.height + next > RULES.maxHeight) return a
      return { ...a, [k]: next }
    })

  return (
    <section className="card system">
      <div className="system-head">
        <span>상태창</span>
        <b>{state.points}P</b>
      </div>

      {state.points > 0 && (
        <div className="alloc">
          <p className="muted">포인트를 직접 배분하세요. 남은 {left}P</p>
          {POINT_TARGETS.map((k) => (
            <div className="alloc-row" key={k}>
              <span>{POINT_LABEL[k]}</span>
              <button onClick={() => bump(k, -1)} aria-label="빼기">
                −
              </button>
              <b>{alloc[k] ?? 0}</b>
              <button onClick={() => bump(k, 1)} aria-label="더하기">
                +
              </button>
            </div>
          ))}
          <button
            className="primary small"
            disabled={used === 0}
            onClick={() => {
              apply(allocatePoints(state, alloc))
              setAlloc({})
            }}
          >
            배분 확정
          </button>
        </div>
      )}

      {offered.length > 0 && (
        <div className="mission-group">
          <h4>도착한 미션</h4>
          {offered.map(({ def }) => (
            <div className={`mission offered ${def.kind}`} key={def.id}>
              <b>{def.title}</b>
              <small>{def.desc}</small>
              <small className="reward">
                보상 {def.reward}P · {def.deadlineWeek ? `${def.deadlineWeek}주까지` : `수락 후 ${def.deadlineAfter}주`}
              </small>
              <div className="mission-actions">
                <button className="primary small" onClick={() => apply(acceptMission(state, def.id))}>
                  수락
                </button>
                <button className="ghost" onClick={() => apply(declineMission(state, def.id))}>
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mission-group">
        <h4>진행 중</h4>
        {active.length === 0 && <p className="muted">진행 중인 미션이 없어요.</p>}
        {active.map(({ def, state: m }) => (
          <div className={`mission ${def.kind}`} key={def.id}>
            <b>
              {def.kind === 'romance' && `${'①②③④⑤'[(def.stage ?? 1) - 1]} `}
              {def.title}
            </b>
            <small>{def.desc}</small>
            <small className="reward">
              {def.reward}P · {m.deadline}주 마감
            </small>
          </div>
        ))}
      </div>
      <p className="muted">완료한 미션 {done}개</p>
    </section>
  )
}

/* ───────── 계획 ───────── */

function Planner({
  state,
  plan,
  setPlan,
  onStart,
}: {
  state: GameState
  plan: string[]
  setPlan: (f: (p: string[]) => string[]) => void
  onStart: () => void
}) {
  const planCheck = useMemo(() => checkPlan(state, plan), [state, plan])
  const reserved = reservedEnergy(state)
  const toggle = (id: string) => {
    const a = activityById(id)
    if (a.exclusive) return setPlan((p) => (p.includes(id) ? [] : [id]))
    setPlan((p) => {
      const base = p.filter((x) => !activityById(x).exclusive)
      const count = base.filter((x) => x === id).length
      return count < a.perWeek ? [...base, id] : base.filter((x) => x !== id)
    })
  }
  const visible = allActivities().filter((a) =>
    !a.id.startsWith('act_rom_') && !a.id.startsWith('date_') && a.id !== 'helpOthers'
      ? true
      : activityAvailable(state, a),
  )
  return (
    <div className="card planner">
      <div className="event-head">
        <span className="tag">이번 주 계획</span>
        {isRestWeek(state) && <span className="warn">회복 주간 · 가벼운 활동만 가능</span>}
      </div>
      <p className="muted">활동을 고르고 진행하면, 그 주의 사건이 이어서 일어나요.</p>
      <div className="chips">
        {visible.map((a) => {
          const avail = activityAvailable(state, a)
          const n = plan.filter((x) => x === a.id).length
          const special = a.id.startsWith('act_rom_') || a.id.startsWith('date_') || a.id === 'helpOthers'
          return (
            <button
              key={a.id}
              className={`chip ${n ? 'on' : ''} ${special ? 'chip-mission' : ''}`}
              disabled={!avail}
              onClick={() => toggle(a.id)}
              title={a.desc}
            >
              <b>
                {a.name}
                {n > 1 && ` ×${n}`}
              </b>
              <small>{a.desc}</small>
              <small className="cost">
                체력 {a.energy}
                {a.cost ? ` · ${won(a.cost)}` : ''}
                {a.perWeek > 1 ? ` · 주 ${a.perWeek}회` : ''}
              </small>
            </button>
          )
        })}
      </div>
      <div className="plan-foot">
        <div>
          남는 체력 <b className={planCheck.energyAfter < 0 ? 'neg' : ''}>{planCheck.energyAfter}</b>
          {reserved > 0 && <span className="muted"> (약속 예약 {reserved} 포함)</span>}
          {' · '}남는 돈 <b>{won(planCheck.moneyAfter)}</b>
          {planCheck.overwork && planCheck.ok && <p className="warn">무리하는 중: 다음 주는 회복 주간이 돼요.</p>}
          {planCheck.reason && <p className="warn">{planCheck.reason}</p>}
        </div>
        <button className="primary" disabled={!planCheck.ok} onClick={onStart}>
          {plan.length ? '이번 주 진행' : '아무것도 안 하고 넘기기'}
        </button>
      </div>
    </div>
  )
}

/* ───────── 회귀자의 일기 ───────── */

function Diary({ state }: { state: GameState }) {
  const pages = diaryPages(state)
  if (!pages.length) return null
  return (
    <section className="card diary">
      <h3>회귀자의 일기</h3>
      {pages.map((p) => (
        <div className="diary-page" key={p.id}>
          <b>{p.title}</b>
          <p className={p.result?.kind === 'changed' ? 'struck' : ''}>{p.original}</p>
          {p.result ? (
            <p className={`diary-result ${p.result.kind}`}>
              {p.result.kind === 'changed' ? '→ ' : ''}
              {p.result.text}
            </p>
          ) : (
            <p className="muted">아직 일어나지 않은 미래</p>
          )}
        </div>
      ))}
    </section>
  )
}

/* ───────── 관계 ───────── */

function Relationships({ state }: { state: GameState }) {
  return (
    <section className="card">
      <h3>관계</h3>
      {CHAR_IDS.map((id) => {
        const c = CHARACTERS[id]
        const r = state.rels[id]
        return (
          <div className={`rel ${r.met ? '' : 'unknown'}`} key={id}>
            <img src={asset(c.image)} alt="" />
            <div className="rel-info">
              <div className="rel-name">
                <b>{r.met ? c.name : '???'}</b>
                <span className="muted">{r.met ? `만 ${c.age}세 · ${relStage(state, id)}` : relStage(state, id)}</span>
              </div>
              {r.met && (
                <>
                  <div className="stat mini">
                    <span>호감</span>
                    <Bar value={r.h} tone="h" />
                    <b>{r.h}</b>
                  </div>
                  <div className="stat mini">
                    <span>신뢰</span>
                    <Bar value={r.t} tone="t" />
                    <b>{r.t}</b>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}

/* ───────── 종강 ───────── */

function SeasonEnd({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const top = [...CHAR_IDS].filter((id) => state.rels[id].met).sort((a, b) => state.rels[b].h - state.rels[a].h)[0]
  const earned = state.pointLog.reduce((a, x) => a + x.earned, 0)
  const memories = [
    state.flags.includes('recognized') && '축제 부스에서 서린 누나에게 공개적으로 인정받았다.',
    state.flags.includes('friend_aware') && '하늘이가 처음으로 친구 이상의 감정을 내비쳤다.',
    state.flags.includes('note_exchange') && '서윤이와 포스트잇을 주고받았다.',
    state.flags.includes('promise_kept') && '하늘이와의 약속을 지켰다.',
    state.flags.includes('noona_secret_leaked') && '서린 누나의 비밀을 퍼뜨렸다.',
    state.flags.includes('ignored_friend') && '인기에 취해 하늘이를 가볍게 대했다.',
    ...CHAR_IDS.filter((id) => state.flags.includes(`couple_${id}`)).map(
      (id) => `${CHARACTERS[id].name}와(과) 연인이 되었다.`,
    ),
  ].filter(Boolean) as string[]
  return (
    <div className="card notice">
      <h2>1학기 종강</h2>
      <p className="reaction">
        외형 {currentStage(state)}단계 · 키 {state.height}cm · 획득 포인트 {earned}P
      </p>
      <ul className="changes">
        {memories.length ? memories.map((m) => <li key={m}>{m}</li>) : <li>조용한 학기였다.</li>}
      </ul>
      {top && (
        <div className="teaser">
          <img src={asset(CHARACTERS[top].image)} alt="" />
          <p>
            여름방학, <b>{CHARACTERS[top].name}</b>와(과)의 이야기가 이어집니다.
            <br />
            <span className="muted">시즌 2 · 준비 중</span>
          </p>
        </div>
      )}
      <button className="primary" onClick={onRestart}>
        처음부터 다시
      </button>
    </div>
  )
}
