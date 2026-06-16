import { useState } from 'react'
import { useAppStore, useAuthStore } from '../store'
import { format, parseISO } from 'date-fns'

function NoteModal({ note, subjects, onClose }) {
  const { addNote, updateNote } = useAppStore()
  const { currentUser } = useAuthStore()
  const [form, setForm] = useState({
    title: note?.title || '',
    subjectId: note?.subjectId || '',
    content: note?.content || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (note) updateNote(note.id, form)
    else addNote(form, currentUser.id)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '600px' }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: '20px', fontWeight: '700', margin: '0 0 24px' }}>{note ? 'Edit Note' : 'New Note'}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Note title…" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Subject</label>
            <select value={form.subjectId} onChange={e => set('subjectId', e.target.value)}>
              <option value="">— No subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>Content</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Write your notes here…" rows={10} style={{ resize: 'vertical', fontFamily: 'DM Sans', lineHeight: '1.6' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{note ? 'Save Changes' : 'Save Note'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NoteView({ note, subjects, onEdit, onDelete, onClose }) {
  const subj = subjects.find(s => s.id === note.subjectId)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: '700', margin: 0, flex: 1 }}>{note.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text2)', marginLeft: '12px', padding: '2px' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {subj && <span className="tag" style={{ background: `${subj.color}20`, color: subj.color }}>● {subj.name}</span>}
          <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Updated {format(parseISO(note.updatedAt), 'MMM d, yyyy')}</span>
        </div>
        <div style={{ fontSize: '15px', color: 'var(--text)', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', background: 'var(--surface2)', borderRadius: '8px', padding: '16px' }}>
          {note.content || <em style={{ color: 'var(--text2)' }}>No content</em>}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn-danger" onClick={onDelete}>🗑 Delete</button>
          <button className="btn-secondary" onClick={onEdit}>✏️ Edit</button>
        </div>
      </div>
    </div>
  )
}

export default function NotesPage() {
  const { notes, subjects, deleteNote } = useAppStore()
  const { currentUser } = useAuthStore()
  const uid = currentUser?.id
  const [modal, setModal] = useState(null)   // null | 'add' | note (for editing)
  const [viewing, setViewing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')

  const mySubjects = subjects.filter(s => s.userId === uid)
  const myNotes = notes
    .filter(n => n.userId === uid)
    .filter(n => filterSubject === 'all' || n.subjectId === filterSubject)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.updatedAt > a.updatedAt ? 1 : -1)

  const getSubject = id => mySubjects.find(s => s.id === id)

  return (
    <div style={{ padding: '32px', maxWidth: '1000px' }}>
      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '26px', fontWeight: '700', margin: '0 0 4px' }}>Notes</h1>
          <p style={{ color: 'var(--text2)', margin: 0, fontSize: '14px' }}>{myNotes.length} note{myNotes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>+ New Note</button>
      </div>

      {/* Search & filter */}
      <div className="animate-fadeUp stagger-1" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…" style={{ maxWidth: '240px' }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilterSubject('all')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', borderColor: filterSubject === 'all' ? 'var(--accent)' : 'var(--border)', background: filterSubject === 'all' ? 'rgba(124,106,247,0.15)' : 'transparent', color: filterSubject === 'all' ? 'var(--accent)' : 'var(--text2)' }}>
            All
          </button>
          {mySubjects.map(s => (
            <button key={s.id} onClick={() => setFilterSubject(s.id)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '13px', borderColor: filterSubject === s.id ? s.color : 'var(--border)', background: filterSubject === s.id ? `${s.color}20` : 'transparent', color: filterSubject === s.id ? s.color : 'var(--text2)' }}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {myNotes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗒</div>
          <h3 style={{ fontFamily: 'Syne', margin: '0 0 8px' }}>No notes yet</h3>
          <p style={{ color: 'var(--text2)', margin: '0 0 20px', fontSize: '14px' }}>Capture your class notes and study material</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Write First Note</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {myNotes.map(n => {
            const subj = getSubject(n.subjectId)
            return (
              <div key={n.id} className="card animate-fadeUp" onClick={() => setViewing(n)}
                style={{ cursor: 'pointer', transition: 'all 0.2s', borderLeft: subj ? `3px solid ${subj.color}` : '3px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontFamily: 'Syne', fontSize: '15px', fontWeight: '600', margin: 0, color: 'var(--text)', flex: 1 }}>{n.title}</h3>
                  <button onClick={e => { e.stopPropagation(); setModal(n) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text2)', marginLeft: '8px' }}>✏️</button>
                </div>
                {subj && <span className="tag" style={{ background: `${subj.color}15`, color: subj.color, marginBottom: '8px', display: 'inline-flex' }}>● {subj.name}</span>}
                <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '0 0 10px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {n.content || <em>No content</em>}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{format(parseISO(n.updatedAt), 'MMM d, yyyy')}</div>
              </div>
            )
          })}
        </div>
      )}

      {modal && <NoteModal note={modal === 'add' ? null : modal} subjects={mySubjects} onClose={() => setModal(null)} />}
      {viewing && (
        <NoteView note={viewing} subjects={mySubjects}
          onClose={() => setViewing(null)}
          onEdit={() => { setModal(viewing); setViewing(null) }}
          onDelete={() => { if (confirm('Delete this note?')) { deleteNote(viewing.id); setViewing(null) } }} />
      )}
    </div>
  )
}
