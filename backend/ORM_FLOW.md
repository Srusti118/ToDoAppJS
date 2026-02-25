# Understanding the ORM Flow

This document explains how **Orchid ORM** and **Rake DB** work together in our project to manage the database and provide type safety.

## 🔄 The Big Picture

The flow moves from **Code Definitions** → **Migrations** → **Database Schema** → **Application Queries**.

```mermaid
graph TD
    A["1. Table Definition (todo.table.ts)"] -->|Defines Schema| B["2. Database Instance (db/index.ts)"]
    A -->|Manual Step| C["3. Migration (db/migrations/)"]
    C -->|rake-db up| D[("4. PostgreSQL Database")]
    B -->|Imported by| E["5. App Logic (Express Routes)"]
    E -->|db.todo.find()| D
    D -->|Typed Result| E
```

---

## 🏎️ Step-by-Step Flow

### 1. Definition (The Blueprint)
Everything starts in [`db/tables/todo.table.ts`](file:///c:/Users/srusti/OneDrive/Desktop/ToDoSeries/ToDoAppJS/backend/db/tables/todo.table.ts). You define what columns exist, their types (text, boolean, etc.), and their default values.
*   **Role**: This is the "Source of Truth" for TypeScript. It tells the ORM what the data should look like.

### 2. Initialization (The Bridge)
In [`db/index.ts`](file:///c:/Users/srusti/OneDrive/Desktop/ToDoSeries/ToDoAppJS/backend/db/index.ts), we connect the Table Definitions to the Database.
*   **Role**: It creates the `db` object which is the interface we use to talk to the database.

### 3. Migrations (The Mover)
When you change the blueprint (Step 1), the actual database doesn't know. You must create a **Migration** file in `db/migrations/`.
*   **Commands**:
    *   `npm run db -- g <name>`: Generates a new migration file.
    *   `npm run db up`: Runs all pending migrations to update the PostgreSQL schema.
*   **Role**: It ensures the database tables match your TypeScript code.

### 4. Querying (The Usage)
Finally, in your Express routes, you import `db` and perform operations.
```typescript
import { db } from './db';

// The ORM translates this JS code into a SQL query
const todos = await db.todo.where({ done: false });
```
*   **Role**: The ORM handles the complex SQL and returns clean, typed JavaScript objects.

---

## ⚖️ Orchid ORM vs. Rake DB

| Tool | Purpose | Primary Action |
| :--- | :--- | :--- |
| **Orchid ORM** | Runtime interaction | Querying, Inserting, Updating data in JS/TS. |
| **Rake DB** | Schema management | Creating tables, adding columns, running migrations. |

---

## ❓ Why did the "Pull" fail before?

- **`pull`** is a special feature of Rake DB. It looks at the **Database** and tries to generate **Code** for you.
- **Your flow** was **Code → Database**. For this, you should always go through **Migrations**.

> [!TIP]
> **Recommended Workflow**:
> 1. Update your Table Class (`todo.table.ts`).
> 2. Generate a migration (`npm run db -- g add_column_x`).
> 3. Write the change in the migration file.
> 4. Run `npm run db up`.
