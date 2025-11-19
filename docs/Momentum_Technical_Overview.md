## 1. Project Overview

### Purpose
Momentum is a SaaS productivity web app that unifies time tracking, habit building, expense logging, and analytics into a single, responsive experience. It helps individuals and solopreneurs understand where their time and money go, build consistent habits, and make data‑driven improvements.

### How it works (end-to-end)
- Users authenticate via Firebase Auth (Google or Email/Password) in the frontend (Next.js App Router).
- The frontend exchanges the Firebase ID token with the backend to create/get a user record and receive a short‑lived backend JWT.
- Subsequent API requests include that backend JWT in the `Authorization` header.
- Data is persisted via Firebase (Firestore) collections managed by the backend. Analytics endpoints aggregate user data for dashboards.

### Problem & Users
- Problem: productivity signals are fragmented across different apps; Momentum centralizes tracking and provides actionable insights.
- Primary users: individuals, freelancers, and students who want a lightweight system to track time, habits, and expenses with minimal setup.

---

## 2. Architecture

### Frontend ↔ Backend flow
- Client gets Firebase ID token after login.
- Client calls `POST /api/auth/login` with the Firebase ID token.
- Backend verifies the Firebase token via Admin SDK, creates/loads a user, and returns a backend JWT.
- Client stores the backend JWT in memory (via API client) and uses it for all protected endpoints.

### High-level diagram (deployed)
```
[Browser]
   |   Next.js (App Router, React, Tailwind, shadcn/ui)
   v
[Frontend (Vercel)]  -- HTTPS -->  [Backend]
                              |    - Express (TypeScript)
                              |    - Firebase Admin (Auth)
                              |    - Firestore (Data)
                              v
                        [Firebase / Firestore]
```

Notes:
- The repo supports two deployment modes:
  - Traditional: Frontend on Vercel, Backend on Render/Heroku.
  - Unified (serverless): Both frontend and backend on Vercel via `vercel.json`, with backend exposed as serverless functions under `/api/*`.

### API and data flow
- Authentication: `POST /api/auth/login` accepts Firebase ID token, returns backend JWT and user profile.
- Modules (Time, Habits, Expenses) expose CRUD and reporting endpoints that accept the backend JWT.
- Analytics endpoints read user-scoped data and respond with aggregated metrics for dashboard/analytics UI components.

---

## 3. Frontend Implementation (Next.js)

### Stack & organization
- Next.js 14 (App Router), TypeScript
- Styling: TailwindCSS + shadcn/ui
- State management: React Context (`AuthContext`) for auth/session; local component state for page UIs
- Key paths:
  - `src/app/` — routes/pages (e.g., `/`, `/time`, `/habits`, `/expenses`, `/analytics`, `/profile`, `/landing`, `/auth`)
  - `src/components/` — feature components (e.g., `dashboard/`)
  - `src/contexts/AuthContext.tsx` — Firebase auth listener, backend login exchange, JWT handling
  - `src/lib/api.ts` — API client with base URL detection and typed calls
  - `src/lib/firebase.ts` — Firebase Web SDK initialization

### Data fetching & API integration
- `AuthContext` listens to Firebase auth state, retrieves the Firebase ID token, calls backend login, and stores the returned backend JWT via `apiClient.setToken(...)`.
- `apiClient` centralizes HTTP calls, sets `Authorization: Bearer <jwt>` header, and adapts base URL (env or Vercel relative `/api`).
- Pages/components fetch module data (time entries, habits, expenses, analytics) via `apiClient` methods and render dashboards with loading states.

### Core pages (examples)
- Onboarding: handled implicitly via user fields (e.g., `onboardingCompleted`) and initial setup flows in dashboard/landing.
- Dashboard (`src/components/dashboard/Dashboard.tsx` + `/`): renders a daily snapshot and quick navigation; guarded by `AuthContext`.
- Time (`src/app/time/page.tsx`): start/stop timer, manual entries, list of entries.
- Habits (`src/app/habits/page.tsx`): create/update/delete habits, mark complete, view logs and streaks.
- Expenses (`src/app/expenses/page.tsx`): log expenses, edit/delete, view summary.
- Analytics (`src/app/analytics/page.tsx`): weekly reports and insights components.
- Profile (`src/app/profile/page.tsx`): update profile and preferences.

### Design system
- TailwindCSS utility classes throughout.
- shadcn/ui primitives for consistent buttons, inputs, modals.
- Recharts (per README) for analytics visualization components.

---

## 4. Backend Implementation (Node.js + Express)

### Stack & structure
- Express (TypeScript)
- Routes: `backend/src/routes/*` (auth, user, time, habit, expense, analytics)
- Controllers: `backend/src/controllers/*` per module
- Middleware: `backend/src/middleware/*` (auth/JWT, async handler, errors, 404)
- Models (data layer): `backend/src/models/*` interacting with Firestore via `services/firebase-db`

### Notable middleware
- Security: Helmet, CORS, rate limiting (env-driven window and max)
- Auth: Verifies backend JWT (`Authorization: Bearer ...`) and attaches `req.user`
- Error handling: centralized error and 404 handlers

### REST endpoints (high-level)
- Auth:
  - `POST /api/auth/login` — Verify Firebase token, create/load user, return backend JWT + profile
  - `GET /api/auth/profile` — Get current user profile (JWT required)
- User:
  - `PUT /api/user/profile` — Update profile
  - `DELETE /api/user/account` — Delete account
- Time:
  - `GET /api/time/entries`, `POST /api/time/start`, `POST /api/time/stop`, `POST /api/time/manual`, `GET /api/time/active`, update/delete by id
