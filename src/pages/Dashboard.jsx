import { useAppStore, useAuthStore, PRIORITY } from '../store'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

export default function Dashboard({ setActive }) {
  const { currentUser } = useAuthStore()
  const { subjects, assignments, timetable, grades, goals } = useAppStore()
  const uid = currentUser?.id

  const mySubjects = subjects.filter(s => s.userId === uid)
  const myAssignments = assignments.filter(a => a.userId === uid)
  const myTimetable = timetable.filter(t => t.userId === uid)
  const myGrades = grades.filter(g => g.userId === uid)
  const myGoals = goals.filter(g => g.userId === uid)

  // Upcoming assignments (next 7 days, not done)
  const upcoming = myAssignments
    .filter(a => a.status !== 'done' && a.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)

  // Today's timetable
  const dayName = format(new Date(), 'EEEE')
  const todaySlots = myTimetable
    .filter(t => t.day === dayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // GPA calc
  const gpa = myGrades.length
    ? (myGrades.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / myGrades.length).toFixed(1)
    : null

  const doneCount = myAssignments.filter(a => a.status === 'done').length
  const completionRate = myAssignments.length ? Math.round((doneCount / myAssignments.length) * 100) : 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const getSubject = id => mySubjects.find(s => s.id === id)

  const dueDateLabel = (d) => {
    const dt = parseISO(d)
    if (isPast(dt) && !isToday(dt)) return { label: 'Overdue', color: 'var(--accent2)' }
    if (isToday(dt)) return { label: 'Today', color: 'var(--accent)' }
    if (isTomorrow(dt)) return { label: 'Tomorrow', color: '#f5a524' }
    return { label: format(dt, 'MMM d'), color: 'var(--text2)' }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1100px' }}>
      {/* Header */}
      <div className="animate-fadeUp" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: '700', margin: '0 0 4px', color: 'var(--text)' }}>
          {greeting}, {currentUser?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text2)', margin: 0, fontSize: '15px' }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stat cards */}
      <div className="animate-fadeUp stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Subjects', value: mySubjects.length, icon: '📚', color: 'var(--accent)' },
          { label: 'Pending Tasks', value: myAssignments.filter(a => a.status !== 'done').length, icon: '📝', color: '#f5a524' },
          { label: 'Completion', value: `${completionRate}%`, icon: '✅', color: 'var(--accent3)' },
          { label: 'Avg. Score', value: gpa ? `${gpa}%` : '—', icon: '📊', color: '#60a5fa' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '20px' }}>{stat.icon}</span>
              <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
            </div>
            <div style={{ fontFamily: 'Syne', fontSize: '30px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Today's Schedule */}
        <div className="card animate-fadeUp stagger-2">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '600', margin: 0 }}>Today's Schedule</h2>
            <button onClick={() => setActive('timetable')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontFamily: 'DM Sans' }}>View all →</button>
          </div>
          {todaySlots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              No classes today!
            </div>
          ) : todaySlots.map(slot => {
            const subj = getSubject(slot.subjectId)
            return (
              <div key={slot.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'right', minWidth: '52px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{slot.startTime}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{slot.endTime}</div>
                </div>
                <div style={{ width: '3px', height: '36px', background: subj?.color || 'var(--accent)', borderRadius: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{subj?.name || 'Unknown'}</div>
                  {slot.room && <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Room {slot.room}</div>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Upcoming Assignments */}
        <div className="card animate-fadeUp stagger-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '600', margin: 0 }}>Upcoming Tasks</h2>
            <button onClick={() => setActive('assignments')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontFamily: 'DM Sans' }}>View all →</button>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌟</div>
              All caught up!
            </div>
          ) : upcoming.map(a => {
            const subj = getSubject(a.subjectId)
            const due = dueDateLabel(a.dueDate)
            return (
              <div key={a.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIORITY[a.priority]?.color || 'var(--text2)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{subj?.name}</div>
                </div>
                <span style={{ fontSize: '12px', color: due.color, fontWeight: '500', whiteSpace: 'nowrap' }}>{due.label}</span>
              </div>
            )
          })}
        </div>

        {/* Subjects overview */}
        <div className="card animate-fadeUp stagger-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '600', margin: 0 }}>Subjects</h2>
            <button onClick={() => setActive('subjects')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontFamily: 'DM Sans' }}>Manage →</button>
          </div>
          {mySubjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div>
              Add your first subject
            </div>
          ) : mySubjects.slice(0, 5).map(s => {
            const subjGrades = myGrades.filter(g => g.subjectId === s.id)
            const avg = subjGrades.length ? (subjGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjGrades.length) : null
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{s.name}</div>
                  {s.teacher && <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.teacher}</div>}
                </div>
                {avg !== null && <span style={{ fontSize: '13px', fontWeight: '600', color: avg >= 75 ? 'var(--accent3)' : avg >= 50 ? '#f5a524' : 'var(--accent2)' }}>{avg.toFixed(0)}%</span>}
              </div>
            )
          })}
        </div>

        {/* Goals */}
        <div className="card animate-fadeUp stagger-5">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: '16px', fontWeight: '600', margin: 0 }}>Goals</h2>
            <button onClick={() => setActive('goals')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontFamily: 'DM Sans' }}>View all →</button>
          </div>
          {myGoals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: '14px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
              Set your first goal
            </div>
          ) : myGoals.slice(0, 4).map(g => (
            <div key={g.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{g.title}</span>
                <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: '600' }}>{g.progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${g.progress}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
