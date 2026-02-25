import express from 'express'
import cors from 'cors'
import { pool, initDB } from './db.js'

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL || '*'
}))

app.use(express.json())

// GET all todos
app.get('/api/todos', async (req, res) => {
    const result = await pool.query('SELECT * FROM todos ORDER BY id ASC')
    res.json(result.rows)
})

// POST — add a new todo
app.post('/api/todos', async (req, res) => {
    const { text } = req.body
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'text is required' })
    }
    const result = await pool.query(
        'INSERT INTO todos (text, done) VALUES ($1, false) RETURNING *',
        [text.trim()]
    )
    res.status(201).json(result.rows[0])
})

// PATCH — toggle done
app.patch('/api/todos/:id', async (req, res) => {
    const id = Number(req.params.id)
    const result = await pool.query(
        'UPDATE todos SET done = NOT done WHERE id = $1 RETURNING *',
        [id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
})

// DELETE — remove a todo
app.delete('/api/todos/:id', async (req, res) => {
    const id = Number(req.params.id)
    const result = await pool.query(
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
    .catch((err) => {
        console.error('❌ Failed to connect to database:', err.message)
        process.exit(1)
    })