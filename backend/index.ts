import express, { Request, Response } from 'express'
import cors from 'cors'
import { z } from 'zod'
import { db, initDB } from './db/index.js'
import { sql } from './db/baseTable.js'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { authenticateUser } from './src/middleware/auth.js'

const app = express()

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const createTodoSchema = z.object({
    text: z.string({ message: 'text is required' }).trim().min(1, 'text is required')
})

const idParamSchema = z.object({
    id: z.coerce.number().int().positive()
})

const authSchema = z.object({
    username: z.string().trim().min(1, 'username is required'),
    password: z.string().trim().min(1, 'password is required')
})

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

// AUTH ROUTES
app.post('/api/register', async (req: Request, res: Response) => {
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message })
    }
    const { username, password } = parseResult.data;
    try {
        const user = await db.user.create({ username, password }).selectAll()
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword)
    } catch (e: any) {
        res.status(400).json({ error: 'Username taken or error' })
    }
})

app.post('/api/login', async (req: Request, res: Response) => {
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message })
    }
    const { username, password } = parseResult.data;
    const user = await db.user.where({ username, password }).takeOptional()
    if (!user) return res.status(401).json({ error: 'Invalid logic' })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword)
})

app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateUser, async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await db.user.where({ id: req.userId }).takeOptional();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

app.post('/api/auth/google', async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential missing' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token' });
        }

        const { email, sub: googleId, name, given_name } = payload;

        let user = await db.user.where({ email }).takeOptional()
            || await db.user.where({ googleId }).takeOptional();

        if (!user) {
            user = await db.user.create({
                username: `google_${googleId}`,
                email,
                googleId,
                password: null
            }).selectAll();
        } else if (!user.googleId) {
            // Link google account to existing email user
            await (db.user as any).where({ id: user.id }).update({ googleId });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err: any) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ error: 'Google authentication failed' });
    }
});

// GET all todos (filtered by userId)
app.get('/api/todos', authenticateUser, async (req: Request, res: Response) => {
    const userId = req.userId;

    const todos = await db.todo.where({ userId }).order({ id: 'ASC' })
    res.json(todos)
})

// POST — add a new todo
app.post('/api/todos', authenticateUser, async (req: Request, res: Response) => {
    const userId = req.userId!;

    const parseResult = createTodoSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message })
    }
    const { text } = parseResult.data;
    const todo = await db.todo.create({ text, userId }).selectAll()
    res.status(201).json(todo)
})

// PATCH — toggle done
app.patch('/api/todos/:id', authenticateUser, async (req: Request, res: Response) => {
    const userId = req.userId!;

    const parseResult = idParamSchema.safeParse(req.params);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid id parameter' });
    }
    const { id } = parseResult.data;
    const todo = await (db.todo as any).where({ id, userId }).update({
        done: sql`NOT done`.type(t => t.boolean()) as any
    }).selectAll()
    if (!todo) return res.status(404).json({ error: 'Not found' })
    res.json(todo)
})

// DELETE — remove a todo
app.delete('/api/todos/:id', authenticateUser, async (req: Request, res: Response) => {
    const userId = req.userId!;

    const parseResult = idParamSchema.safeParse(req.params);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid id parameter' });
    }
    const { id } = parseResult.data;
    const deletedCount = await (db.todo as any).where({ id, userId }).delete()
    if (deletedCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
})

const PORT = process.env.PORT || 3001

// Start server after DB init
initDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
    })
    .catch((err: Error) => {
        console.error('❌ Failed to connect to database:', err.message)
        process.exit(1)
    })
