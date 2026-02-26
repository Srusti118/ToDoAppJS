import pg from 'pg';

const url = "postgresql://tododb_prod_user:eE5u6blYEvryTtJwEj5Dlr4zXHH42v4e@dpg-d6dc7a4tgctc73f2606g-a.singapore-postgres.render.com/tododb_prod?ssl=true";

const pool = new pg.Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Connecting to Render DB...");
        const client = await pool.connect();

        console.log("Creating schema public if not exists...");
        await client.query('CREATE SCHEMA IF NOT EXISTS public;');

        console.log("Granting privileges on public schema...");
        await client.query('GRANT ALL ON SCHEMA public TO public;');
        await client.query('GRANT ALL ON SCHEMA public TO tododb_prod_user;');

        console.log("Creating user schema if not exists...");
        await client.query('CREATE SCHEMA IF NOT EXISTS tododb_prod_user;');
        await client.query('GRANT ALL ON SCHEMA tododb_prod_user TO tododb_prod_user;');

        console.log("Schemas fixed successfully.");
        client.release();
    } catch (e) {
        console.error("Error fixing DB:", e);
    } finally {
        await pool.end();
    }
}

run();
