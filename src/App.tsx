import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { CharId, GameState, ResultSummary, StatKey } from './game/types'
import {
  STAT_LABEL,
  activityAvailable,
  allActivities,
  checkPlan,
  choiceEnabled,
  choiceVisible,
  choose,
  clearSave,
  currentEvent,
  isRestWeek,
  load,
  newGame,
  reservedEnergy,
  runWeek,
  save,
} from './game/engine'
import { RULES, mentalTier } from './game/rules'
import { CHARACTERS, CHAR_IDS } from './data/characters'
import { activityById } from './data/activities'

const STAT_ORDER: StatKey[] = ['looks', 'personality', 'fashion', 'wealth', 'academics', 'popularity']
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`
const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

function relStage(s: GameState, id: CharId) {
  const r = s.rels[id]
  if (!r.met) return '아직 모르는 사이'
  if (id === 'haneul' && s.flags.includes('friend_aware')) return '감정 자각'
  if (id === 'haneul') return '소꿉친구'
  if (r.h >= 30 && r.t >= 20) return '친구'
  return '아는 사이'
}

function Bar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="bar" aria-hidden>
      <div className={`bar-fill ${tone}`} style={{ width: `${value}%` }} />
    </div>
  )
}

export default function App() {
  const [state, setState] = useState<GameState>(() => load() ?? newGame())
  const [plan, setPlan] = useState<string[]>([])
  const [notices, setNotices] = useState<ResultSummary[]>([])

  useEffect(() => save(state), [state])

  const ev = state.phase === 'event' ? currentEvent(state) : undefined
  const planCheck = useMemo(() => checkPlan(state, plan), [state, plan])
  const reserved = reservedEnergy(state)
  const restWeek = isRestWeek(state)

  const pushWeekEnd = (s: GameState, weekBefore: number, list: ResultSummary[]) => {
    if (s.week !== weekBefore && s.lastWeekChanges?.length) {
      list.push({ title: `${weekBefore}주차 정산`, reaction: '용돈과 알바비가 들어왔다.', changes: s.lastWeekChanges })
    }
  }

  const startWeek = () => {
    if (!planCheck.ok) return
    const before = state.week
    const { state: next, activityChanges } = runWeek(state, plan)
    const list: ResultSummary[] = []
    if (activityChanges.length) list.push({ title: `${before}주차 활동`, reaction: '', changes: activityChanges })
    pushWeekEnd(next, before, list)
    setNotices(list)
    setPlan([])
    setState(next)
  }

  const pick = (choiceId: string) => {
    const before = state.week
    const next = choose(state, choiceId)
    const list: ResultSummary[] = []
    if (next.lastResult) list.push(next.lastResult)
    pushWeekEnd(next, before, list)
    setNotices(list)
    setState(next)
  }

  const restart = () => {
    if (!confirm('처음부터 다시 시작할까요? 지금 진행은 지워져요.')) return
    clearSave()
    setState(newGame())
    setPlan([])
    setNotices([])
  }

  const toggle = (id: string) => {
    const a = activityById(id)
    if (a.exclusive) return setPlan((p) => (p.includes(id) ? [] : [id]))
    setPlan((p) => {
      const base = p.filter((x) => !activityById(x).exclusive)
      const count = base.filter((x) => x === id).length
      return count < a.perWeek ? [...base, id] : base.filter((x) => x !== id)
    })
  }

  const notice = notices[0]
  const energyLeft = planCheck.energyAfter
  const tier = mentalTier(state.mental)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">복학생</span>
          <span className="brand-sub">다시 쓰는 캠퍼스 라이프</span>
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
        {/* ── 왼쪽: 프로필·스탯 ── */}
        <aside className="col">
          <section className="card profile">
            <div className="card-band">신원 기록 · 복학생</div>
            <div className="profile-body">
              <div className="avatar" aria-hidden>
                나
              </div>
              <div>
                <h2>주인공</h2>
                <dl className="kv">
                  <dt>나이</dt>
                  <dd>만 22세 · 군 전역</dd>
                  <dt>학년</dt>
                  <dd>2학년 (복학)</dd>
                  <dt>현금</dt>
                  <dd>{won(state.money)}</dd>
                </dl>
              </div>
            </div>
          </section>

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
        </aside>

        {/* ── 가운데: 진행 ── */}
        <section className="col center">
          {notice ? (
            <div className="card notice">
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
                  {ev.text.map((t, i) => (
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
                        <button disabled={!enabled} onClick={() => pick(c.id)}>
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
            <div className="card planner">
              <div className="event-head">
                <span className="tag">이번 주 계획</span>
                {restWeek && <span className="warn">회복 주간 · 가벼운 활동만 가능</span>}
              </div>
              <p className="muted">활동을 고르고 진행하면, 그 주의 사건이 이어서 일어나요.</p>
              <div className="chips">
                {allActivities().map((a) => {
                  const avail = activityAvailable(state, a)
                  const n = plan.filter((x) => x === a.id).length
                  return (
                    <button
                      key={a.id}
                      className={`chip ${n ? 'on' : ''}`}
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
                  남는 체력 <b className={energyLeft < 0 ? 'neg' : ''}>{energyLeft}</b>
                  {reserved > 0 && <span className="muted"> (약속 예약 {reserved} 포함)</span>}
                  {' · '}남는 돈 <b>{won(planCheck.moneyAfter)}</b>
                  {planCheck.overwork && planCheck.ok && <p className="warn">무리하는 중: 다음 주는 회복 주간이 돼요.</p>}
                  {planCheck.reason && <p className="warn">{planCheck.reason}</p>}
                </div>
                <button className="primary" disabled={!planCheck.ok} onClick={startWeek}>
                  {plan.length ? '이번 주 진행' : '아무것도 안 하고 넘기기'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── 오른쪽: 관계·기록 ── */}
        <aside className="col">
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
          <section className="card log">
            <h3>기록</h3>
            <ul>
              {[...state.log].reverse().slice(0, 30).map((l, i) => (
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

function SeasonEnd({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const top = [...CHAR_IDS].filter((id) => state.rels[id].met).sort((a, b) => state.rels[b].h - state.rels[a].h)[0]
  const memories = [
    state.flags.includes('recognized') && '축제 부스에서 서린 누나에게 공개적으로 인정받았다.',
    state.flags.includes('friend_aware') && '하늘이가 처음으로 친구 이상의 감정을 내비쳤다.',
    state.flags.includes('note_exchange') && '서윤이와 포스트잇을 주고받았다.',
    state.flags.includes('promise_kept') && '하늘이와의 약속을 지켰다.',
    state.flags.includes('noona_secret_leaked') && '서린 누나의 비밀을 퍼뜨렸다.',
    state.flags.includes('ignored_friend') && '인기에 취해 하늘이를 가볍게 대했다.',
  ].filter(Boolean) as string[]
  return (
    <div className="card notice">
      <h2>1학기 종강</h2>
      <p className="reaction">지난 13주의 기억</p>
      <ul className="changes">
        {memories.length ? memories.map((m) => <li key={m}>{m}</li>) : <li>조용한 학기였다.</li>}
      </ul>
      {top && (
        <div className="teaser">
          <img src={`${import.meta.env.BASE_URL}${CHARACTERS[top].image}`} alt="" />
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
