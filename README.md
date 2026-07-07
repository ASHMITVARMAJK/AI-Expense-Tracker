# SpendAI: AI-Powered Expense Tracker

SpendAI is a modern, secure, and minimalist personal finance assistant. It allows users to manage their transactions and quick-add expenses by simply typing natural language sentences (e.g., *"bought groceries for 850 and movie ticket for 250 yesterday"*). The app extracts transaction metadata using Google Gemini 2.5 Flash, renders editable cards, and commits them in bulk.

Deployed live at: **[SpendAI Frontend (Vercel)](https://ai-expense-tracker-three-theta.vercel.app)**  
Backend Service: **[SpendAI Backend (Render)](https://ai-expense-tracker-lmwi.onrender.com)**

---

## 🏗️ Architecture & Flow

```text
  [ React Client ] (Vercel)
         │
         │ (HTTP REST API with Firebase JWT Token)
         ▼
  [ Spring Boot API ] (Render in Docker Container)
    ├── Security Filter (JWT Token Verification)
    ├── Rate Limiting Filter (Max 10 requests/min per IP/UID)
    └── Gemini Service ──(API Call)──> [ Google Gemini 2.5 Flash ]
         │
         ▼ (JPA / Hibernate)
  [ Neon Cloud PostgreSQL ]
```

---

## ⚡ Key Features

- **Multi-Expense AI Quick Add:** Type short paragraphs containing multiple transactions. Google Gemini parses them into a structured JSON list, which renders as interactive review cards. Modify titles, amounts, categories, and dates directly before bulk-saving them.
- **SaaS Premium Minimalist UI:** Built with a clean Slate + Blue design system (warm off-white backgrounds, dark slate text, royal blue accents, and pill category badges).
- **Interactive Analytics:** Live dashboard with accumulated spend metrics, monthly trends, and dynamic chart allocations.
- **Security Scoping:** Users are authenticated via Firebase JWT. All database operations strictly verify record ownership using the authenticated Firebase UID (`findByIdAndUserFirebaseUid`), protecting against ID harvesting.
- **API Rate Limiter:** Custom, proxy-aware token bucket filter restricting AI endpoints to a maximum of **10 requests per minute** per user or IP to shield API key quotas from abuse.

---

## 🛠️ Technology Stack

### Backend
- **Java 23 & Spring Boot 3.4**
- **Spring Security & Spring OAuth2 Resource Server** (Firebase JWT Validation)
- **Spring Data JPA**
- **PostgreSQL Database** (Hosted on Neon Cloud)
- **Google Gemini API** (using the stable `v1beta/gemini-2.5-flash` model)

### Frontend
- **React (TypeScript) & Vite**
- **Lucide React** (Icons)
- **Axios** (API requests with automatic JWT interceptors)
- **Firebase Auth SDK** (Google OAuth and Email/Password sign-in)

---

## ⚙️ Environment Variables Config

### Backend Service (`application.properties`)
The backend is sanitized of secrets and reads its credentials dynamically from the operating system environment:

| Environment Variable | Description |
| :--- | :--- |
| `SPRING_DATASOURCE_URL` | Neon cloud database connection URL (`jdbc:postgresql://...`) |
| `SPRING_DATASOURCE_USERNAME` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key |
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of whitelisted frontend URLs |

### Frontend Client (`.env` file)
Create a `.env` file inside the `frontend/` directory to bind Firebase configurations and endpoint URLs:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_API_URL=https://your-backend-service.onrender.com
```

---

## 💻 Local Setup & Run

### Prerequisites
- Java 23 installed
- Node.js 18+ installed

### Run the Backend (Spring Boot)
1. Set your local environment variables in your terminal:
   ```powershell
   # On Windows PowerShell:
   $env:GEMINI_API_KEY="your-gemini-key"
   $env:SPRING_DATASOURCE_URL="jdbc:postgresql://your-neon-url?sslmode=require"
   $env:SPRING_DATASOURCE_USERNAME="neondb_owner"
   $env:SPRING_DATASOURCE_PASSWORD="your-password"
   $env:FIREBASE_PROJECT_ID="your-firebase-id"
   ```
2. Build and run the server:
   ```powershell
   .\gradlew.bat clean bootRun
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
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 🚀 Cloud Deployment

### 1. Backend (Render via Docker)
We use Docker to deploy the Java application natively on Render:
- **Build Runtime:** Choose `Docker` in Render's runtime dropdown.
- **Build / Start Commands:** Leave blank (Render uses the instructions in the project's root `Dockerfile` automatically).
- **Environment Variables:** Set your database connection URL, password, Gemini Key, Firebase ID, and `CORS_ALLOWED_ORIGINS` in the Environment tab.

### 2. Frontend (Vercel)
- **Root Directory:** Set to `frontend` *(very important)*.
- **Framework Preset:** `Vite`.
- **Environment Variables:** Provide your public Firebase config keys and the `VITE_API_URL` pointing to your Render backend service.

### 3. Firebase Authentication Domain Whitelisting
- Go to the **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized Domains**.
- Add your live Vercel domain (e.g. `your-app.vercel.app`) to authorize users to log in securely from your live site.
