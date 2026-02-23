import express, { Request, Response } from 'express'
import cors from 'cors'
import { pool, initDB } from './db.js'

// Shape of a todo row from the database
interface Todo {
    id: number
    text: string
    done: boolean
}

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL || '*'
}))

app.use(express.json())

// GET all todos
app.get('/api/todos', async (_req: Request, res: Response) => {
    const result = await pool.query<Todo>('SELECT * FROM todos ORDER BY id ASC')
    res.json(result.rows)
})

// POST — add a new todo
app.post('/api/todos', async (req: Request, res: Response) => {
    const { text } = req.body as { text?: string }
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'text is required' })
    }
    const result = await pool.query<Todo>(
        'INSERT INTO todos (text, done) VALUES ($1, false) RETURNING *',
        [text.trim()]
    )
    res.status(201).json(result.rows[0])
})

// PATCH — toggle done
app.patch('/api/todos/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const result = await pool.query<Todo>(
        'UPDATE todos SET done = NOT done WHERE id = $1 RETURNING *',
        [id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
})

// DELETE — remove a todo
app.delete('/api/todos/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const result = await pool.query<Todo>(
        'DELETE FROM todos WHERE id = $1 RETURNING *',
        [id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
})

const PORT = process.env.PORT || 3001

// Start server only after DB is ready
initDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
    })
    .catch((err: Error) => {
        console.error('❌ Failed to connect to database:', err.message)
        process.exit(1)
    })
