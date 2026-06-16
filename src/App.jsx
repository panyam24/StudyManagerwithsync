import { useState, useEffect } from 'react'
import { useAuthStore, useAppStore } from './store'
import AuthPage from './pages/AuthPage'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import SubjectsPage from './pages/SubjectsPage'
import AssignmentsPage from './pages/AssignmentsPage'
import TimetablePage from './pages/TimetablePage'
import GradesPage from './pages/GradesPage'
import NotesPage from './pages/NotesPage'
import GoalsPage from './pages/GoalsPage'
import AttendancePage from './pages/AttendancePage'

const PAGES = {
  dashboard:  Dashboard,
  subjects:   SubjectsPage,
  attendance: AttendancePage,
  assignments: AssignmentsPage,
  timetable:  TimetablePage,
  grades:     GradesPage,
  notes:      NotesPage,
  goals:      GoalsPage,
}

export default function App() {
  const { currentUser, initialized, init } = useAuthStore()
  const { loadAll, clear, loaded } = useAppStore()
  const [active, setActive] = useState('dashboard')

  // Restore session from stored token on first load.
  useEffect(() => { init() }, [])

  // Once we know who's logged in, fetch their data from the backend.
  useEffect(() => {
    if (currentUser) loadAll()
    else clear()
  }, [currentUser?.id])

  if (!initialized) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading…
      </div>
    )
  }

  if (!currentUser) return <AuthPage />

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading your data…
      </div>
    )
  }

  const Page = PAGES[active] || Dashboard

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={active} setActive={setActive} />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <Page setActive={setActive} />
      </main>
    </div>
  )
}
