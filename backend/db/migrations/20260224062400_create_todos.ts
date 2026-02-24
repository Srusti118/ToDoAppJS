import { change } from '../script.js';

change(async (db) => {
  await db.createTable('todos', (t) => ({
    id: t.identity().primaryKey(),
    text: t.text(),
    done: t.boolean().default(false),
  }));
});
