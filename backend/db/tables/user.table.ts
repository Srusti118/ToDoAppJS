import { BaseTable } from '../baseTable.js';

export class UserTable extends BaseTable {
    readonly table = 'users';
    columns = this.setColumns((t) => ({
        id: t.identity().primaryKey(),
        username: t.text().unique(),
        password: t.text().nullable(),
        googleId: t.text().nullable(),
        email: t.text().nullable(),
    }));
}