- Habits:
  - `GET /api/habits`, `POST /api/habits`, `PUT /api/habits/:id`, `DELETE /api/habits/:id`, `POST /api/habits/:id/complete`, `GET /api/habits/:id/logs`
- Expenses:
  - `GET /api/expenses`, `POST /api/expenses`, `PUT /api/expenses/:id`, `DELETE /api/expenses/:id`, `GET /api/expenses/summary`
- Analytics:
  - `GET /api/analytics/dashboard`, `GET /api/analytics/weekly`, `GET /api/analytics/insights`

---

## 5. Data Layer & Database Design

### What’s actually used
- The MVP currently uses Firebase Firestore via a thin data layer in `backend/src/services/firebase-db` and model classes in `backend/src/models/*.ts` (e.g., `User`, `Habit`, `TimeEntry`, `Expense`).
- Although the README and deployment docs include MongoDB/Mongoose options, the live model code uses Firestore collections (e.g., `usersCollection`, `habitsCollection`, `habitLogsCollection`, `expensesCollection`).

### Schemas (conceptual)
- User:
  - `id`, `firebaseUid`, `email`, `name`, `profilePicture`, `timeCategories[]`, `weeklyBudget?`, `income?`, `onboardingCompleted`, `createdAt`, `updatedAt`.
- Habit:
  - `id`, `userId`, `name`, `description?`, `frequency ('daily'|'weekly')`, `targetCount`, `currentStreak`, `longestStreak`, `isActive`, timestamps.
  - HabitLog:
    - `id`, `habitId`, `userId`, `date`, `count`, timestamps.
- TimeEntry:
  - `id`, `userId`, `category`, `note?`, `start`, `end?`, `durationMs`, timestamps.
- Expense:
  - `id`, `userId`, `amount`, `currency?`, `category`, `description`, `date`, `tags?`, timestamps.

### Relationships & queries
- All records are explicitly scoped by `userId`.
- Typical patterns:
  - Read lists by `userId` with date/category filters.
  - Aggregate per week/month for analytics (on read).
  - Habit logs stored in separate collection keyed by `habitId` and `userId`.

---

## 6. Authentication & Authorization

### Firebase Auth (frontend)
- Web SDK initialized in `frontend/src/lib/firebase.ts`.
- `AuthContext` subscribes to `onAuthStateChanged`, retrieves Firebase ID token, calls backend login.

### Backend verification & JWT
- `POST /api/auth/login`: verify Firebase ID token via Admin SDK, create or fetch user record, then issue backend JWT.
- Protected routes use middleware to verify backend JWT and resolve `req.user`.

### Protected routes
- Frontend: pages/components read `AuthContext` to gate rendering/redirect to `/landing` or `/auth`.
- Backend: route-level `authenticate` middleware is applied in each router before handlers.

---

## 7. Deployment Setup

### Frontend (Vercel)
- Deployed as a Next.js app.
- Environment variables include Firebase public config (e.g., `NEXT_PUBLIC_FIREBASE_*`).
- `vercel.json` can route `/api/*` to backend serverless when using unified deployment.

### Backend (Render/Heroku or Vercel serverless)
- Traditional: Deploy Express on Render/Heroku with env vars for Firebase Admin and rate limiting; `FRONTEND_URL` used for CORS.
- Unified (optional): `backend/api/index.ts` wraps Express as Vercel serverless functions; `vercel.json` routes `/api/*` to it.

### Env & security
- Sensitive keys solely via environment variables (Firebase Admin private key, JWT secret, rate limit config).
- CORS restricted to frontend origin in production; HTTPS by default via host platforms.

---

## 8. Monitoring & Analytics

- Server logs via `morgan` in backend; platform logs via Vercel/Render dashboards.
- Client-side basic error boundaries and loading states (Auth + pages).
- (Optional per README) Usage analytics via Firebase/3rd-party can be added; not hard‑wired in MVP.

---

## 9. Scalability & Security

### Scalability
- Stateless backend with JWT auth scales horizontally (serverless ready).
- Firestore provides auto-scaling reads/writes; data is user-scoped to keep queries efficient.
- API client auto-detects base URL for multi‑environment deployments.

### Security practices
- Firebase ID token verification + backend JWT.
- Helmet security headers; strict CORS; rate limiting.
- Input validation and sanitization in controllers/models; server-side authorization by `userId` scope.

---

## 10. Future Improvements

- Advanced analytics (correlations across time, habit, expense dimensions).
- Reminders/notifications for habits and budgeting alerts.
- Offline-first local cache with background sync.
- Native mobile app (React Native) and shared auth.
- Team workspaces and shared projects.
- Premium subscriptions and export/backup.

---

## 11. Challenges & Key Learnings

- Authentication bridging: cleanly exchanging Firebase ID token for backend JWT simplified protected APIs while keeping Firebase as the identity provider.
- Data layer pivot: although the plan included MongoDB/Mongoose, the MVP models use Firestore for speed of iteration and serverless friendliness. The README keeps MongoDB guidance for teams preferring that stack; the code can be adapted with a Mongoose model layer later.
- Deployment flexibility: supporting both Render (long‑running) and Vercel (serverless) increases portability; `vercel.json` and the API client’s base URL logic make this seamless.

---

## Appendix — Concrete references (from codebase)

- Frontend auth & JWT handoff: `frontend/src/contexts/AuthContext.tsx`
- API client & base URL logic: `frontend/src/lib/api.ts`
- Backend server & routes: `backend/src/server.ts`, `backend/src/routes/*`
- Firebase Admin & token verification: `backend/src/services/firebase.ts`
- Data layer (Firestore): `backend/src/services/firebase-db.ts`, `backend/src/models/*`
- Vercel multi-app routing: `vercel.json`; serverless entry `backend/api/index.ts`














