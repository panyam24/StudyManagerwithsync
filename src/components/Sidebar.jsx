import { useAuthStore } from '../store'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   icon: '⊞' },
  { id: 'subjects',   label: 'Subjects',    icon: '📚' },
  { id: 'attendance', label: 'Attendance',  icon: '✅' },
  { id: 'assignments',label: 'Assignments', icon: '📝' },
  { id: 'timetable',  label: 'Timetable',   icon: '🗓' },
  { id: 'grades',     label: 'Grades',      icon: '📊' },
  { id: 'notes',      label: 'Notes',       icon: '🗒' },
  { id: 'goals',      label: 'Goals',       icon: '🎯' },
]

export default function Sidebar({ active, setActive }) {
  const { currentUser, logout } = useAuthStore()

  return (
    <aside style={{
      width: '220px', minWidth: '220px', height: '100vh', position: 'sticky', top: 0,
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '24px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', fontFamily: 'Syne', color: 'white', flexShrink: 0 }}>S</div>
        <span style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '800', color: 'var(--text)' }}>StudySync</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '14px', fontWeight: active === item.id ? '500' : '400', transition: 'all 0.15s', textAlign: 'left', width: '100%',
              background: active === item.id ? 'rgba(124,106,247,0.15)' : 'transparent',
              color: active === item.id ? 'var(--accent)' : 'var(--text2)',
            }}>
            <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
            {item.label}
            {active === item.id && <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }} />}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '10px', marginBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
            {currentUser?.avatar || currentUser?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.email}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '13px' }}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
