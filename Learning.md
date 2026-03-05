# ToDoAppJS — Request Flow Learning Plan

> Full login-to-endpoint flow, broken into 9 phases.
> Each phase builds on the previous one.

---

## 📌 Agent Instructions (NEVER SKIP THESE)

> These rules apply every single session, every single phase.

1.  **Subpart by subpart (STRICT)**: Explain ONLY ONE subpart per message. STOP after each and wait for confirmation.
2.  **Line-level explanation**: Every code block must be explained line by line.
3.  **Code diff: Without vs With**: Show WHY a technology exists by comparing manual code vs the project's code.
4.  **Assume zero knowledge**: Explain concepts like "JWT", "Middleware", and "ORM" from scratch.
5.  **Always consult docs**: Use `ZOD_FLOW.md` and `ORM_FLOW.md` for project-specific examples.

---

## 🗺️ Phase Overview

| # | Phase | Core Technology | File(s) |
|---|-------|-----------------|---------|
| 1 | Contract Layer | Zod + oRPC Contract | `frontend/src/shared/contract.ts` |
| 2 | Auth Architecture | JWT + Orchid ORM | `backend/src/router.ts`, `backend/db/tables/user.table.ts` |
| 3 | Authentication Flow | React + oRPC mutations | `frontend/src/App.tsx` |
| 4 | Cookie Management | HTTP Cookies, jwt | `backend/index.ts`, `backend/src/router.ts` |
| 5 | Express Server | Express.js, CORS | `backend/index.ts` |
| 6 | Context Injection ⭐ | oRPC Context | `backend/index.ts` |
| 7 | oRPC Implementation | oRPC Handler + Orchid ORM | `backend/src/router.ts` |
| 8 | oRPC Frontend Client | `@orpc/client`, fetch | `frontend/src/orpc.ts` |
| 9 | React Integration | TanStack Query + React Hooks | `frontend/src/App.tsx` |

---

## Phase 1: Contract Layer
**File:** `frontend/src/shared/contract.ts`
**Technologies:** Zod, oRPC Contract
*Everything already covered in session!*

---

## Phase 2: Auth Architecture ⭐ (Current)
**Files:** `backend/src/router.ts`, `backend/db/tables/user.table.ts`
**Technologies:** JWT, Orchid ORM, bcrypt (or plain password check)

### Subparts
| # | Subpart | What it covers |
|---|---------|----------------|
| 2.1 | What is Auth? | Theoretical overview of login/register in this app |
| 2.2 | The User Table | How users are stored in PostgreSQL (`user.table.ts`) |
| 2.3 | Register Logic | Password hashing (if applicable) and `.create()` query |
| 2.4 | Login Logic | Finding users with `.where()` and validating credentials |
| 2.5 | JWT Basics | What is a token and how do we sign it? |
| 2.6 | Cookies | How `res.cookie` is used inside a handler |

---

## Phase 3: Authentication Flow
**File:** `frontend/src/App.tsx`
**Technologies:** `useForm`, oRPC mutations

---

## Phase 4: Cookie & Session Management
**Files:** Browser DevTools, `backend/index.ts`
**Technologies:** HTTP Cookies, `cookie-parser`

---

## Phase 5: Express Server & Middleware
**File:** `backend/index.ts`
**Technologies:** Express.js, CORS, JSON parsing

---

## Phase 6: oRPC Context ⭐ (Most Important)
**File:** `backend/index.ts`
**Technologies:** oRPC context system

---

## Phase 7: oRPC Implementation
**Files:** `backend/src/router.ts`, `backend/db/`
**Technologies:** Orchid ORM, oRPC Procedures

---

## Phase 8: oRPC Frontend Client
**File:** `frontend/src/orpc.ts`
**Technologies:** oRPC client, `credentials: 'include'`

---

## Phase 9: React Integration
**File:** `frontend/src/App.tsx`
**Technologies:** `useQuery`, `useMutation`, React state
