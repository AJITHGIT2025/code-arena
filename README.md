# CODE ARENA — Programming Practice & Online Coding Platform

> **Practice. Code. Compete.**  
> A complete, modern, responsive online coding and practice platform built specifically for college students in their **1st Year**, **2nd Year**, and **3rd Year**, powered by a genuine automated online judge supporting **C, C++, Java, and Python**.

---

## 🚀 Key Features

### 1. 🎓 Academic Year Tracks
* **1st Year (Fundamentals):** Variables, data types, operators, conditionals, loops, 1D/2D arrays, strings, and functions.
* **2nd Year (Data Structures & OOP):** Recursion, sorting, searching, linked lists, stacks, queues, binary trees, hashing, and object-oriented patterns.
* **3rd Year (Advanced Algorithms):** Dynamic programming, greedy algorithms, backtracking, graph algorithms (BFS, DFS, Dijkstra), advanced data structures, and competitive programming optimization.

### 2. 🛡️ Comprehensive Admin Question Management
* Personal control over every question in the question bank.
* Create, edit, publish, unpublish, and delete programming problems without touching code.
* Define problem statements, input/output specifications, constraints, and time/memory limits.
* **Multiple Sample Test Cases:** Visible to students for local test runs with explanations and one-click copy.
* **Multiple Hidden Test Cases:** Stored securely on the server and used exclusively for official evaluation. **Hidden test cases are never leaked to client browsers or network payloads.**
* **JSON Import/Export:** Backup, migrate, and import bulk problem sets with a single click.

### 3. ⚡ Online Coding Workspace (LeetCode / HackerRank Style)
* **Monaco Editor:** Syntax highlighting, line numbers, bracket colorization, auto-indentation, and starter templates.
* **4 First-Class Runtimes:** Real compilation and execution in **C (GCC)**, **C++ (G++)**, **Java (JDK)**, and **Python 3**.
* **Standard Input / Output:** Full support for `stdin` and `stdout`.
* **Run Code:** Immediate testing against sample test cases or custom input.
* **Submit Solution:** Automated server-side evaluation against all hidden test cases with points awarded upon passing.
* **Celebration Effects:** Confetti celebration upon successfully solving challenges.

### 4. 📊 Student Dashboard & College Leaderboard
* Real-time metrics: Total problems solved, problems attempted, total points earned, and overall completion rate.
* Academic year progress tracking bars.
* Topic-wise and difficulty-wise performance breakdowns.
* Campus Leaderboard ranking students by points earned with podium cards and tie-breaking rules.
* **Guest Browsing Mode:** Students can read problems and test code without logging in; authenticated accounts track progress and record submissions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Monaco Editor (`@monaco-editor/react`), Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript (`tsx`), REST API, Helmet-style security headers, Express Rate Limiter |
| **Database** | SQLite (zero-config local persistence) + PostgreSQL compatible schema via Prisma ORM |
| **Auth** | JWT (JSON Web Tokens), `bcryptjs` password hashing, Role-Based Access Control (`ADMIN` / `STUDENT`) |
| **Code Judge** | Judge0 CE API (`https://ce.judge0.com`), RapidAPI Judge0, and isolated local process runner fallback |
| **Deployment** | Docker multi-stage build, Docker Compose, Render Blueprint (`render.yaml`) |

---

## 🔑 Default Credentials

The database comes pre-seeded with initial accounts for testing:

| Role | Email | Password | Academic Year | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@codearena.com` | `Admin@CodeArena2026!` | General | Full question bank control, hidden test case management, submission stream |
| **Student** | `student@codearena.com` | `Student@123` | 1st Year | Code execution, problem solving, submission history, student dashboard |

*(You can also register new student accounts directly through the registration page).*

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
* Node.js (v18+)
* npm (v9+)
* Compilers for local fallback (optional, as Judge0 API runs out-of-the-box): `gcc`, `javac`, `python`

### 1. Installation
Clone or navigate to the project directory:
```bash
cd code-arena
```

Install dependencies for both frontend and backend:
```bash
# Server setup
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed

# Client setup
cd ../client
npm install
```

### 2. Run in Development Mode

You can run both backend (port 5000) and frontend (port 5173) concurrently with a single command from the root directory:

```bash
# From the code-arena root folder:
npm run dev
```

Alternatively, you can run them in separate terminals:

**Terminal 1: Backend Server (Port 5000)**
```bash
cd server
npm run dev
```

**Terminal 2: Frontend Client (Port 5173)**
```bash
cd client
npm run dev
```

Open your browser at: **`http://localhost:5173`** (or `http://localhost:5000` when running the production build).

---

## 🧪 Automated Testing

