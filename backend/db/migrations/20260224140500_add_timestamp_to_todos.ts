import { change } from '../script.js';

change(async (db) => {
    await db.changeTable('todos', (t) => ({
        timestamp: t.add(t.timestamp().default(t.sql`now()`)),
    }));
});
