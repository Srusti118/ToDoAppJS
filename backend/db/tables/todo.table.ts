import { BaseTable, sql } from '../baseTable.js';

export class TodoTable extends BaseTable {
    readonly table = 'todos';
    columns = this.setColumns((t) => ({
        id: t.identity().primaryKey(),
        userId: t.integer().foreignKey('users', 'id').index().nullable(),
        text: t.text(),
        done: t.boolean().default(false),
        timestamp: t.timestamp().default(sql`now()`),
    }));
}
