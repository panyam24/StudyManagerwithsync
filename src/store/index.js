import { create } from 'zustand'

// ── API base ──────────────────────────────────────────────────────────────
// Configure via VITE_API_URL env var; defaults to localhost:8080 for local
// dev against the C++ backend (studymanager_server).
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const TOKEN_KEY = 'studysync-token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    return { ok: false, error: 'Could not reach server' }
  }

  let data = null
  try { data = await res.json() } catch { /* empty body */ }

  if (!res.ok) {
    const error = (data && data.error) || `Request failed (${res.status})`
    return { ok: false, error, status: res.status }
  }
  return data ?? { ok: true }
}

// ── Auth store ──────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  currentUser: null,
  initialized: false,

  // Call once on app startup to restore session from stored token.
  init: async () => {
    if (get().initialized) return
    const token = getToken()
    if (!token) { set({ initialized: true }); return }
    const res = await api('/auth/me')
    if (res.ok) set({ currentUser: res.user, initialized: true })
    else { setToken(null); set({ currentUser: null, initialized: true }) }
  },

  register: async (name, email, password) => {
    const res = await api('/auth/register', { method: 'POST', body: { name, email, password } })
    if (!res.ok) return { ok: false, error: res.error }
    setToken(res.token)
    set({ currentUser: res.user })
    return { ok: true }
  },

  login: async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } })
    if (!res.ok) return { ok: false, error: res.error }
    setToken(res.token)
    set({ currentUser: res.user })
    return { ok: true }
  },

  logout: async () => {
    await api('/auth/logout', { method: 'POST' })
    setToken(null)
    set({ currentUser: null })
  },

  updateProfile: async (updates) => {
    const res = await api('/auth/profile', { method: 'PUT', body: updates })
    if (!res.ok) return { ok: false, error: res.error }
    set({ currentUser: res.user })
    return { ok: true }
  },

  requestPasswordReset: async (email) => {
    const res = await api('/auth/request-reset', { method: 'POST', body: { email } })
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true, token: res.token }
  },

  resetPassword: async (email, token, newPassword) => {
    const res = await api('/auth/reset', { method: 'POST', body: { email, token, newPassword } })
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true }
  },
}))

// ── App store ───────────────────────────────────────────────────────────────
const initialData = () => ({
  subjects: [],
  assignments: [],
  timetable: [],
  grades: [],
  notes: [],
  goals: [],
  attendance: [],
  loaded: false,
})

const RESOURCES = ['subjects', 'assignments', 'timetable', 'grades', 'notes', 'goals', 'attendance']

