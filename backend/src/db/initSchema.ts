import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

async function run() {
    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL provided, skipping schema initialization.");
        return;
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    try {
        const client = await pool.connect();
        await client.query('CREATE SCHEMA IF NOT EXISTS public;');
        client.release();
        console.log('Schema public initialized successfully.');
    } catch (e) {
        console.error('Error initializing schema:', e);
    } finally {
        await pool.end();
    }
}

run();
