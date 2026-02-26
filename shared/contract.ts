import { os } from '@orpc/server'
import { z } from 'zod'

export const TodoSchema = z.object({
    id: z.number(),
    text: z.string(),
    done: z.boolean(),
})

export const router = {
    listTodos: os
        .output(z.array(TodoSchema))
        .handler(async () => {
            // Logic handled in router.ts implementation
            return []
        }),

    createTodo: os
        .input(z.object({ text: z.string().min(1) }))
        .output(TodoSchema)
        .handler(async () => {
            // Logic handled in router.ts implementation
            return {} as any
        }),

    toggleTodo: os
        .input(z.object({ id: z.number().int().positive() }))
        .output(TodoSchema)
        .handler(async () => {
            // Logic handled in router.ts implementation
            return {} as any
        }),

    deleteTodo: os
        .input(z.object({ id: z.number().int().positive() }))
        .output(z.object({ message: z.string() }))
        .handler(async () => {
            // Logic handled in router.ts implementation
            return { message: 'Deleted' }
        }),
}
