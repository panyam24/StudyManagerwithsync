import { useState, useMemo } from 'react'
import { useAppStore, useAuthStore, ATTENDANCE_STATUS } from '../store'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval, eachDayOfInterval, isToday, isBefore } from 'date-fns'

// ── helpers ──────────────────────────────────────────────────────────────────
const today = () => format(new Date(), 'yyyy-MM-dd')

const PERIODS = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: '3months' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom', value: 'custom' },
]

function getRange(period, custom) {
  const now = new Date()
  switch (period) {
    case 'week':      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'month':     return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_month': { const lm = subMonths(now, 1); return { start: startOfMonth(lm), end: endOfMonth(lm) } }
    case '3months':   return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case 'all':       return null
    case 'custom':    return custom.start && custom.end ? { start: new Date(custom.start), end: new Date(custom.end) } : null
    default:          return null
  }
}

function calcStats(records) {
  const total = records.length
  const present = records.filter(r => r.status === 'present').length
  const absent = records.filter(r => r.status === 'absent').length
  const late = records.filter(r => r.status === 'late').length
  const attended = present + late
  const pct = total > 0 ? Math.round((attended / total) * 100) : null
  return { total, present, absent, late, attended, pct }
}

function PctRing({ pct, size = 64, stroke = 6 }) {
  if (pct === null) return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: '11px' }}>No data</div>
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 75 ? '#34d8a2' : pct >= 50 ? '#f5a524' : '#f97066'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size > 60 ? '13px' : '11px', fontWeight: '700', color }}>
        {pct}%
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = ATTENDANCE_STATUS[status]
  if (!s) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: s.color + '22', color: s.color }}>
      {s.icon} {s.label}
    </span>
  )
}

