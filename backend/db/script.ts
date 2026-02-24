import { rakeDb } from 'rake-db/node-postgres';
import { BaseTable } from './baseTable.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = rakeDb({
    databaseURL: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    baseTable: BaseTable,
    migrationsPath: resolve(__dirname, './migrations'),
    migrationId: 'timestamp',
    import: (path: string) => import(path),
} as any);

export const { change } = db;
