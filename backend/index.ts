import express, { Request, Response } from 'express'
import cors from 'cors'
import { db, initDB } from './db/index.js'
import { sql } from './db/baseTable.js'

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL || '*'
}))

app.use(express.json())

// GET all todos
app.get('/api/todos', async (_req: Request, res: Response) => {
    const todos = await db.todo.order({ id: 'ASC' })
    res.json(todos)
})

// POST — add a new todo
app.post('/api/todos', async (req: Request, res: Response) => {
    const { text } = req.body as { text?: string }
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'text is required' })
    }
    const todo = await db.todo.create({ text: text.trim() }).selectAll()
    res.status(201).json(todo)
})

// PATCH — toggle done
app.patch('/api/todos/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const todo = await (db.todo as any).find(id).update({
        done: sql`NOT done`.type(t => t.boolean()) as any
    }).selectAll()
    if (!todo) return res.status(404).json({ error: 'Not found' })
    res.json(todo)
})

// DELETE — remove a todo
app.delete('/api/todos/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const deletedCount = await (db.todo as any).find(id).delete()
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
