# TASA ✨ — Track and Simplify Activities

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8)

A full-stack **MERN productivity app** to manage your tasks, notes and expenses in one beautiful place — with charts, dark mode, budgets and PWA support.

**🌐 Live demo:** [tasa-viw2.vercel.app](https://tasa-viw2.vercel.app) · [Backend API](https://tasa-1.onrender.com)

> ⏳ First load may take ~30 seconds — the free-tier backend sleeps when idle.

## Features

### ✅ Tasks
- Add / edit / delete, mark complete
- Priority (High / Medium / Low) with colored badges
- Due dates with **overdue alerts**, custom tags, descriptions
- Filter tabs (All / Pending / Done), search, one-click "Clear Done"

### 📝 Notes
- Sticky-note style grid in **5 colors**
- Pin important notes to the top, search, copy to clipboard

### 💸 Expenses
- Category-wise tracking (Food, Travel, Shopping, Bills, Other)
- **Donut chart** with a colorblind-safe palette + month selector
- **Monthly budget** with progress bar and over-budget warning
- Export to **CSV**

### 📊 Dashboard
- Live stats: total tasks, monthly spend, recent notes
- Task progress bar, spending charts (by category + last 7 days)
- Overdue / due-today reminder banners, quick actions
- Time-based greeting 👋

### 🔐 Authentication
- JWT-based register / login, protected routes, user-specific data
- Forgot password with **email OTP** (Nodemailer + Gmail)
- Change password, edit profile, delete account (with all data)
- Password strength meter, show/hide password, auto-logout on token expiry

### 🎨 Experience
- Glassmorphism UI with Tailwind CSS
- **Dark mode** 🌙 (persisted)
- Toast notifications, loading skeletons, smooth animations
- Fully responsive (mobile drawer sidebar)
- **PWA** — installable with offline app-shell caching

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcrypt, email OTP via Nodemailer |
| Deploy | Render (API) + Vercel (frontend) |

## Project Structure

```
TASA/
├── middleware/           # JWT auth middleware
├── models/               # User, Task, Note, Expense schemas
├── routes/               # auth, tasks, notes, expenses
├── utils/                # sendEmail (Nodemailer)
├── server.js             # Express entry point
└── tasa-frontend/
    ├── public/           # PWA manifest, service worker
    └── src/
        ├── components/   # ProtectedRoute, ThemeToggle
        ├── context/      # ToastContext
        └── pages/        # Landing, Auth pages, Dashboard, Tasks, Notes, Expense, Profile
```

## Run Locally

**Prerequisites:** Node.js 18+, MongoDB (local or Atlas)

```bash
# 1. Clone
git clone https://github.com/tanishagargcoder/TASA.git
cd TASA

# 2. Backend
npm install
# create .env with:
#   MONGO_URL=mongodb://localhost:27017/tasaDB   (or your Atlas URI)
#   JWT_SECRET=your_secret
#   EMAIL=your_gmail@gmail.com
#   EMAIL_PASS=your_gmail_app_password
npm run dev            # http://localhost:5000

# 3. Frontend (new terminal)
cd tasa-frontend
npm install
npm start              # http://localhost:3000
```

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Send OTP email |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/reset-password` | Reset with OTP |
| GET/PUT/DELETE | `/api/auth/me` | Get / update / delete profile |
| CRUD | `/api/tasks` | Tasks (+ `/toggle/:id`) |
| CRUD | `/api/notes` | Notes (pin, color) |
| CRUD | `/api/expenses` | Expenses |

All data routes require `Authorization: Bearer <token>` and return only the logged-in user's data.

---

Made with 💖 by [Tanisha Garg](https://github.com/tanishagargcoder)
