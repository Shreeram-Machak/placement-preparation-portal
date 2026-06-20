# Placement Preparation Portal

A full-stack placement preparation web app for students and admins. Students can practice aptitude, solve coding problems, take mock tests, track progress, view leaderboards, explore companies, and apply to eligible company drives. Admins can manage questions, coding problems, mock tests, companies, users, and results.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose, JWT authentication
- AI features: Google Gemini API for question generation and interview feedback

## Project Structure

```text
Placement preparation portal/
|-- client/      React + Vite frontend
|-- server/      Express + MongoDB backend
`-- README.md
```

## Features

- Student registration and login
- Role-based protected routes for students and admins
- Aptitude quiz generation and result tracking
- Coding problem runner and submission tracking
- Company mock tests and analytics
- Dashboard with real MongoDB progress data
- Leaderboard for aptitude, mock tests, coding, and readiness
- Company directory with eligibility checks and application status
- Resume builder, resources, interview prep, profile, and progress pages
- Admin panel for managing portal content

## Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` is required for AI-generated aptitude/mock questions and AI interview feedback. The app can still run without it, but those AI features will show configuration errors.

## Installation

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

## Run Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## Build

```bash
cd client
npm run build
```

## Main API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/dashboard/progress`
- `POST /api/results`
- `GET /api/results/my`
- `GET /api/results/admin/all`
- `GET /api/leaderboard`
- `GET /api/companies`
- `POST /api/companies/:id/apply`
- `GET /api/companies/applications/my`
- `POST /api/submissions/coding`

## Notes

- The frontend currently calls the backend at `http://localhost:5000`.
- Keep `.env`, `node_modules`, `dist`, and `build` out of Git.
- Run the backend before using protected dashboard features.
