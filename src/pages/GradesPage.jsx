import { useState, useMemo } from 'react'
import { useAppStore, useAuthStore, GRADE_TYPES } from '../store'
import { format, parseISO } from 'date-fns'

function GradeModal({ grade, subjects, onClose }) {
  const { addGrade, updateGrade } = useAppStore()
  const { currentUser } = useAuthStore()
  const [form, setForm] = useState({
    title: grade?.title || '',
    subjectId: grade?.subjectId || subjects[0]?.id || '',
    score: grade?.score ?? '',
    maxScore: grade?.maxScore ?? 100,
    type: grade?.type || 'Assignment',
    date: grade?.date || new Date().toISOString().slice(0, 10),
    notes: grade?.notes || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    const data = { ...form, score: Number(form.score), maxScore: Number(form.maxScore) }
    if (grade) updateGrade(grade.id, data)
    else addGrade(data, currentUser.id)
    onClose()
  }

  const pct = form.score !== '' && form.maxScore ? ((Number(form.score) / Number(form.maxScore)) * 100).toFixed(1) : null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700', margin: '0 0 24px' }}>{grade ? 'Edit Grade' : 'Record Grade'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Midterm Exam" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Subject</label>
              <select value={form.subjectId} onChange={e => set('subjectId', e.target.value)}>
                <option value="">— No subject —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {GRADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Score *</label>
              <input type="number" value={form.score} onChange={e => set('score', e.target.value)} placeholder="85" required min={0} max={form.maxScore} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Out of</label>
              <input type="number" value={form.maxScore} onChange={e => set('maxScore', e.target.value)} required min={1} />
            </div>
          </div>
          {pct !== null && (
            <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: '700', color: Number(pct) >= 75 ? 'var(--accent3)' : Number(pct) >= 50 ? '#f5a524' : 'var(--accent2)' }}>{pct}%</div>
              <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                {Number(pct) >= 90 ? 'Excellent!' : Number(pct) >= 75 ? 'Good work' : Number(pct) >= 60 ? 'Satisfactory' : Number(pct) >= 50 ? 'Needs improvement' : 'Failing — review material'}
              </div>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{grade ? 'Save Changes' : 'Record Grade'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const gradeColor = (pct) => pct >= 75 ? 'var(--accent3)' : pct >= 50 ? '#f5a524' : 'var(--accent2)'
const gradeLetter = (pct) => pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'

export default function GradesPage() {
  const { grades, subjects, deleteGrade } = useAppStore()
  const { currentUser } = useAuthStore()
  const uid = currentUser?.id
  const [modal, setModal] = useState(null)
  const [filterSubject, setFilterSubject] = useState('all')

  const mySubjects = subjects.filter(s => s.userId === uid)
  const myGrades = grades.filter(g => g.userId === uid)

  const filtered = filterSubject === 'all' ? myGrades : myGrades.filter(g => g.subjectId === filterSubject)
  const sorted = [...filtered].sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1)

  const overall = myGrades.length ? (myGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / myGrades.length) : null

  // Per-subject averages
  const subjectStats = useMemo(() => mySubjects.map(s => {
    const sg = myGrades.filter(g => g.subjectId === s.id)
    const avg = sg.length ? sg.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / sg.length : null
    return { ...s, avg, count: sg.length }
  }), [mySubjects, myGrades])

  const getSubject = id => mySubjects.find(s => s.id === id)

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>Grades</h1>
          <p style={{ color: 'var(--text2)', margin: 0, fontSize: '14px' }}>{myGrades.length} grade{myGrades.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Record Grade</button>
      </div>

      {/* Overall stats */}
      {overall !== null && (
        <div className="animate-fadeUp stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '36px', fontWeight: '800', color: gradeColor(overall) }}>{overall.toFixed(1)}%</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Overall Average</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '36px', fontWeight: '800', color: gradeColor(overall) }}>{gradeLetter(overall)}</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Letter Grade</div>
          </div>
          {subjectStats.filter(s => s.avg !== null).slice(0, 3).map(s => (
            <div key={s.id} className="card" style={{ textAlign: 'center', borderTop: `2px solid ${s.color}` }}>
              <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '800', color: gradeColor(s.avg) }}>{s.avg.toFixed(0)}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="animate-fadeUp stagger-2" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilterSubject('all')}
          style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', borderColor: filterSubject === 'all' ? 'var(--accent)' : 'var(--border)', background: filterSubject === 'all' ? 'rgba(124,106,247,0.15)' : 'transparent', color: filterSubject === 'all' ? 'var(--accent)' : 'var(--text2)' }}>
          All Subjects
        </button>
        {mySubjects.map(s => (
          <button key={s.id} onClick={() => setFilterSubject(s.id)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', borderColor: filterSubject === s.id ? s.color : 'var(--border)', background: filterSubject === s.id ? `${s.color}20` : 'transparent', color: filterSubject === s.id ? s.color : 'var(--text2)' }}>
            {s.name}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
          <h3 style={{ fontFamily: 'Syne', margin: '0 0 8px' }}>No grades yet</h3>
          <p style={{ color: 'var(--text2)', margin: '0 0 20px', fontSize: '14px' }}>Record your first grade to track your academic progress</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Record Grade</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorted.map(g => {
            const pct = (g.score / g.maxScore) * 100
            const subj = getSubject(g.subjectId)
            return (
              <div key={g.id} className="card animate-fadeUp" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Grade circle */}
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `${gradeColor(pct)}20`, border: `2px solid ${gradeColor(pct)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'Syne', fontSize: '14px', fontWeight: '700', color: gradeColor(pct), lineHeight: 1 }}>{gradeLetter(pct)}</span>
                  <span style={{ fontSize: '10px', color: gradeColor(pct) }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)' }}>{g.title}</span>
                    <span className="tag" style={{ background: 'var(--surface2)', color: 'var(--text2)', fontSize: '11px' }}>{g.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text2)' }}>
                    {subj && <span style={{ color: subj.color }}>● {subj.name}</span>}
                    <span>{g.score}/{g.maxScore}</span>
                    {g.date && <span>📅 {format(parseISO(g.date), 'MMM d, yyyy')}</span>}
                  </div>
                  {g.notes && <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px', fontStyle: 'italic' }}>{g.notes}</div>}
                </div>
                {/* Progress bar */}
                <div style={{ width: '80px', flexShrink: 0 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: gradeColor(pct) }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => setModal(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: 'var(--text2)' }}>✏️</button>
                  <button onClick={() => { if (confirm('Delete this grade?')) deleteGrade(g.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: 'var(--text2)' }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <GradeModal grade={modal === 'add' ? null : modal} subjects={mySubjects} onClose={() => setModal(null)} />}
    </div>
  )
}
