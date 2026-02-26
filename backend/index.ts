import express, { Request, Response } from 'express'
import cors from 'cors'
import { z } from 'zod'
import { db, initDB } from './db/index.js'
import { sql } from './db/baseTable.js'

const app = express()

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
    origin: process.env.FRONTEND_URL || '*'
}))

app.use(express.json())

// AUTH ROUTES
app.post('/api/register', async (req: Request, res: Response) => {
    const parseResult = authSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message })
    }
    const { username, password } = parseResult.data;
    try {
        const user = await db.user.create({ username, password }).selectAll()
        res.status(201).json(user)
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
    res.json(user)
})

// GET all todos (filtered by userId)
app.get('/api/todos', async (req: Request, res: Response) => {
    const userId = Number(req.headers['x-user-id'])
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const todos = await db.todo.where({ userId }).order({ id: 'ASC' })
    res.json(todos)
})

// POST — add a new todo
app.post('/api/todos', async (req: Request, res: Response) => {
    const userId = Number(req.headers['x-user-id'])
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const parseResult = createTodoSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.issues[0].message })
    }
    const { text } = parseResult.data;
    const todo = await db.todo.create({ text, userId }).selectAll()
    res.status(201).json(todo)
})

// PATCH — toggle done
app.patch('/api/todos/:id', async (req: Request, res: Response) => {
    const userId = Number(req.headers['x-user-id'])
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

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
app.delete('/api/todos/:id', async (req: Request, res: Response) => {
    const userId = Number(req.headers['x-user-id'])
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

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
