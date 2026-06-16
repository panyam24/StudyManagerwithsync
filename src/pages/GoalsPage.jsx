import { useState } from 'react'
import { useAppStore, useAuthStore } from '../store'
import { format, parseISO, differenceInDays } from 'date-fns'

function GoalModal({ goal, onClose }) {
  const { addGoal, updateGoal } = useAppStore()
  const { currentUser } = useAuthStore()
  const [form, setForm] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    targetDate: goal?.targetDate || '',
    progress: goal?.progress ?? 0,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (goal) updateGoal(goal.id, { ...form, progress: Number(form.progress) })
    else addGoal({ ...form, progress: Number(form.progress) }, currentUser.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700', margin: '0 0 24px' }}>{goal ? 'Edit Goal' : 'New Goal'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Goal Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Achieve 90% in Mathematics" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does success look like?" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Target Date</label>
            <input type="date" value={form.targetDate} onChange={e => set('targetDate', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Progress: {form.progress}%</label>
            <input type="range" value={form.progress} onChange={e => set('progress', e.target.value)} min={0} max={100} step={5}
              style={{ appearance: 'none', height: '6px', borderRadius: '3px', background: `linear-gradient(to right, var(--accent) ${form.progress}%, var(--border) ${form.progress}%)`, border: 'none', padding: 0 }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{goal ? 'Save Changes' : 'Add Goal'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const { goals, deleteGoal, updateGoal } = useAppStore()
  const { currentUser } = useAuthStore()
  const uid = currentUser?.id
  const [modal, setModal] = useState(null)

  const myGoals = goals.filter(g => g.userId === uid).sort((a, b) => b.progress - a.progress)

  const completed = myGoals.filter(g => g.progress >= 100).length
  const inProgress = myGoals.filter(g => g.progress > 0 && g.progress < 100).length

  const quickProgress = (goal, delta) => {
    const newProg = Math.max(0, Math.min(100, goal.progress + delta))
    updateGoal(goal.id, { progress: newProg })
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>Goals</h1>
          <p style={{ color: 'var(--text2)', margin: 0, fontSize: '14px' }}>{completed} completed · {inProgress} in progress</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>+ New Goal</button>
      </div>

      {myGoals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
          <h3 style={{ fontFamily: 'Syne', margin: '0 0 8px' }}>Set your goals</h3>
          <p style={{ color: 'var(--text2)', margin: '0 0 20px', fontSize: '14px' }}>Define what you want to achieve this semester</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Add First Goal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {myGoals.map(g => {
            const daysLeft = g.targetDate ? differenceInDays(parseISO(g.targetDate), new Date()) : null
            const overdue = daysLeft !== null && daysLeft < 0 && g.progress < 100
            return (
              <div key={g.id} className="card animate-fadeUp" style={{ borderLeft: g.progress >= 100 ? '3px solid var(--accent3)' : '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: g.progress >= 100 ? 'rgba(52,216,162,0.15)' : 'rgba(124,106,247,0.15)', border: `2px solid ${g.progress >= 100 ? 'var(--accent3)' : 'var(--accent)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, flexDirection: 'column' }}>
                    {g.progress >= 100 ? (
                      <span style={{ fontSize: '18px' }}>✓</span>
                    ) : (
                      <span style={{ fontFamily: 'Syne', fontSize: '12px', fontWeight: '700', color: 'var(--accent)' }}>{g.progress}%</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', fontFamily: 'Syne', color: 'var(--text)', textDecoration: g.progress >= 100 ? 'line-through' : 'none', opacity: g.progress >= 100 ? 0.7 : 1 }}>{g.title}</span>
                      {g.progress >= 100 && <span className="tag" style={{ background: 'rgba(52,216,162,0.15)', color: 'var(--accent3)' }}>Done ✓</span>}
                    </div>
                    {g.description && <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '0 0 8px', lineHeight: '1.5' }}>{g.description}</p>}
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text2)', marginBottom: '10px', flexWrap: 'wrap' }}>
                      {g.targetDate && (
                        <span style={{ color: overdue ? 'var(--accent2)' : daysLeft === 0 ? '#f5a524' : 'var(--text2)' }}>
                          🗓 {format(parseISO(g.targetDate), 'MMM d, yyyy')} {daysLeft !== null && (overdue ? '— Overdue' : daysLeft === 0 ? '— Due today' : `— ${daysLeft} days left`)}
                        </span>
                      )}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${g.progress}%`, background: g.progress >= 100 ? 'var(--accent3)' : 'var(--accent)' }} />
                      </div>
                    </div>
                    {/* Quick progress */}
                    {g.progress < 100 && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Quick update:</span>
                        {[-10, -5, +5, +10, +25].map(delta => (
                          <button key={delta} onClick={() => quickProgress(g, delta)}
                            style={{ padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface2)', color: delta > 0 ? 'var(--accent3)' : 'var(--accent2)', cursor: 'pointer', fontSize: '12px', fontFamily: 'DM Sans', fontWeight: '500' }}>
                            {delta > 0 ? '+' : ''}{delta}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => setModal(g)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: 'var(--text2)' }}>✏️</button>
                    <button onClick={() => { if (confirm('Delete this goal?')) deleteGoal(g.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: 'var(--text2)' }}>🗑</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <GoalModal goal={modal === 'add' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
