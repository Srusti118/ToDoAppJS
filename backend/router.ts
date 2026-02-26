import { implement } from '@orpc/server'
import { router as contract } from 'shared/contract.js'
import { db } from './db/index.js'
import { sql } from './db/baseTable.js'

const i = implement(contract)

export const router = {
    listTodos: i.listTodos.handler(async () => {
        return await db.todo.select('id', 'text', 'done').order({ id: 'ASC' })
    }),

    createTodo: i.createTodo.handler(async ({ input }) => {
        return await db.todo.create({ text: input.text }).select('id', 'text', 'done')
    }),

    toggleTodo: i.toggleTodo.handler(async ({ input }) => {
        const todo = await db.todo.find(input.id).update({
            done: sql`NOT done`.type(t => t.boolean()) as any
        }).select('id', 'text', 'done')
        if (!todo) throw new Error('Not found')
        return todo
    }),

    deleteTodo: i.deleteTodo.handler(async ({ input }) => {
        const deletedCount = await db.todo.find(input.id).delete()
        if (deletedCount === 0) throw new Error('Not found')
        return { message: 'Deleted' }
    }),
}

export type AppRouter = typeof router
