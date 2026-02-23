import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Pool = a set of reusable database connections
// Instead of opening a new connection for every request, we reuse existing ones
// This is much faster for high-traffic apps
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,  // reads from .env file

    // ssl (Secure Socket Layer) — encrypts the connection between our server and the DB
    // In production (Render), we NEED ssl but must allow their self-signed cert
    // In development (local), no ssl is needed
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
})

// ─── TypeScript note ────────────────────────────────────────────────────────
// ": Promise<void>" is the RETURN TYPE annotation
//   Promise → because this is an async function (returns a promise)
//   void    → the promise resolves with nothing (we don't return a value)
// Without this, TypeScript would infer it, but being explicit is good practice
// ────────────────────────────────────────────────────────────────────────────
const initDB = async (): Promise<void> => {
    // Creates the table only if it doesn't already exist — safe to call on every startup
    await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
            id   SERIAL PRIMARY KEY,   -- auto-incrementing integer
            text TEXT    NOT NULL,     -- the task description
            done BOOLEAN NOT NULL DEFAULT false  -- starts unchecked
        )
    `)
    console.log('✅ Database ready — todos table exists')
}

export { pool, initDB }
