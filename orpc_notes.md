# 🚀 oRPC Master Revision Notes: The End-to-End Type Safety Guide

This document serves as a detailed reference for oRPC implementation in the Journal App. It captures the core philosophy, the architecture, and the syntax comparisons that define modern type-safe development.

---

## 1. The Core Philosophy: "No More Guessing"
In traditional development (REST), the Frontend "guesses" what the Backend returns. In oRPC, the Frontend **knows** because they share the same DNA: **The Contract**.

### Before vs After Comparison

#### A. Frontend Request
| Before (REST + fetch) | After (oRPC) |
| :--- | :--- |
| ```ts | ```ts |
| // ❌ Manually type the result (Extra Work) | // ✅ Result is auto-typed (Zero Work) |
| interface JournalEntry { | // No manual interface needed! |
|   id: number; title: string; | |
| } | |
| | |
| const res = await fetch('/api/entries'); | const data = await client.getEntries(); |
| const data: JournalEntry[] = | |
|    await res.json(); | // TypeScript knows 'data' is |
|                      | // Entry[] immediately |
| ``` | ``` |

#### B. API Definition (The "URL" Problem)
| Before (Express REST) | After (oRPC Router) |
| :--- | :--- |
| ```ts | ```ts |
| // ❌ Route is just a string (Typo prone) | // ✅ Route is a typed function |
| app.get('/api/entries', (req, res) => { | getEntries: i.getEntries.handler(async () => { |
|   const entries = await db.getAll(); |   const entries = await db.getAll(); |
|   res.json(entries); |   return entries; |
| }); | }); |
| ``` | ``` |

---

## 2. The Three-Layer Architecture

### Layer 1: The Contract (`shared/contract.ts`)
The **Contract** is the "Source of Truth." It lives in a shared folder so both frontend and backend can see it.

**Detailed Syntax Breakdown:**
```ts
export const contract = oc.router({
  addEntry: oc
    .input(z.object({       // 💂‍♂️ The Entrance Guard (What must the client send?)
      title: z.string(),
      content: z.string(),
    }))
    .output(EntrySchema),   // 📋 The Receipt (What will the server return?)
})

// Vocabulary:
// - Procedure: A single "API method" (e.g., addEntry).
// - Input: The arguments passed to the function.
// - Output: The data returned by the function.
```

### Layer 2: The Router (`server/router.ts`)
The **Router** is where the "heavy lifting" (database work) happens. It uses the `implement` function to connect the contract to real code.

**Syntax Key:**
```ts
const i = implement(contract);

export const router = i.router({
  addEntry: i.addEntry.handler(async ({ input }) => {
    // 1. 'input' is already typed and validated by Zod.
    const result = await db.save(input.title);
    
    // 2. We MUST return what the contract promised.
    return result; 
  }),
})
```

### Layer 3: The Client (`src/rpc.ts`)
This is how the frontend talks to the lobby. It imports the **Type** of the backend, not the **Code**.

```ts
// IMPORT TYPE ONLY (Crucial for speed/safety)
import type { AppRouter } from '@server/router'

// The 'RouterClient' converter makes the magic happen
export const client = createORPCClient<RouterClient<AppRouter>>(link)
```

---

## 3. The "Lobby" Strategy (Server Setup)
Instead of 50 routes in `server.ts`, we use a single entry point.

**Code:**
```ts
const rpcHandler = new RPCHandler(router)

app.all(['/rpc', '/rpc/*'], async (req, res) => {
  await rpcHandler.handle(req, res, { prefix: '/rpc' })
})
```

**Analogy: The Post Office**
*   **REST**: You have to drive to 50 different houses to deliver mail.
*   **oRPC**: Every letter goes to one **Central Post Office** (`/rpc`). The `RPCHandler` is the sorter who looks at the address (`/getEntries`) and puts the letter in the correct box (Function).

---

## 4. Why Use oRPC Over TRPC?
oRPC is a modern evolution that focuses on:
1.  **Contract-First Design**: The API is clearly defined in one file.
2.  **Standards-Based**: It uses standard HTTP methods and is compatible with modern tools like OpenAPI/Swagger.

---

## 5. Revision Checklist
- [ ] **Contract changed?** Check if you need to update the `input`/`output` in `shared/contract.ts`.
- [ ] **Procedure added?** Make sure you implement it in `server/router.ts` using `i.newName.handler`.
- [ ] **Typing `client.` in Frontend?** If you don't see your procedure, check if `AppRouter` is exported in `router.ts`.
