import { rakeDb } from 'rake-db/node-postgres';
import { BaseTable } from './baseTable.js';
import { TodoTable } from './tables/todo.table.js';
import { UserTable } from './tables/user.table.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbOptions = {
    databaseURL: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const db = rakeDb(
    {
        ...dbOptions,
        baseTable: BaseTable,
        migrationsPath: resolve(__dirname, './migrations'),
        tables: [TodoTable, UserTable],
        migrationId: 'timestamp',
        import: (path: string) => import(path),
    } as any
);

db.run(dbOptions);
