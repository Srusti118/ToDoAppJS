import { BaseTable } from '../baseTable.js';

export class TodoTable extends BaseTable {
    readonly table = 'todos';
    columns = (this as any).setColumns((t: any) => ({
        id: t.identity().primaryKey(),
        userId: t.integer().foreignKey('users', 'id').index().nullable(),
        text: t.text(),
        done: t.boolean().default(false),
        timestamp: t.timestamps(),
    }));
}
