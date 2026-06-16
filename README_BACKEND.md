# StudyManager — C++ Backend Edition

Same React frontend, all 9 features intact (Dashboard, Subjects, Assignments,
Timetable, Grades, Notes, Goals, Attendance, Auth). Data storage moved from
browser localStorage to a **C++ REST API** that persists data as JSON files
inside a **git repository folder** — sync across devices via `git pull`/`push`.

## Backend (`/backend`)

Pure C++17, zero external dependencies (custom minimal JSON + HTTP server).

```bash
cd backend
make
DATA_DIR=./data PORT=8080 ./studymanager_server
```

- `DATA_DIR` — path to the git-repo folder where data is stored (default `./data`).
  On first run it's `git init`'d automatically. Every write does
  `git add -A && git commit`.
- For cross-device sync: point `DATA_DIR` at a clone of a shared git remote
  (GitHub/GitLab/your own server), and run `git pull` before starting / `git push`
  periodically (e.g. via cron) on each device.

Data layout:
```
data/
  users.json              # accounts (salted SHA-256 password hashes)
  <userId>/
    subjects.json
    assignments.json
    timetable.json
    grades.json
    notes.json
    goals.json
    attendance.json
```

## Frontend

```bash
npm install
VITE_API_URL=http://localhost:8080 npm run dev
```

`src/store/index.js` now talks to the backend via `fetch` instead of zustand's
`persist`/localStorage middleware. Auth uses a bearer token stored in
localStorage (`studysync-token`); all data state is fetched on login via
`loadAll()`.

## API summary

- `POST /api/auth/register|login|logout`, `GET /api/auth/me`,
  `PUT /api/auth/profile`, `POST /api/auth/request-reset|reset`
- `GET/POST /api/<resource>`, `PUT/DELETE /api/<resource>/:id`
  for `subjects, assignments, timetable, grades, notes, goals, attendance`
- Deleting a subject cascades to dependent records (same as before).
- Attendance POST upserts by `(subjectId, date)`.
