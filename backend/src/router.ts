import { os, ORPCError } from '@orpc/server'
import { db } from '../db/index.js'
import { sql } from '../db/baseTable.js'
import jwt from 'jsonwebtoken'
import {
    ORPCContext,
    authSchema,
    createTodoSchema,
    idParamSchema,
    googleAuthSchema,
    authContract,
    todosContract
} from './contract.js'
import { z } from 'zod'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

// Common context instance
const pub = os.$context<ORPCContext>().use(async ({ next, path, context }) => {
    console.log(`[ORPC] Procedure Hit: ${path.join('.')}`);
    try {
        const result = await next();
        return result;
    } catch (e: any) {
        // Safe serialization of error for logging
        const serializedError = {
            message: e.message,
            code: e.code,
            status: e.status,
            data: e.data,
            stack: e.stack
        };
        console.error(`[ORPC Error] ${path.join('.')}:`, JSON.stringify(serializedError, null, 2));
        throw e;
    }
})

// Protected middleware
const protectedRoute = pub.use(async ({ next, context }) => {
    if (!context.userId) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Unauthorized' })
    }
    return next({ context: { ...context, userId: context.userId as number } })
})

export const appRouter = os.router({
    auth: {
        register: pub
            .input(authSchema)
            .handler(async ({ input, context }) => {
                const { username, password } = input;
                console.log(`[Auth Trace] Starting registration for: ${username}`);
                try {
                    console.log(`[Auth Trace] Calling db.user.create...`);
                    const userArr = await db.user.create({ username, password }).selectAll()
                    console.log(`[Auth Trace] db.user.create raw:`, JSON.stringify(userArr, null, 2));
                    const user = Array.isArray(userArr) ? userArr[0] : userArr;
                    console.log(`[Auth Trace] Selected user:`, JSON.stringify(user, null, 2));

                    console.log(`[Auth Trace] Signing JWT for userId: ${user?.id}`);
                    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

                    /* 
                    if (context.res && context.res.cookie) {
                        console.log(`[Auth Trace] Setting cookie...`);
                        context.res.cookie('auth_token', token, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                        });
                    }
                    */

                    const { password: _, ...userWithoutPassword } = user;
                    const finalResponse = { ...userWithoutPassword, token };
                    console.log(`[Auth Trace] Final Registration Response:`, JSON.stringify(finalResponse, null, 2));
                    return finalResponse as any;
                } catch (e: any) {
                    console.error(`[Auth Trace] Error in register:`, e);
                    throw new ORPCError('CONFLICT', { message: 'Username taken or error' })
                }
            }),

        login: pub
            .input(authSchema)
            .handler(async ({ input, context }) => {
                const { username, password } = input;
                console.log(`[Auth] Login attempt for: ${username}`);
                const user = await db.user.where({ username, password }).takeOptional()
                console.log(`[Auth] User found:`, JSON.stringify(user, null, 2));

                if (!user) {
                    console.warn(`[Auth] Login failed (invalid credentials) for: ${username}`);
                    throw new ORPCError('UNAUTHORIZED', { message: 'Invalid credentials' })
                }

                const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

                /*
                if (context.res && context.res.cookie) {
                    context.res.cookie('auth_token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                    });
                }
                */

                const { password: _, ...userWithoutPassword } = user;
                const finalResponse = { ...userWithoutPassword, token };
                console.log(`[Auth] Login result:`, JSON.stringify(finalResponse, null, 2));
                return finalResponse as any;
            }),

        logout: pub.handler(async ({ context }) => {
            console.log(`[Auth] Logout attempt`);
            /*
            if (context.res && context.res.clearCookie) {
                context.res.clearCookie('auth_token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                });
            }
            */
            return { message: 'Logged out successfully' };
        }),

        me: protectedRoute.handler(async ({ context }) => {
            console.log(`[Auth] me query for userId: ${context.userId}`);
            const user = await db.user.where({ id: context.userId }).takeOptional();
            if (!user) {
                console.error(`[Auth] me query: User ${context.userId} not found in DB`);
                throw new ORPCError('NOT_FOUND', { message: 'User not found' });
            }
            const { password: _, ...userWithoutPassword } = user;
            console.log(`[Auth] me result:`, JSON.stringify(userWithoutPassword, null, 2));
            return userWithoutPassword as any;
        }),

        google: pub
            .input(googleAuthSchema)
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
                    await (db.user as any).where({ id: user.id }).update({ googleId });
                }

                const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

                /*
                if (context.res && context.res.cookie) {
                    context.res.cookie('auth_token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                    });
                }
                */

                const { password: _, ...userWithoutPassword } = user;
                return { ...userWithoutPassword, token } as any;
            })
    },

    todos: {
        list: protectedRoute.handler(async ({ context }) => {
            const userId = context.userId;
            const todos = await db.todo.where({ userId }).order({ id: 'ASC' })
            return todos as any
        }),

        create: protectedRoute
            .input(createTodoSchema)
            .handler(async ({ input, context }) => {
                const userId = context.userId!;
                const { text } = input;
                const todo = await db.todo.create({ text, userId }).selectAll()
                const result = Array.isArray(todo) ? todo[0] : todo
                return result as any
            }),

        toggle: protectedRoute
            .input(idParamSchema)
            .handler(async ({ input, context }) => {
                const userId = context.userId!;
                const { id } = input;
                const todo = await (db.todo as any).where({ id, userId }).update({
                    done: (sql as any)`NOT "done"`.type((t: any) => t.boolean()) as any
                }).selectAll()
                if (!todo) throw new ORPCError('NOT_FOUND', { message: 'Not found' })
                const result = Array.isArray(todo) ? todo[0] : todo
                return result as any
            }),

        delete: protectedRoute
            .input(idParamSchema)
            .handler(async ({ input, context }) => {
                const userId = context.userId!;
                const { id } = input;
                const deletedCount = await (db.todo as any).where({ id, userId }).delete()
                if (deletedCount === 0) throw new ORPCError('NOT_FOUND', { message: 'Not found' })
                return { message: 'Deleted' }
            })
    }
})

export type AppRouter = typeof appRouter
