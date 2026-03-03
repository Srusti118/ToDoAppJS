import { os, ORPCError } from '@orpc/server'
import { z } from 'zod'
import { db } from '../db/index.js'

import { sql } from '../db/baseTable.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

// Common schemas
const authSchema = z.object({
    username: z.string().trim().min(1, 'username is required'),
    password: z.string().trim().min(1, 'password is required')
})

const createTodoSchema = z.object({
    text: z.string({ message: 'text is required' }).trim().min(1, 'text is required')
})

const idParamSchema = z.object({
    id: z.coerce.number().int().positive()
})

// Define a context type which includes the userId if authenticated
export type ORPCContext = {
    userId?: number;
    res?: any; // To set cookies
}

// OS instance with context
const pub = os.$context<ORPCContext>()

// Protected middleware
const protectedRoute = pub.use(async ({ next, context }) => {
    if (!context.userId) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' })
    }
    return next({ context: { ...context, userId: context.userId } })
})

const authRouter = pub.router({
    register: pub
        .input(authSchema)
        .handler(async ({ input, context }) => {
            const { username, password } = input;
            try {
                const userArr = await db.user.create({ username, password }).selectAll()
                const user = Array.isArray(userArr) ? userArr[0] : userArr;
                const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

                if (context.res && context.res.cookie) {
                    context.res.cookie('auth_token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                    });
                }

                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            } catch (e: any) {
                throw new ORPCError('CONFLICT', { message: 'Username taken or error' })
            }
        }),

    login: pub
        .input(authSchema)
        .handler(async ({ input, context }) => {
            const { username, password } = input;
            const user = await db.user.where({ username, password }).takeOptional()
            if (!user) throw new ORPCError('UNAUTHORIZED', { message: 'Invalid credentials' })

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

            if (context.res && context.res.cookie) {
                context.res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
            }

            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }),

    logout: pub
        .handler(async ({ context }) => {
            if (context.res && context.res.clearCookie) {
                context.res.clearCookie('auth_token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                });
            }
            return { message: 'Logged out successfully' };
        }),

    me: protectedRoute
        .handler(async ({ context }) => {
            const user = await db.user.where({ id: context.userId }).takeOptional();
            if (!user) throw new ORPCError('NOT_FOUND', { message: 'User not found' });
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }),

    // Google Auth remains mostly an API endpoint since it requires googleAuthLibrary
    // We can keep it in Express or move to ORPC. Moving to ORPC:
    google: pub
        .input(z.object({ credential: z.string() }))
        .handler(async ({ input, context }) => {
            const { OAuth2Client } = await import('google-auth-library');
            const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

            const ticket = await googleClient.verifyIdToken({
                idToken: input.credential,
                audience: GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new ORPCError('UNAUTHORIZED', { message: 'Invalid Google token' });
            }

            const { email, sub: googleId } = payload;

            let user: any = await db.user.where({ email }).takeOptional()
                || await db.user.where({ googleId }).takeOptional();

            if (!user) {
                const userArr = await db.user.create({
                    username: `google_${googleId}`,
                    email,
                    googleId,
                    password: null
                }).selectAll();
                user = Array.isArray(userArr) ? userArr[0] : userArr;
            } else if (!user.googleId) {
                // Link google account to existing email user
                await (db.user as any).where({ id: user.id }).update({ googleId });
            }

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

            if (context.res && context.res.cookie) {
                context.res.cookie('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });
            }

            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        })
})

const todoOutputSchema = z.object({
    id: z.number(),
    text: z.string(),
    done: z.boolean(),
    userId: z.number()
})

const todosRouter = pub.router({
    list: protectedRoute
        .output(z.array(todoOutputSchema))
        .handler(async ({ context }) => {
            const userId = context.userId;
            const todos = await db.todo.where({ userId }).order({ id: 'ASC' })
            return todos as z.infer<typeof todoOutputSchema>[]
        }),

    create: protectedRoute
        .input(createTodoSchema)
        .output(todoOutputSchema)
        .handler(async ({ input, context }) => {
            const userId = context.userId!;
            const { text } = input;
            const todo = await db.todo.create({ text, userId }).selectAll()
            const result = Array.isArray(todo) ? todo[0] : todo
            return result as z.infer<typeof todoOutputSchema>
        }),

    toggle: protectedRoute
        .input(idParamSchema)
        .output(todoOutputSchema)
        .handler(async ({ input, context }) => {
            const userId = context.userId!;
            const { id } = input;
            const todo = await (db.todo as any).where({ id, userId }).update({
                done: sql`NOT done`.type(t => t.boolean()) as any
            }).selectAll()
            if (!todo) throw new ORPCError('NOT_FOUND', { message: 'Not found' })
            const result = Array.isArray(todo) ? todo[0] : todo
            return result as z.infer<typeof todoOutputSchema>
        }),

    delete: protectedRoute
        .input(idParamSchema)
        .handler(async ({ input, context }: { input: { id: number }, context: ORPCContext }) => {
            const userId = context.userId!;
            const { id } = input;
            const deletedCount = await (db.todo as any).where({ id, userId }).delete()
            if (deletedCount === 0) throw new ORPCError('NOT_FOUND', { message: 'Not found' })
            return { message: 'Deleted' }
        })
})

export const appRouter = pub.router({
    auth: authRouter,
    todos: todosRouter
})

export type AppRouter = typeof appRouter
