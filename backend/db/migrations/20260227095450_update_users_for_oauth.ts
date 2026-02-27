import { change } from '../script.js';

change(async (db) => {
    await db.changeTable('users', (t) => ({
        password: t.change(t.text(), t.text().nullable()),
        googleId: t.add(t.text().nullable()),
        email: t.add(t.text().nullable()),
    }));
});
