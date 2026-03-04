# System Architecture & Flows

This document outlines the core architecture and data flows of the ToDo application, highlighting our **Contract-First** approach using **oRPC** and **TanStack React Query**.

## 1. Contract-First Architecture
The foundation of the application is the **Shared Contract**. Instead of defining separate types for frontend and backend, we define a single source of truth.

- **The Contract (`contract.ts`):** Defines all procedures (API calls), their inputs (validated by Zod), and their outputs.
- **The Router (`router.ts`):** The backend implements these procedures. TypeScript ensures the implementation matches the contract.
- **The Client (`orpc.ts`):** The frontend generates a typed client from the contract. No manual fetching or type casting is required.

## 2. Authentication Flow (oRPC + JWT)
The application leverages Google OAuth for identity and issues JWTs stored in HTTP-only cookies.

```mermaid
sequenceDiagram
    participant User
    participant React UI
    participant oRPC Client
    participant Express Backend
    participant Postgres DB
    participant Google OAuth

    User->>React UI: Clicks "Sign in with Google"
    React UI->>Google OAuth: Requests credential
    Google OAuth-->>React UI: Returns Google ID Token
    React UI->>oRPC Client: auth.google({ credential })
    oRPC Client->>Express Backend: POST /api/auth/google
    Express Backend->>Google OAuth: Verifies Token
    Google OAuth-->>Express Backend: Valid (Email, GoogleId)
    
    alt User Exists?
        Express Backend->>Postgres DB: Queries User
    else User is New
        Express Backend->>Postgres DB: Creates User
    end

    Express Backend->>Express Backend: Generates JWT
    Express Backend-->>oRPC Client: Sets HTTP-Only Cookie + User Data
    oRPC Client-->>React UI: Typed User Object
    React UI->>User: Redirects to Dashboard
```

## 3. End-to-End Data Flow (React Query + oRPC)
This diagram shows how a "Create ToDo" action travels from the UI through React Query and oRPC to the database.

```mermaid
flowchart TD
    %% Frontend
    subgraph Frontend [React Application]
        UI[User Interface]
        RQ[TanStack React Query]
        ORPC[oRPC Client / Link]
    end

    %% Backend
    subgraph Backend [Node/Express Server]
        RPC_H[oRPC Handler]
        AuthMid[Auth Middleware]
        Router[oRPC Router]
    end

    %% Database
    subgraph Database Layer
        ORM[Orchid ORM]
        DB[(PostgreSQL)]
    end

    UI -->|Calls Mutation| RQ
    RQ -->|Triggers Procedure| ORPC
    ORPC -->|POST /api/todos/create| RPC_H
    
    RPC_H --> AuthMid
    AuthMid -->|Validates JWT Cookie| Router
    Router -->|Executes Implementation| ORPC_IMPL[Procedure Handler]
    ORPC_IMPL --> ORM
    
    ORM -->|Executes SQL| DB
    DB -->|Returns Row| ORM
    ORM -->|Returns Typed Object| ORPC_IMPL
    ORPC_IMPL --> RPC_H
    RPC_H --> ORPC
    ORPC -->|Updates Cache| RQ
    RQ --> UI
```

## 4. Database Schema
Managed via Orchid ORM.

```mermaid
erDiagram
    USER ||--o{ TODO : "owns"
    
    USER {
        int id PK
        string email "Unique"
        string username "Unique"
        string googleId "Optional, Unique"
        string password "Hashed, Optional"
        timestamp createdAt
        timestamp updatedAt
    }
    
    TODO {
        int id PK
        int userId FK
        string text
        boolean done "Default: false"
        timestamp createdAt
        timestamp updatedAt
    }
```

## 5. Progressive Web App (PWA) Architecture
Powered by `vite-plugin-pwa`.

- **Service Worker:** Automatically generated to cache the application shell and assets for rapid loading and offline resilience.
- **Web App Manifest:** Provides metadata (`TodoFlow`, icons, `standalone` mode) for device installation.
