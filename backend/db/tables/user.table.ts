import { BaseTable } from '../baseTable.js';

export class UserTable extends BaseTable {
    readonly table = 'users';
    columns = (this as any).setColumns((t: any) => ({
        id: t.identity().primaryKey(),
        username: t.text().unique(),
        password: t.text().nullable(),
        googleId: t.text().unique().nullable(),
        email: t.text().unique().nullable(),
    }));
}
