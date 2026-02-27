import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.DATABASE_URL;

const pool = new pg.Pool({
    connectionString: url,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function run() {
    try {
        console.log("Connecting to Database:", url);
        const client = await pool.connect();

        console.log("Altering the 'users' table to support Google OAuth...");

        // 1. Make the password column nullable
        await client.query('ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;');
        console.log("Password column made nullable.");

        // 2. Add email column (if it doesn't exist)
        await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;');
        console.log("Email column added.");

        // 3. Add googleId column (if it doesn't exist)
        await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" text;');
        console.log("Google ID column added.");

        console.log("Schema alterations completed successfully.");
        client.release();
    } catch (e) {
        console.error("Error modifying DB:", e);
    } finally {
        await pool.end();
    }
}

run();
