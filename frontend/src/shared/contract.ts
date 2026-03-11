import { oc } from '@orpc/contract'
import { z } from 'zod'

// Define a context type which includes the userId if authenticated
export type ORPCContext = {
    userId?: number;
    res?: any; // To set cookies
}

// Common schemas
export const authSchema = z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters'),
    password: z.string().trim().min(6, 'Password must be at least 6 characters')
})

export const createTodoSchema = z.object({
    text: z.string({ message: 'text is required' }).trim().min(1, 'text is required')
})

export const idParamSchema = z.object({
    id: z.coerce.number().int().positive()
})

const todoOutputSchema = z.object({
    id: z.number(),
    text: z.string(),
    done: z.boolean(),
    userId: z.number()
})

const userOutputSchema = z.object({
    id: z.number(),
    username: z.string(),
    email: z.string().nullish(),
    googleId: z.string().nullish(),
    token: z.string().optional()
})

export const googleAuthSchema = z.object({ credential: z.string() })

export const authContract = oc.router({
    register: oc.input(authSchema).output(userOutputSchema),
    login: oc.input(authSchema).output(userOutputSchema),
    logout: oc.output(z.object({ message: z.string() })),
    me: oc.output(userOutputSchema),
    google: oc.input(z.object({ credential: z.string() })).output(userOutputSchema)
})

export const todosContract = oc.router({
    list: oc.output(z.array(todoOutputSchema)),
    create: oc.input(createTodoSchema).output(todoOutputSchema),
    toggle: oc.input(idParamSchema).output(todoOutputSchema),
    delete: oc.input(idParamSchema).output(z.object({ message: z.string() }))
})

export const appContract = oc.router({
    auth: authContract,
    todos: todosContract
})

export type AppContract = typeof appContract
