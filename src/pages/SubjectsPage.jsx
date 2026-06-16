import { useState } from 'react'
import { useAppStore, useAuthStore, SUBJECT_COLORS } from '../store'

function SubjectModal({ subject, onClose }) {
  const { addSubject, updateSubject } = useAppStore()
  const { currentUser } = useAuthStore()
  const [form, setForm] = useState({
    name: subject?.name || '',
    teacher: subject?.teacher || '',
    color: subject?.color || SUBJECT_COLORS[0],
    credits: subject?.credits || '',
    description: subject?.description || '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (subject) updateSubject(subject.id, form)
    else addSubject(form, currentUser.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700', margin: '0 0 24px' }}>{subject ? 'Edit Subject' : 'Add Subject'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Subject Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Mathematics" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Teacher / Professor</label>
            <input value={form.teacher} onChange={e => set('teacher', e.target.value)} placeholder="e.g. Dr. Smith" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Credits</label>
            <input type="number" value={form.credits} onChange={e => set('credits', e.target.value)} placeholder="e.g. 3" min="0" max="20" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional notes about this subject…" rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SUBJECT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: form.color === c ? '0 0 0 2px ' + c : 'none', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{subject ? 'Save Changes' : 'Add Subject'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SubjectsPage() {
  const { subjects, assignments, grades, deleteSubject } = useAppStore()
  const { currentUser } = useAuthStore()
  const uid = currentUser?.id
  const [modal, setModal] = useState(null) // null | 'add' | subject

  const mySubjects = subjects.filter(s => s.userId === uid)
  const myAssignments = assignments.filter(a => a.userId === uid)
  const myGrades = grades.filter(g => g.userId === uid)

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>Subjects</h1>
          <p style={{ color: 'var(--text2)', margin: 0, fontSize: '14px' }}>{mySubjects.length} subject{mySubjects.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Add Subject</button>
      </div>

      {mySubjects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <h3 style={{ fontFamily: 'Syne', margin: '0 0 8px' }}>No subjects yet</h3>
          <p style={{ color: 'var(--text2)', margin: '0 0 20px', fontSize: '14px' }}>Add your courses to get started</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Add First Subject</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {mySubjects.map(s => {
            const subjAssignments = myAssignments.filter(a => a.subjectId === s.id)
            const subjGrades = myGrades.filter(g => g.subjectId === s.id)
            const avg = subjGrades.length ? (subjGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjGrades.length) : null
            const pending = subjAssignments.filter(a => a.status !== 'done').length
            return (
              <div key={s.id} className="card animate-fadeUp" style={{ borderTop: `3px solid ${s.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontFamily: 'Syne', fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--text)' }}>{s.name}</h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setModal(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text2)', padding: '2px' }}>✏️</button>
                    <button onClick={() => { if (confirm(`Delete "${s.name}"? This removes all related data.`)) deleteSubject(s.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text2)', padding: '2px' }}>🗑</button>
                  </div>
                </div>
                {s.teacher && <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>👤 {s.teacher}</div>}
                {s.credits && <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>🎓 {s.credits} credits</div>}
                {s.description && <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px', lineHeight: '1.5' }}>{s.description}</div>}
                <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'Syne', color: 'var(--text)' }}>{subjAssignments.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>tasks</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'Syne', color: '#f5a524' }}>{pending}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>pending</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'Syne', color: avg !== null ? (avg >= 75 ? 'var(--accent3)' : avg >= 50 ? '#f5a524' : 'var(--accent2)') : 'var(--text2)' }}>
                      {avg !== null ? `${avg.toFixed(0)}%` : '—'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>avg grade</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <SubjectModal subject={modal === 'add' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
