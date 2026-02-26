import { orchidORM } from 'orchid-orm/node-postgres';
import { TodoTable } from './tables/todo.table.js';
import { UserTable } from './tables/user.table.js';
import dotenv from 'dotenv';

dotenv.config();

export const db = orchidORM(
    {
        databaseURL: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    {
        todo: TodoTable as any,
        user: UserTable as any,
    }
);

// We still keep a way to initialize the DB if needed, 
// though Orchid ORM usually uses migrations.
export const initDB = async () => {
    // Orchid ORM doesn't strictly need this manual init check if we use migrations,
    // but we can leave it for compatibility or just trust our models match the DB.
    console.log('✅ Orchid ORM initialized with todos table');
};
