# StudySync

Your all-in-one academic planner — deadlines, timetables, grades, notes, goals, and attendance tracking.
https://studymanager-21a9.onrender.com

### Auth System
- **Password hashing** — passwords stored as hashed values, not plaintext
- **Show/hide password** toggle on all password fields
- **Password strength indicator** on registration
- **Confirm password** field to prevent typos
- **Forgot password** flow with token-based reset (simulated — in production, wire this to an email service)
- Input validation and clear error messages

###  Attendance Tracking (new page)
- Mark attendance per subject as **Present**, **Absent**, or **Late**
- One record per subject per day — re-marking updates the existing entry
- **Date range filtering**: This Week, This Month, Last Month, Last 3 Months, All Time, Custom range
- **Overview tab**: per-subject attendance cards with donut rings, progress bars, mini breakdown stats, and ⚠ warnings when below 75%
- **Calendar tab**: month-by-month visual calendar per subject, colour-coded by status
- **Log tab**: chronological list of all records with delete option
- Overall summary stats at the top (total present/late/absent, overall %)

## Tech Stack

- React 18 + Vite
- Zustand (with `persist` middleware — stored in `localStorage`)
- Tailwind CSS + custom CSS variables (dark theme)
- date-fns for date utilities
- No backend — all data is stored locally in the browser

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
├── App.jsx                   # Root — routing between pages
├── main.jsx                  # React entry point
├── index.css                 # Global styles + CSS variables
├── store/
│   └── index.js              # Zustand stores (auth + app data)
├── components/
│   └── Sidebar.jsx           # Navigation sidebar
└── pages/
    ├── AuthPage.jsx          # Login / Register / Forgot password
    ├── AttendancePage.jsx    # Attendance tracking (new)
    ├── Dashboard.jsx         # Home overview
    ├── SubjectsPage.jsx      # Subject management
    ├── AssignmentsPage.jsx   # Assignments & deadlines
    ├── TimetablePage.jsx     # Weekly timetable
    ├── GradesPage.jsx        # Grade tracking
    ├── NotesPage.jsx         # Notes per subject
    └── GoalsPage.jsx         # Goals & progress
```

## Attendance: How It Works

1. Add your subjects in the **Subjects** page first
2. Go to **Attendance** and click **+ Mark Attendance**
3. Select a subject, pick a date, add an optional note, then click Present / Late / Absent
4. Use the period filter to view stats for any time window
5. Switch to **Calendar** view to see a month grid for a single subject
6. Switch to **Log** to see every entry and delete any mistakes

## Notes on Auth

Passwords are hashed with a simple deterministic hash before storage. For a production app, replace this with:
- Server-side bcrypt/argon2 hashing
- JWT sessions stored in httpOnly cookies
- A real email service for password resets (e.g. SendGrid, Resend)

The reset flow currently shows the token on screen (simulated). Replace `requestPasswordReset` in `store/index.js` with an API call that emails the token.
