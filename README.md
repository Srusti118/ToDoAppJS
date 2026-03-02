# Full-Stack ToDo Application

## 📖 Project Overview
A production-ready, full-stack ToDo application built with a modern React frontend and a robust Node.js/Express backend. It features secure authentication (JWT with HTTP-only cookies and Google OAuth), type safety from end to end, comprehensive observability using Sentry and OpenTelemetry, and a resilient data layer powered by PostgreSQL and Orchid ORM.

## ✨ Key Features
- **Secure Authentication:** Combines traditional username/password login with Google OAuth. Uses HTTP-only, SameSite cookies for JWT storage.
- **Robust Validation:** Request and form validation powered by Zod on both frontend and backend.
- **Form Management:** Fast and performant forms built with React Hook Form.
- **Deep Observability:** Fully instrumented with OpenTelemetry for distributed tracing and Sentry for error tracking across the stack.
- **Type Safety:** TypeScript utilized across both the frontend and backend to guarantee type integrity.
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
- **State & Forms:** React Hook Form, Context API
- **Validation:** Zod, `@hookform/resolvers`
- **Network:** Axios
- **Auth:** `@react-oauth/google`
- **Observability:** `@sentry/react`, OpenTelemetry (`@opentelemetry/sdk-trace-web`)

### Backend
- **Framework:** Node.js, Express
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Orchid ORM, `rake-db`
- **Validation:** Zod (`orchid-orm-schema-to-zod`)
- **Auth:** `jsonwebtoken`, `google-auth-library`, `cookie-parser`
- **Observability:** `@sentry/node`, OpenTelemetry (`@opentelemetry/sdk-node`)

## 🏗 System Architecture Overview
> **For a detailed visual breakdown of our authentication, data flow, and database models, please see the [ARCHITECTURE.md](./ARCHITECTURE.md) document.**

The application follows a standard client-server architecture:
1. **Client (React):** Handles UI state, form submissions, and Google OAuth flow initiation. Communicates with the backend via RESTful API calls using Axios.
2. **Server (Express):** Exposes API endpoints, implements business logic, validates payloads with Zod, and manages authentication using JWTs in secure cookies.
3. **Database (PostgreSQL):** Stores users and todos. Interacted with using Orchid ORM.
4. **Observability Layer:** Both client and server independently send traces and errors to Sentry and OpenTelemetry collectors.

## 📁 Folder Structure
```text
ToDoAppJS/
├── backend/                  # Node.js Express server
│   ├── db/                   # Orchid ORM schema & migrations
│   ├── src/                  # Middleware & Telemetry config
│   ├── index.ts              # Entry point & API Routes
│   ├── package.json          # Backend dependencies
│   └── tsconfig.json         # Backend TS config
├── frontend/                 # React frontend
│   ├── src/                  # React components, Utils, Main
│   │   ├── App.tsx           # Main application component
│   │   ├── main.tsx          # React DOM mounting
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
# Create an .env file with the required variables listed above
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
# Create an .env file with the required variables listed above
cp .env.example .env
# Start the frontend development server
npm run dev
```

## 🌍 Production Deployment Instructions
1. **Build Process:**
   - **Frontend:** Run `npm run build` in the `frontend` directory to generate the static files in `frontend/dist`. These files can be served via Nginx, Vercel, or AWS S3/CloudFront.
   - **Backend:** Run `npm run build` in the `backend` directory to compile TypeScript to JavaScript in `backend/dist`.
2. **Database:** Run `npm run db:migrate` in the CI/CD pipeline before starting the new backend version.
3. **Execution:** Start the backend server using `npm run start` or via a process manager like PM2 with `pm2 start dist/index.js`.
4. **Environment:** Ensure all `.env` variables are correctly populated in the hosting provider's configuration. Set `NODE_ENV=production` to enforce secure cookies.

## 📊 Observability & Monitoring
- **Sentry:** Captures unhandled exceptions and promise rejections across both frontend and backend. It provides detailed stack traces and environmental context (e.g., browser version, OS).
- **OpenTelemetry:** Used for distributed tracing. Traces request paths from the frontend UI interaction down through the Express routing and into the Orchid ORM database queries, providing a clear visualization of latency and bottlenecks.

## 🔌 API Endpoints Summary

### Authentication
- `POST /api/register` - Create a new user with username/password.
- `POST /api/login` - Authenticate a user and issue an HTTP-only JWT cookie.
- `POST /api/auth/google` - Authenticate using a Google OAuth credential.
- `POST /api/auth/logout` - Clear the auth cookie.
- `GET /api/auth/me` - Fetch the currently authenticated user's profile.

### Todos
- `GET /api/todos` - Retrieve all todos for the authenticated user.
- `POST /api/todos` - Create a new todo item.
- `PATCH /api/todos/:id` - Toggle the completion status of a todo.
- `DELETE /api/todos/:id` - Delete a specific todo.

### Debugging
- `GET /api/debug-sentry` - Force a Sentry exception for connection testing.

## 🛡 Security Considerations
- **Authentication Strategy:** Uses HTTP-only, `SameSite=lax` (or `none` in production) cookies to store JWTs, mitigating Cross-Site Scripting (XSS) risks associated with `localStorage`.
- **Input Validation:** Zod enforces strict schemas on all incoming requests (e.g., `createTodoSchema`, `authSchema`), preventing NoSQL/SQL injection and malformed data attacks.
- **Environment Targeting:** Secure flags on cookies are dynamically set based on `NODE_ENV=production`.
- **CORS Configuration:** Explicitly restricts cross-origin requests to the configured `FRONTEND_URL`.

## ⚡ Performance & Scalability Considerations
- **Connection Pooling:** The backend should utilize connection pooling (e.g., `pg-pool`) to handle high volumes of concurrent requests efficiently.
- **Vite Build Optimization:** The frontend utilizes Vite for rapid HMR in development and highly optimized Rollup builds in production.
- **Database Indexing:** Ensure foreign keys (like `userId` on the `todo` table) and frequently queried columns (like `email` or `username` on `user`) are properly indexed.

## 🔮 Future Improvements
- **Refresh Tokens:** Implement a refresh token rotation strategy to extend session lifespans securely without requiring frequent re-authentication.
- **Pagination/Virtualization:** Add pagination to the `GET /api/todos` endpoint and virtualization on the frontend to handle massive lists of todos gracefully.
- **Automated Testing:** Integrate Jest/Vitest for unit testing and Playwright/Cypress for E2E testing.
- **CI/CD Pipeline:** Implement GitHub Actions to automate linting, type-checking, database migrations, and deployments.
- **Rate Limiting:** Protect authentication endpoints against brute-force attacks.