// ── Mark Attendance Modal ───────────────────────────────────────────────────
function MarkModal({ subjects, userId, onClose, markAttendance, getAttendanceRecord, initialSubjectId }) {
  const [subjectId, setSubjectId] = useState(initialSubjectId || subjects[0]?.id || '')
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')

  const existing = getAttendanceRecord(userId, subjectId, date)

  const mark = (status) => {
    if (!subjectId || !date) return
    markAttendance({ subjectId, date, status, note }, userId)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', margin: '0 0 20px', color: 'var(--text)' }}>Mark Attendance</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today()} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Sick, lab session…" />
          </div>
        </div>

        {existing && (
          <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '14px', padding: '8px 12px', background: 'var(--surface2)', borderRadius: '8px' }}>
            Already marked as <strong style={{ color: ATTENDANCE_STATUS[existing.status]?.color }}>{ATTENDANCE_STATUS[existing.status]?.label}</strong> — selecting below will update it.
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {Object.entries(ATTENDANCE_STATUS).map(([key, s]) => (
            <button key={key} onClick={() => mark(key)}
              style={{ flex: 1, padding: '12px 8px', borderRadius: '10px', border: `2px solid ${s.color}`, background: existing?.status === key ? s.color + '33' : 'transparent', color: s.color, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.15s' }}>
              <span style={{ fontSize: '18px' }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
      </div>
    </div>
  )
}

// ── Calendar mini-view for a subject ──────────────────────────────────────
function SubjectCalendar({ records, year, month }) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const recMap = {}
  records.forEach(r => { recMap[r.date] = r.status })

  const startPad = (firstDay.getDay() + 6) % 7 // Mon=0

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '4px' }}>
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text2)', fontWeight: '600' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {Array(startPad).fill(null).map((_, i) => <div key={'p' + i} />)}
        {days.map(d => {
          const key = format(d, 'yyyy-MM-dd')
          const status = recMap[key]
          const color = status ? ATTENDANCE_STATUS[status]?.color : undefined
          const isFuture = isBefore(new Date(), d) && !isToday(d)
          return (
            <div key={key} style={{
              aspectRatio: '1', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: status ? '700' : '400',
              background: color ? color + '33' : isFuture ? 'transparent' : 'var(--surface2)',
              color: color || (isFuture ? 'var(--border)' : 'var(--text2)'),
              border: isToday(d) ? '1px solid var(--accent)' : '1px solid transparent',
            }}>
              {d.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { currentUser } = useAuthStore()
  const { subjects, attendance, markAttendance, deleteAttendance, getAttendanceRecord } = useAppStore()
  const uid = currentUser?.id

  const mySubjects = subjects.filter(s => s.userId === uid)
  const myAttendance = attendance.filter(a => a.userId === uid)

  const [period, setPeriod] = useState('month')
  const [custom, setCustom] = useState({ start: '', end: '' })
  const [showMark, setShowMark] = useState(false)
  const [markSubjectId, setMarkSubjectId] = useState('')
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'log'
  const [calMonth, setCalMonth] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }))
  const [calSubject, setCalSubject] = useState('')

  const range = useMemo(() => getRange(period, custom), [period, custom])

  const filtered = useMemo(() => {
    if (!range) return myAttendance
    return myAttendance.filter(a => {
      const d = parseISO(a.date)
      return isWithinInterval(d, { start: range.start, end: range.end })
    })
  }, [myAttendance, range])

  const overallStats = useMemo(() => calcStats(filtered), [filtered])

  const subjectStats = useMemo(() =>
    mySubjects.map(s => {
      const recs = filtered.filter(a => a.subjectId === s.id)
      return { ...s, stats: calcStats(recs), records: recs }
    }),
    [mySubjects, filtered]
  )

  // Log view
  const logRecords = useMemo(() =>
    [...filtered]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(r => ({ ...r, subject: mySubjects.find(s => s.id === r.subjectId) })),
    [filtered, mySubjects]
  )

  const calRecords = useMemo(() => {
    if (!calSubject) return []
    return myAttendance.filter(a => a.subjectId === calSubject)
  }, [myAttendance, calSubject])

  if (mySubjects.length === 0) {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🏫</div>
        <h2 style={{ fontFamily: 'Syne', color: 'var(--text)', margin: 0 }}>No subjects yet</h2>
        <p style={{ color: 'var(--text2)', textAlign: 'center', maxWidth: '300px', margin: 0 }}>Add subjects first from the Subjects page, then come back to track attendance.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '700', margin: '0 0 4px', color: 'var(--text)' }}>Attendance</h1>
          <p style={{ color: 'var(--text2)', margin: 0, fontSize: '14px' }}>Track and monitor your class attendance</p>
        </div>
        <button className="btn-primary" onClick={() => { setMarkSubjectId(''); setShowMark(true) }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          + Mark Attendance
        </button>
      </div>

      {/* Period selector */}
      <div className="animate-fadeUp stagger-1" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${period === p.value ? 'var(--accent)' : 'var(--border)'}`, background: period === p.value ? 'rgba(124,106,247,0.15)' : 'transparent', color: period === p.value ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', fontWeight: period === p.value ? '600' : '400', transition: 'all 0.15s' }}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="date" value={custom.start} onChange={e => setCustom(c => ({ ...c, start: e.target.value }))} style={{ width: '150px' }} />
            <span style={{ color: 'var(--text2)' }}>to</span>
            <input type="date" value={custom.end} onChange={e => setCustom(c => ({ ...c, end: e.target.value }))} style={{ width: '150px' }} />
          </div>
        )}
      </div>

      {/* Overall stats */}
      <div className="animate-fadeUp stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Overall Attendance', value: overallStats.pct !== null ? `${overallStats.pct}%` : '—', sub: `${overallStats.attended}/${overallStats.total} classes`, color: overallStats.pct >= 75 ? 'var(--accent3)' : overallStats.pct >= 50 ? '#f5a524' : 'var(--accent2)' },
          { label: 'Present', value: overallStats.present, sub: 'on time', color: '#34d8a2' },
          { label: 'Late', value: overallStats.late, sub: 'but attended', color: '#f5a524' },
          { label: 'Absent', value: overallStats.absent, sub: 'missed', color: '#f97066' },
          { label: 'Total Recorded', value: overallStats.total, sub: 'entries', color: 'var(--accent)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ borderRadius: '12px', padding: '18px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Syne', color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', marginBottom: '2px' }}>{stat.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', borderRadius: '10px', padding: '4px', marginBottom: '24px', width: 'fit-content' }}>
        {[{ id: 'overview', label: '📊 Overview' }, { id: 'calendar', label: '📅 Calendar' }, { id: 'log', label: '📋 Log' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', fontWeight: '500', transition: 'all 0.15s', background: activeTab === t.id ? 'var(--accent)' : 'transparent', color: activeTab === t.id ? 'white' : 'var(--text2)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="animate-fadeUp" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {subjectStats.map(s => {
            const warn = s.stats.pct !== null && s.stats.pct < 75
            return (
              <div key={s.id} className="card" style={{ borderRadius: '14px', padding: '20px', borderLeft: `3px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '15px', fontFamily: 'Syne' }}>{s.name}</span>
                    </div>
                    {s.teacher && <div style={{ fontSize: '12px', color: 'var(--text2)', marginLeft: '18px' }}>{s.teacher}</div>}
                    {warn && (
                      <div style={{ marginTop: '6px', marginLeft: '18px', fontSize: '11px', color: '#f97066', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚠ Below 75% threshold
                      </div>
                    )}
                  </div>
                  <PctRing pct={s.stats.pct} size={60} stroke={5} />
                </div>

                {/* Mini stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
                  {[
                    { key: 'present', color: '#34d8a2' },
                    { key: 'late', color: '#f5a524' },
                    { key: 'absent', color: '#f97066' },
                  ].map(({ key, color }) => (
                    <div key={key} style={{ textAlign: 'center', padding: '8px', background: color + '15', borderRadius: '8px' }}>
                      <div style={{ fontWeight: '700', color, fontSize: '18px' }}>{s.stats[key]}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text2)', textTransform: 'capitalize' }}>{key}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>
                    <span>Attendance</span>
                    <span>{s.stats.total} classes recorded</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px', transition: 'width 0.6s ease',
                      width: s.stats.pct !== null ? `${s.stats.pct}%` : '0%',
                      background: s.stats.pct >= 75 ? '#34d8a2' : s.stats.pct >= 50 ? '#f5a524' : '#f97066',
                    }} />
                  </div>
                </div>

                <button onClick={() => { setMarkSubjectId(s.id); setShowMark(true) }}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: `1px solid ${s.color}40`, background: s.color + '15', color: s.color, cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '12px', fontWeight: '600', transition: 'all 0.15s' }}>
                  + Mark for {s.name}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Calendar tab */}
      {activeTab === 'calendar' && (
        <div className="animate-fadeUp">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <select value={calSubject} onChange={e => setCalSubject(e.target.value)} style={{ width: '220px' }}>
              <option value="">Select a subject…</option>
              {mySubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setCalMonth(m => {
                const d = new Date(m.year, m.month - 1, 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '14px' }}>‹</button>
              <span style={{ color: 'var(--text)', fontWeight: '600', minWidth: '130px', textAlign: 'center', fontFamily: 'Syne' }}>
                {format(new Date(calMonth.year, calMonth.month, 1), 'MMMM yyyy')}
              </span>
              <button onClick={() => setCalMonth(m => {
                const d = new Date(m.year, m.month + 1, 1)
                return { year: d.getFullYear(), month: d.getMonth() }
              })} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '14px' }}>›</button>
            </div>
          </div>

          {calSubject ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 240px', gap: '20px', alignItems: 'start' }}>
              <div className="card" style={{ borderRadius: '14px', padding: '24px' }}>
                <SubjectCalendar records={calRecords} year={calMonth.year} month={calMonth.month} />
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  {Object.entries(ATTENDANCE_STATUS).map(([k, s]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text2)' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color + '55', border: `1px solid ${s.color}` }} />
                      {s.label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(() => {
                  const monthRecs = calRecords.filter(r => {
                    const d = parseISO(r.date)
                    return d.getFullYear() === calMonth.year && d.getMonth() === calMonth.month
                  })
                  const stats = calcStats(monthRecs)
                  return (
                    <div className="card" style={{ borderRadius: '12px', padding: '18px' }}>
                      <div style={{ fontFamily: 'Syne', fontWeight: '700', color: 'var(--text)', marginBottom: '14px', fontSize: '14px' }}>Month Stats</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <PctRing pct={stats.pct} size={72} stroke={7} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                            {[{ label: 'Present', v: stats.present, c: '#34d8a2' }, { label: 'Late', v: stats.late, c: '#f5a524' }, { label: 'Absent', v: stats.absent, c: '#f97066' }].map(x => (
                              <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                <span style={{ color: x.c, fontWeight: '700' }}>{x.v}</span>
                                <span style={{ color: 'var(--text2)' }}>{x.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
              Select a subject to view its calendar
            </div>
          )}
        </div>
      )}

      {/* Log tab */}
      {activeTab === 'log' && (
        <div className="animate-fadeUp">
          {logRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
              No attendance records for this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logRecords.map(r => (
                <div key={r.id} className="card" style={{ borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.subject?.color || 'var(--border)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>{r.subject?.name || 'Unknown'}</div>
                    {r.note && <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{r.note}</div>}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', flexShrink: 0 }}>
                    {format(parseISO(r.date), 'MMM d, yyyy')}
                  </div>
                  <StatusBadge status={r.status} />
                  <button onClick={() => deleteAttendance(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '16px', padding: '4px', borderRadius: '4px', lineHeight: 1 }} title="Delete">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showMark && (
        <MarkModal
          subjects={mySubjects}
          userId={uid}
          onClose={() => setShowMark(false)}
          markAttendance={markAttendance}
          getAttendanceRecord={getAttendanceRecord}
          initialSubjectId={markSubjectId}
        />
      )}
    </div>
  )
}