export const useAppStore = create((set, get) => ({
  ...initialData(),

  // Fetch all collections from the backend. Call after login / on app load.
  loadAll: async () => {
    const results = await Promise.all(RESOURCES.map(r => api(`/${r}`)))
    const next = {}
    RESOURCES.forEach((r, i) => {
      next[r] = results[i].ok ? (results[i][r] || []) : []
    })
    next.loaded = true
    set(next)
  },

  clear: () => set({ ...initialData() }),

  forUser: (list, userId) => list.filter(i => i.userId === userId),

  // ── Subjects ──
  addSubject: async (data, userId) => {
    const res = await api('/subjects', { method: 'POST', body: data })
    if (res.ok) set(st => ({ subjects: [...st.subjects, res.item] }))
    return res.ok ? res.item : null
  },
  updateSubject: async (id, data) => {
    const res = await api(`/subjects/${id}`, { method: 'PUT', body: data })
    if (res.ok) set(st => ({ subjects: st.subjects.map(s => s.id === id ? res.item : s) }))
  },
  deleteSubject: async (id) => {
    const res = await api(`/subjects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      set(st => ({
        subjects: st.subjects.filter(s => s.id !== id),
        assignments: st.assignments.filter(a => a.subjectId !== id),
        timetable: st.timetable.filter(t => t.subjectId !== id),
        grades: st.grades.filter(g => g.subjectId !== id),
        notes: st.notes.filter(n => n.subjectId !== id),
        attendance: st.attendance.filter(a => a.subjectId !== id),
      }))
    }
  },

  // ── Assignments ──
  addAssignment: async (data, userId) => {
    const res = await api('/assignments', { method: 'POST', body: data })
    if (res.ok) set(st => ({ assignments: [...st.assignments, res.item] }))
    return res.ok ? res.item : null
  },
  updateAssignment: async (id, data) => {
    const res = await api(`/assignments/${id}`, { method: 'PUT', body: data })
    if (res.ok) set(st => ({ assignments: st.assignments.map(a => a.id === id ? res.item : a) }))
  },
  deleteAssignment: async (id) => {
    const res = await api(`/assignments/${id}`, { method: 'DELETE' })
    if (res.ok) set(st => ({ assignments: st.assignments.filter(a => a.id !== id) }))
  },

  // ── Timetable ──
  addSlot: async (data, userId) => {
    const res = await api('/timetable', { method: 'POST', body: data })
    if (res.ok) set(st => ({ timetable: [...st.timetable, res.item] }))
    return res.ok ? res.item : null
  },
  updateSlot: async (id, data) => {
    const res = await api(`/timetable/${id}`, { method: 'PUT', body: data })
    if (res.ok) set(st => ({ timetable: st.timetable.map(s => s.id === id ? res.item : s) }))
  },
  deleteSlot: async (id) => {
    const res = await api(`/timetable/${id}`, { method: 'DELETE' })
    if (res.ok) set(st => ({ timetable: st.timetable.filter(s => s.id !== id) }))
  },

  // ── Grades ──
  addGrade: async (data, userId) => {
    const res = await api('/grades', { method: 'POST', body: data })
    if (res.ok) set(st => ({ grades: [...st.grades, res.item] }))
    return res.ok ? res.item : null
  },
  updateGrade: async (id, data) => {
    const res = await api(`/grades/${id}`, { method: 'PUT', body: data })
    if (res.ok) set(st => ({ grades: st.grades.map(g => g.id === id ? res.item : g) }))
  },
  deleteGrade: async (id) => {
    const res = await api(`/grades/${id}`, { method: 'DELETE' })
    if (res.ok) set(st => ({ grades: st.grades.filter(g => g.id !== id) }))
  },

  // ── Notes ──
  addNote: async (data, userId) => {
    const res = await api('/notes', { method: 'POST', body: data })
    if (res.ok) set(st => ({ notes: [...st.notes, res.item] }))
    return res.ok ? res.item : null
  },
  updateNote: async (id, data) => {
    const res = await api(`/notes/${id}`, { method: 'PUT', body: data })
    if (res.ok) set(st => ({ notes: st.notes.map(n => n.id === id ? res.item : n) }))
  },
  deleteNote: async (id) => {
    const res = await api(`/notes/${id}`, { method: 'DELETE' })
    if (res.ok) set(st => ({ notes: st.notes.filter(n => n.id !== id) }))
  },

  // ── Goals ──
  addGoal: async (data, userId) => {
    const res = await api('/goals', { method: 'POST', body: data })
    if (res.ok) set(st => ({ goals: [...st.goals, res.item] }))
    return res.ok ? res.item : null
  },
  updateGoal: async (id, data) => {
    const res = await api(`/goals/${id}`, { method: 'PUT', body: data })
    if (res.ok) set(st => ({ goals: st.goals.map(g => g.id === id ? res.item : g) }))
  },
  deleteGoal: async (id) => {
    const res = await api(`/goals/${id}`, { method: 'DELETE' })
    if (res.ok) set(st => ({ goals: st.goals.filter(g => g.id !== id) }))
  },

  // ── Attendance ──
  markAttendance: async (data, userId) => {
    const res = await api('/attendance', { method: 'POST', body: data })
    if (res.ok) {
      set(st => {
        const exists = st.attendance.some(a => a.id === res.item.id)
        return {
          attendance: exists
            ? st.attendance.map(a => a.id === res.item.id ? res.item : a)
            : [...st.attendance, res.item]
        }
      })
    }
  },
  deleteAttendance: async (id) => {
    const res = await api(`/attendance/${id}`, { method: 'DELETE' })
    if (res.ok) set(st => ({ attendance: st.attendance.filter(a => a.id !== id) }))
  },

  getAttendanceRecord: (userId, subjectId, date) => {
    return get().attendance.find(
      a => a.userId === userId && a.subjectId === subjectId && a.date === date
    )
  },
}))

// ── Constants ───────────────────────────────────────────────────────────────
export const SUBJECT_COLORS = [
  '#7c6af7', '#f97066', '#34d8a2', '#f5a524', '#60a5fa',
  '#e879f9', '#fb923c', '#a3e635', '#22d3ee', '#f472b6',
]

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const PRIORITY = { high: { label: 'High', color: '#f97066' }, medium: { label: 'Medium', color: '#f5a524' }, low: { label: 'Low', color: '#34d8a2' } }
export const STATUS = { pending: 'Pending', in_progress: 'In Progress', done: 'Done', overdue: 'Overdue' }
export const GRADE_TYPES = ['Assignment', 'Quiz', 'Midterm', 'Final', 'Project', 'Lab', 'Other']
export const ATTENDANCE_STATUS = {
  present: { label: 'Present', color: '#34d8a2', icon: '✓' },
  absent:  { label: 'Absent',  color: '#f97066', icon: '✗' },
  late:    { label: 'Late',    color: '#f5a524', icon: '⏰' },
}
