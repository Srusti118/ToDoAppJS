import { change } from '../script.js';

change(async (db) => {
  await db.createTable('users', (t) => ({
    id: t.identity().primaryKey(),
    username: t.text().unique(),
    password: t.text(),
  }));

  await db.changeTable('todos', (t) => ({
    userId: t.integer().foreignKey('users', 'id').index().nullable(),
  }));
});
