import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Connection pool — reuses connections efficiently
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

// Create the todos table if it doesn't exist yet
const initDB = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
            id   SERIAL PRIMARY KEY,
            text TEXT    NOT NULL,
            done BOOLEAN NOT NULL DEFAULT false
        )
    `)
    console.log('✅ Database ready — todos table exists')
}

export { pool, initDB }
