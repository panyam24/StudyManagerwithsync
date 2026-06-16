import { useState, useMemo } from 'react'
import { useAppStore, useAuthStore, PRIORITY, STATUS } from '../store'
import { format, parseISO, isPast, isToday } from 'date-fns'

function AssignmentModal({ assignment, subjects, onClose }) {
  const { addAssignment, updateAssignment } = useAppStore()
  const { currentUser } = useAuthStore()
  const [form, setForm] = useState({
    title: assignment?.title || '',
    subjectId: assignment?.subjectId || subjects[0]?.id || '',
    dueDate: assignment?.dueDate || '',
    dueTime: assignment?.dueTime || '',
    priority: assignment?.priority || 'medium',
    status: assignment?.status || 'pending',
    notes: assignment?.notes || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (assignment) updateAssignment(assignment.id, form)
    else addAssignment(form, currentUser.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700', margin: '0 0 24px' }}>{assignment ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Chapter 5 Problem Set" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Subject</label>
            <select value={form.subjectId} onChange={e => set('subjectId', e.target.value)}>
              <option value="">— No subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Due Time</label>
              <input type="time" value={form.dueTime} onChange={e => set('dueTime', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional details…" rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{assignment ? 'Save Changes' : 'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_COLORS = { pending: '#f5a524', in_progress: 'var(--accent)', done: 'var(--accent3)', overdue: 'var(--accent2)' }

export default function AssignmentsPage() {
  const { assignments, subjects, updateAssignment, deleteAssignment } = useAppStore()
  const { currentUser } = useAuthStore()
  const uid = currentUser?.id
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('all') // all | pending | done | overdue
  const [sort, setSort] = useState('dueDate')

  const mySubjects = subjects.filter(s => s.userId === uid)
  const myAssignments = useMemo(() => {
    let list = assignments.filter(a => a.userId === uid)
    if (filter === 'pending') list = list.filter(a => a.status === 'pending' || a.status === 'in_progress')
    else if (filter === 'done') list = list.filter(a => a.status === 'done')
    else if (filter === 'overdue') list = list.filter(a => a.dueDate && isPast(parseISO(a.dueDate)) && !isToday(parseISO(a.dueDate)) && a.status !== 'done')
    if (sort === 'dueDate') list = [...list].sort((a, b) => (a.dueDate || 'z') > (b.dueDate || 'z') ? 1 : -1)
    else if (sort === 'priority') {
      const p = { high: 0, medium: 1, low: 2 }
      list = [...list].sort((a, b) => (p[a.priority] ?? 1) - (p[b.priority] ?? 1))
    }
    return list
  }, [assignments, uid, filter, sort])

  const getSubject = id => mySubjects.find(s => s.id === id)

  const toggleDone = (a) => {
    updateAssignment(a.id, { status: a.status === 'done' ? 'pending' : 'done' })
  }

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>Assignments</h1>
          <p style={{ color: 'var(--text2)', margin: 0, fontSize: '14px' }}>{assignments.filter(a => a.userId === uid && a.status !== 'done').length} tasks remaining</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>+ New Task</button>
      </div>

      {/* Filters */}
      <div className="animate-fadeUp stagger-1" style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[['all', 'All'], ['pending', 'In Progress'], ['done', 'Done'], ['overdue', 'Overdue']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', fontWeight: '500', transition: 'all 0.15s', borderColor: filter === k ? 'var(--accent)' : 'var(--border)', background: filter === k ? 'rgba(124,106,247,0.15)' : 'transparent', color: filter === k ? 'var(--accent)' : 'var(--text2)' }}>
            {l}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Sort:</span>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto', padding: '6px 10px' }}>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {myAssignments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
          <h3 style={{ fontFamily: 'Syne', margin: '0 0 8px' }}>No tasks here</h3>
          <p style={{ color: 'var(--text2)', margin: '0 0 20px', fontSize: '14px' }}>Create your first assignment to stay on track</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Add Task</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {myAssignments.map(a => {
            const subj = getSubject(a.subjectId)
            const overdue = a.dueDate && isPast(parseISO(a.dueDate)) && !isToday(parseISO(a.dueDate)) && a.status !== 'done'
            return (
              <div key={a.id} className="card animate-fadeUp" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px', opacity: a.status === 'done' ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                {/* Checkbox */}
                <button onClick={() => toggleDone(a)}
                  style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${a.status === 'done' ? 'var(--accent3)' : 'var(--border)'}`, background: a.status === 'done' ? 'var(--accent3)' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                  {a.status === 'done' && <span style={{ color: 'white', fontSize: '11px' }}>✓</span>}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '500', textDecoration: a.status === 'done' ? 'line-through' : 'none', color: 'var(--text)' }}>{a.title}</span>
                    <span className="tag" style={{ background: `${PRIORITY[a.priority]?.color}20`, color: PRIORITY[a.priority]?.color, border: `1px solid ${PRIORITY[a.priority]?.color}40` }}>
                      {PRIORITY[a.priority]?.label}
                    </span>
                    <span className="tag" style={{ background: `${STATUS_COLORS[a.status]}15`, color: STATUS_COLORS[a.status], border: `1px solid ${STATUS_COLORS[a.status]}40` }}>
                      {STATUS[a.status]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text2)', flexWrap: 'wrap' }}>
                    {subj && <span style={{ color: subj.color }}>● {subj.name}</span>}
                    {a.dueDate && <span style={{ color: overdue ? 'var(--accent2)' : 'var(--text2)' }}>📅 {format(parseISO(a.dueDate), 'MMM d, yyyy')}{a.dueTime ? ` at ${a.dueTime}` : ''}{overdue ? ' — Overdue' : ''}</span>}
                  </div>
                  {a.notes && <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px', fontStyle: 'italic' }}>{a.notes}</div>}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => setModal(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: 'var(--text2)', padding: '4px' }}>✏️</button>
                  <button onClick={() => { if (confirm('Delete this task?')) deleteAssignment(a.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', color: 'var(--text2)', padding: '4px' }}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <AssignmentModal assignment={modal === 'add' ? null : modal} subjects={mySubjects} onClose={() => setModal(null)} />}
    </div>
  )
}
