import { useState } from 'react'
import { useAppStore, useAuthStore, DAYS } from '../store'

function SlotModal({ slot, subjects, onClose }) {
  const { addSlot, updateSlot } = useAppStore()
  const { currentUser } = useAuthStore()
  const [form, setForm] = useState({
    subjectId: slot?.subjectId || subjects[0]?.id || '',
    day: slot?.day || DAYS[0],
    startTime: slot?.startTime || '09:00',
    endTime: slot?.endTime || '10:00',
    room: slot?.room || '',
    notes: slot?.notes || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (slot) updateSlot(slot.id, form)
    else addSlot(form, currentUser.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700', margin: '0 0 24px' }}>{slot ? 'Edit Class' : 'Add Class'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Subject *</label>
            <select value={form.subjectId} onChange={e => set('subjectId', e.target.value)} required>
              <option value="">— Select subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Day *</label>
            <select value={form.day} onChange={e => set('day', e.target.value)}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Start Time *</label>
              <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>End Time *</label>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} required />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Room / Location</label>
            <input value={form.room} onChange={e => set('room', e.target.value)} placeholder="e.g. Room 101, Online" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Notes</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{slot ? 'Save Changes' : 'Add Class'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TimetablePage() {
  const { timetable, subjects, deleteSlot } = useAppStore()
  const { currentUser } = useAuthStore()
  const uid = currentUser?.id
  const [modal, setModal] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // grid | list

  const mySubjects = subjects.filter(s => s.userId === uid)
  const mySlots = timetable.filter(t => t.userId === uid)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const getSubject = id => mySubjects.find(s => s.id === id)

  // Get all unique hours for grid
  const hours = []
  for (let h = 7; h <= 21; h++) hours.push(`${String(h).padStart(2, '0')}:00`)

  const slotsForDay = (day) => mySlots.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div style={{ padding: '32px' }}>
      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>Timetable</h1>
          <p style={{ color: 'var(--text2)', margin: 0, fontSize: '14px' }}>{mySlots.length} class{mySlots.length !== 1 ? 'es' : ''} scheduled</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: '8px', padding: '3px' }}>
            {[['grid', '⊞'], ['list', '☰']].map(([m, icon]) => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '14px', transition: 'all 0.15s', background: viewMode === m ? 'var(--accent)' : 'transparent', color: viewMode === m ? 'white' : 'var(--text2)' }}>
                {icon}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setModal('add')}>+ Add Class</button>
        </div>
      </div>

      {mySlots.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗓</div>
          <h3 style={{ fontFamily: 'Syne', margin: '0 0 8px' }}>Timetable is empty</h3>
          <p style={{ color: 'var(--text2)', margin: '0 0 20px', fontSize: '14px' }}>Schedule your classes to see your week at a glance</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Add First Class</button>
        </div>
      ) : viewMode === 'list' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {DAYS.map(day => {
            const slots = slotsForDay(day)
            if (slots.length === 0) return null
            return (
              <div key={day} className="card" style={{ borderTop: `2px solid ${day === today ? 'var(--accent)' : 'var(--border)'}` }}>
                <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '600', margin: '0 0 12px', color: day === today ? 'var(--accent)' : 'var(--text)' }}>
                  {day} {day === today && <span style={{ fontSize: '12px', color: 'var(--accent)' }}>• Today</span>}
                </h3>
                {slots.map(slot => {
                  const subj = getSubject(slot.subjectId)
                  return (
                    <div key={slot.id} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                      <div style={{ width: '3px', height: '40px', background: subj?.color || 'var(--accent)', borderRadius: '2px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{subj?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{slot.startTime} — {slot.endTime}{slot.room ? ` · Room ${slot.room}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setModal(slot)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text2)' }}>✏️</button>
                        <button onClick={() => deleteSlot(slot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text2)' }}>🗑</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ) : (
        // Grid view
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minWidth: '800px', gap: '1px', background: 'var(--border)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {/* Header row */}
            <div style={{ background: 'var(--surface)', padding: '10px 8px' }} />
            {DAYS.map(d => (
              <div key={d} style={{ background: d === today ? 'rgba(124,106,247,0.15)' : 'var(--surface)', padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Syne', fontSize: '13px', fontWeight: '600', color: d === today ? 'var(--accent)' : 'var(--text)' }}>{d.slice(0, 3)}</div>
              </div>
            ))}
            {/* Hour rows */}
            {hours.map(hour => (
              <>
                <div key={`h-${hour}`} style={{ background: 'var(--surface)', padding: '8px 6px', textAlign: 'right', fontSize: '11px', color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{hour}</div>
                {DAYS.map(day => {
                  const slot = mySlots.find(s => s.day === day && s.startTime === hour)
                  const subj = slot ? getSubject(slot.subjectId) : null
                  return (
                    <div key={`${day}-${hour}`} style={{ background: day === today ? 'rgba(124,106,247,0.05)' : 'var(--surface)', padding: '2px', minHeight: '40px', position: 'relative' }}>
                      {slot && (
                        <div onClick={() => setModal(slot)} style={{ background: subj?.color ? `${subj.color}25` : 'rgba(124,106,247,0.2)', borderLeft: `3px solid ${subj?.color || 'var(--accent)'}`, borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', height: '100%', minHeight: '36px' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: subj?.color || 'var(--accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subj?.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text2)' }}>{slot.endTime}{slot.room ? ` · ${slot.room}` : ''}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {modal && <SlotModal slot={modal === 'add' ? null : modal} subjects={mySubjects} onClose={() => setModal(null)} />}
    </div>
  )
}
