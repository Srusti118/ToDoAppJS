import { change } from '../script.js';

change(async (db) => {
  await db.changeTable('todos', (t) => ({

  }));
});
