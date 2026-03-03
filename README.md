# Full-Stack ToDo Application

## 📖 Project Overview
A production-ready, full-stack ToDo application built with a modern React frontend and a robust Node.js/Express backend. It features **end-to-end type safety using oRPC**, secure authentication (JWT with HTTP-only cookies and Google OAuth), comprehensive observability using Sentry and OpenTelemetry, and a resilient data layer powered by PostgreSQL and Orchid ORM.

## ✨ Key Features
- **End-to-End Type Safety:** Powered by **oRPC**, ensuring the frontend and backend share the same data contracts without manual type definitions.
- **Modern State Management:** Uses **TanStack React Query** for efficient data fetching, caching, and synchronization.
- **Secure Authentication:** Combines traditional username/password login with Google OAuth. Uses HTTP-only, SameSite cookies for JWT storage.
- **Robust Validation:** Request and form validation powered by Zod, integrated directly into oRPC contracts.
- **Form Management:** Fast and performant forms built with React Hook Form.
- **Deep Observability:** Fully instrumented with OpenTelemetry for distributed tracing and Sentry for error tracking across the stack.
- **PWA Ready:** Installable as a Progressive Web Application offering an app-like experience and asset caching.
- **Modern Data Access:** Database interactions handled by Orchid ORM for a developer-friendly, type-safe query building experience.

---

## 📸 Screenshots (Placeholder)
> **Note to self/contributor:** Add screenshots or a GIF here showcasing the login flow and the main ToDo dashboard in action. 
*Example format:* `![App Dashboard](./docs/dashboard.png)`

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19, Vite
- **Language:** TypeScript
- **RPC & State:** **oRPC (@orpc/client, @orpc/react-query)**, **TanStack React Query**
- **Forms:** React Hook Form
- **Validation:** Zod
- **Auth:** `@react-oauth/google`
- **PWA:** `vite-plugin-pwa`
- **Observability:** `@sentry/react`, OpenTelemetry (`@opentelemetry/sdk-trace-web`)

### Backend
- **Framework:** Node.js, Express
- **Language:** TypeScript
- **RPC Server:** **oRPC (@orpc/server, @orpc/zod)**
- **Database:** PostgreSQL
- **ORM:** Orchid ORM, `rake-db`
- **Validation:** Zod
- **Auth:** `jsonwebtoken`, `google-auth-library`, `cookie-parser`
- **Observability:** `@sentry/node`, OpenTelemetry (`@opentelemetry/sdk-node`)

## 🏗 System Architecture Overview
> **For a detailed visual breakdown of our oRPC architecture, authentication, and data flow, please see the [ARCHITECTURE.md](./ARCHITECTURE.md) document.**

The application follows a **Contract-First architecture**:
1. **Shared Contract:** A central `contract.ts` defines all API procedures, inputs, and outputs using Zod.
2. **Backend (Express + oRPC):** Implements the procedures defined in the contract.
3. **Frontend (React + React Query):** Consumes the backend procedures via a typed oRPC client, with React Query handling caching and loading states.
4. **Database (PostgreSQL):** Interacted with using Orchid ORM.
5. **Observability Layer:** Both client and server independently send traces and errors to Sentry and OpenTelemetry collectors.

## 📁 Folder Structure
```text
ToDoAppJS/
├── backend/                  # Node.js Express server
│   ├── db/                   # Orchid ORM schema & migrations
│   ├── src/                  # Middleware, oRPC Router & Telemetry
│   │   ├── contract.ts       # Shared oRPC contract definitions
│   │   └── router.ts         # Backend procedure implementations
│   ├── index.ts              # Entry point & Express setup
│   ├── package.json          # Backend dependencies
│   └── tsconfig.json         # Backend TS config
├── frontend/                 # React frontend
│   ├── src/                  # React components, Utils, Main
│   │   ├── shared/           # Symlinked or copied shared contract
│   │   │   └── contract.ts   # The same contract used by backend
│   │   ├── orpc.ts           # Frontend oRPC client setup
│   │   ├── App.tsx           # Main application component
│   │   └── telemetry.ts      # Frontend observability setup
│   ├── index.html            # Entry HTML
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
└── README.md                 # Project documentation
```

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgres://user:password@localhost:5432/tododb
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
SENTRY_DSN=your_sentry_dsn_here
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_SENTRY_DSN=your_sentry_dsn_here
```

## 🚀 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [PostgreSQL](https://www.postgresql.org/) running locally
- Google Cloud Console account (for OAuth credentials)

### 2. Setup Database
Create a new PostgreSQL database for the application.
```bash
createdb tododb
```

### 3. Backend Setup
```bash
cd backend
npm install
# Create an .env file with the required variables
cp .env.example .env 
# Run database migrations
npm run db:migrate
# Start the backend development server
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
# Create an .env file with the required variables
cp .env.example .env
# Start the frontend development server
npm run dev
```

## 🌍 Production Deployment Instructions
1. **Build Process:**
   - **Frontend:** Run `npm run build` in the `frontend` directory.
   - **Backend:** Run `npm run build` in the `backend` directory.
2. **Database:** Run `npm run db:migrate` in the CI/CD pipeline.
3. **Execution:** Start the backend server using `npm run start`.
4. **Environment:** Ensure all `.env` variables are correctly populated. Set `NODE_ENV=production` for secure cookies.

## 📊 Observability & Monitoring
- **Sentry:** Captures unhandled exceptions across the stack.
- **OpenTelemetry:** Distributed tracing from frontend UI down through oRPC procedures to database queries.

## 🔌 oRPC Procedures (API)
The API is defined as procedures in `backend/src/contract.ts`:

### Auth (`auth.*`)
- `register` - Create a new user.
- `login` - Session-based login (HTTP-only cookie).
- `logout` - Clear session cookie.
- `me` - Get current session info.
- `google` - Google OAuth authentication.

### Todos (`todos.*`)
- `list` - Fetch all todos.
- `create` - Add a new todo.
- `toggle` - Toggle todo completion status.
- `delete` - Remove a todo.

## 🛡 Security Considerations
- **Secure Cookies:** JWTs stored in HTTP-only, `SameSite=lax/none` cookies.
- **Strict Validation:** Zod schemas in oRPC contracts prevent malformed data.
- **CORS:** Restricts requests to the configured `FRONTEND_URL`.

## ⚡ Performance & Scalability
- **React Query:** Built-in caching, revalidation, and optimistic updates.
- **Orchid ORM:** Efficient SQL generation and type safety.
- **Vite:** High-performance bundling.

## 🔮 Future Improvements
- **Refresh Tokens:** Implement rotation for long-lived sessions.
- **Pagination:** Add cursor-based pagination for todo lists.
- **Automated Testing:** Vitest for units, Playwright for E2E.
- **CI/CD:** GitHub Actions for automated lint/test/deploy.