### 1. Test All 4 Judge Runtimes (C, C++, Java, Python)
```bash
cd server
npx tsx test-judge.ts
```

### 2. Run Complete End-to-End Test Suite
Runs tests verifying Admin login, Student registration, Problem listing, Hidden test case security isolation, Run Code, Submit Solution, Scoring, and Leaderboard:
```bash
cd server
npx tsx test-suite.ts
```

---

## 🌐 Public Cloud Deployment Guide

### Option 1: Render (Recommended — 1 Click / Free)

The project includes a ready-to-use [`render.yaml`](file:///c:/Users/AJITH%20C/Documents/Project/code-arena/render.yaml) blueprint and multi-stage [`Dockerfile`](file:///c:/Users/AJITH%20C/Documents/Project/code-arena/Dockerfile).

1. Push the code repository to GitHub or GitLab.
2. Go to [Render.com](https://render.com) and click **New → Blueprint** (or **New → Web Service**).
3. Connect your repository. Render automatically reads `render.yaml` and configures the service.
4. Set the environment variables in the Render dashboard:
   * `NODE_ENV`: `production`
   * `JWT_SECRET`: Generate a secure random string (at least 32 characters).
   * `JUDGE0_API_URL`: `https://ce.judge0.com` (Free public Judge0 CE endpoint)
   * `DATABASE_URL`: `file:./dev.db` (for SQLite) or connect a managed PostgreSQL database.
5. Click **Deploy**. Render will build the React frontend and Node backend into a single unified container and assign you a public URL (e.g., `https://code-arena.onrender.com`).

---

### Option 2: Railway or Fly.io

1. Install the Railway CLI or connect via the Railway dashboard:
   ```bash
   railway up
   ```
2. Railway detects the `Dockerfile` and builds the production container automatically.
3. Add a PostgreSQL plugin if you wish to use PostgreSQL instead of SQLite, and update `DATABASE_URL` in the environment settings.
4. Generate a public domain under service settings (e.g. `code-arena.up.railway.app`).

---

### Option 3: Docker / Self-Hosted VPS

Run the entire platform using Docker Compose:
```bash
docker-compose up -d --build
```
The application will be live at `http://localhost:5000` (or your VPS public IP).

---

## 🔒 Security & Sandboxing Architecture

1. **Hidden Test Cases Protection:**
   The `Problem` model excludes `hiddenTestCases` from all public and student API routes. Hidden test cases are evaluated entirely on the server and results are returned as safe pass/fail summaries without exposing the expected output.

2. **Isolated Code Execution:**
   Submitted code is executed in an isolated Judge0 sandbox enforcing:
   * CPU time limits (default 2.0s).
   * Memory limits (default 256MB).
   * Sandboxed filesystem and network access.
   * Output buffer caps to prevent fork bomb or memory exhaustion attacks.

3. **Rate Limiting & Authentication:**
   * Execution endpoints (`/api/submissions/run` and `/api/submissions/submit`) are protected with IP-based rate limiting (max 30 requests/minute).
   * Passwords are encrypted using salted `bcryptjs` hashes.
   * JWT tokens authenticate sessions with role verification (`ADMIN` vs `STUDENT`).

---

## 📁 Project Structure

```
code-arena/
├── client/                     # Frontend Application (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # Navbar, Footer, Badges (Year, Difficulty, Status)
│   │   ├── context/            # AuthContext (persistent sessions, roles)
│   │   ├── pages/              # Home, Explorer, Workspace, Dashboard, Leaderboard, Admin
│   │   ├── services/           # Axios API service
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Route definitions
│   │   └── main.tsx            # Entry point
│   └── vite.config.ts          # Vite configuration with Tailwind CSS v4 & dev proxy
│
├── server/                     # Backend API & Online Judge (Node.js + Express + Prisma)
│   ├── prisma/
│   │   └── schema.prisma       # Database schema (User, Problem, TestCases, Submissions)
│   ├── src/
│   │   ├── controllers/        # Auth, Problems, Submissions, Stats
│   │   ├── middleware/         # JWT verification, Role checks (requireAdmin, optionalAuth)
│   │   ├── routes/             # REST route definitions
│   │   ├── services/           # JudgeService (Judge0 CE & Local Isolated Runner)
│   │   ├── db/                 # Prisma instance & seed script
│   │   └── index.ts            # Express server entry point
│   ├── test-judge.ts           # Runtimes verification test script
│   └── test-suite.ts           # End-to-end integration test suite
│
├── Dockerfile                  # Multi-stage production container
├── docker-compose.yml          # Docker composition file
├── render.yaml                 # Render cloud deployment blueprint
├── .env.example                # Environment variables template
└── README.md                   # Complete documentation
```

---

## 📜 License
This project is licensed under the MIT License.
