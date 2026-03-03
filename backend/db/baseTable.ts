import { createBaseTable, makeColumnTypes, defaultSchemaConfig } from 'orchid-orm';

export const BaseTable = createBaseTable({
    columnTypes: makeColumnTypes(defaultSchemaConfig),
});

export const { sql } = BaseTable;
