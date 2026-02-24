import { BaseTable } from '../baseTable.js';

export class TodoTable extends BaseTable {
    readonly table = 'todos';
    columns = this.setColumns((t) => ({
        id: t.identity().primaryKey(),
        text: t.text(),
        done: t.boolean().default(false),
    }));
}
