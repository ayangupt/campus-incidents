# UChicago Campus Incident Reporting

A minimal incident reporting web application for the University of Chicago campus. Students and staff can submit incident reports through a public form, and administrators can view, filter, and manage incidents through a password-protected dashboard.

## Tech Stack

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Node.js + Express
- **Database:** SQLite (via sql.js)
- **Auth:** JWT tokens with simple password authentication

## Quick Start

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

The server uses a `.env` file (already included with defaults):

```
ADMIN_PASSWORD=uchicago-admin-2024
JWT_SECRET=campus-incidents-secret-key
PORT=3001
```

Change these values for production use.

### 3. Start the development servers

**Terminal 1 — API server:**
```bash
cd server
npm run dev
```

**Terminal 2 — React dev server:**
```bash
cd client
npm run dev
```

The React app runs on `http://localhost:5173` and proxies API requests to the Express server on port 3001.

## Pages

### Report Incident (`/`)
Public form with:
- Dropdowns for **Location** (28 UChicago campus buildings), **Category** (6 types), and **Severity** (4 levels)
- Date/time picker (defaults to current time)
- Text fields for title, description, reporter name, and email

### Admin Dashboard (`/admin`)
Password-protected page with:
- Filterable incident table (by category, severity, status)
- Expandable rows showing full incident details
- Status management (Open → In Review → Resolved)

**Default admin password:** `uchicago-admin-2024`

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `/api/incidents` | None | Submit a new incident |
| `GET` | `/api/incidents` | Admin | List incidents (supports `?category=`, `?severity=`, `?status=`, `?sort=`, `?order=`) |
| `PATCH` | `/api/incidents/:id/status` | Admin | Update incident status |
| `POST` | `/api/admin/login` | None | Authenticate and receive JWT token |

## Project Structure

```
campus-incidents/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ReportForm.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   └── IncidentTable.jsx
│   │   ├── styles/global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── server/                     # Express API
│   ├── routes/incidents.js
│   ├── middleware/adminAuth.js
│   ├── db.js
│   ├── index.js
│   └── .env
└── README.md
```
