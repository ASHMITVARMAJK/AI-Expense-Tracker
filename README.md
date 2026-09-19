# SpendAI: AI-Powered Expense Tracker (FastAPI + React)

SpendAI is a modern, secure, and minimalist personal finance assistant. It allows users to manage their transactions and quick-add expenses by typing natural language sentences (e.g., *"bought groceries for 850 and movie ticket for 250 yesterday"*). The app extracts transaction metadata using Google Gemini 2.5 Flash, renders editable cards, and commits them in bulk.

Deployed live at: **[SpendAI Frontend (Vercel)](https://ai-expense-tracker-three-theta.vercel.app)**  
Backend Service: **[SpendAI Backend (Render)](https://ai-expense-tracker-lmwi.onrender.com)**

---

## 🏗️ Architecture & Flow

```text
  [ React Client ] (Vercel)
         │
         │ (HTTP REST API with Firebase JWT Token)
         ▼
  [ Python FastAPI API ] (Render in Docker Container)
    ├── Security Dependency (Firebase JWT Token Verification)
    ├── Rate Limiting Middleware (Max 10 requests/min per IP)
    └── Gemini Service ──(API Call)──> [ Google Gemini 2.5 Flash ]
         │
         ▼ (SQLAlchemy ORM)
  [ Neon Cloud PostgreSQL ]
```

---

## ⚡ Key Features

- **Multi-Expense AI Quick Add:** Type short paragraphs containing multiple transactions. Google Gemini parses them into a structured JSON list, which renders as interactive review cards. Modify titles, amounts, categories, and dates directly before bulk-saving them.
- **SaaS Premium Minimalist UI:** Built with a clean Slate + Blue design system (warm off-white backgrounds, dark slate text, royal blue accents, and pill category badges).
- **Interactive Analytics:** Live dashboard with accumulated spend metrics, monthly trends, and dynamic chart allocations.
- **Security Scoping:** Users are authenticated via Firebase JWT. All database operations strictly verify record ownership using the authenticated Firebase UID (`firebase_uid`), protecting against ID harvesting.
- **API Rate Limiter:** Custom, proxy-aware middleware restricting AI endpoints to a maximum of **10 requests per minute** per user or IP to shield API key quotas from abuse.

---

## 🛠️ Technology Stack

### Backend
- **Python 3.11 & FastAPI**
- **SQLAlchemy 2.0 ORM & Psycopg2**
- **PyJWT** (Firebase JWT Token Verification)
- **PostgreSQL Database** (Hosted on Neon Cloud)
- **Google Gemini API** (using `gemini-2.5-flash`)

### Frontend
- **React (TypeScript) & Vite**
- **Lucide React** (Icons)
- **Axios** (API requests with automatic JWT interceptors)
- **Firebase Auth SDK** (Google OAuth and Email/Password sign-in)

---

## ⚙️ Environment Variables Config

### Backend Service (`app/config.py`)

| Environment Variable | Description |
| :--- | :--- |
| `SPRING_DATASOURCE_URL` or `DATABASE_URL` | Neon cloud database connection URL (`postgresql://...` or `jdbc:postgresql://...`) |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of whitelisted frontend URLs |

---

## 💻 Local Setup & Run

### Run the Backend (Python FastAPI)
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8080
   ```
   *The server starts on `http://localhost:8080`.*

### Run the Frontend (React)
1. Navigate into the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*
