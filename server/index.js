import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())

// In-memory array — all todos live here
let todos = []
let nextId = 1

// GET all todos
app.get('/api/todos', (req, res) => {
    res.json(todos)
})

// POST — add a new todo
app.post('/api/todos', (req, res) => {
    const { text } = req.body
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'text is required' })
    }
    const todo = { id: nextId++, text: text.trim(), done: false }
    todos.push(todo)
    res.status(201).json(todo)
})

// PATCH — toggle done
app.patch('/api/todos/:id', (req, res) => {
    const id = Number(req.params.id)
    const todo = todos.find(t => t.id === id)
    if (!todo) return res.status(404).json({ error: 'Not found' })
    todo.done = !todo.done
    res.json(todo)
})

// DELETE — remove a todo
app.delete('/api/todos/:id', (req, res) => {
    const id = Number(req.params.id)
    const index = todos.findIndex(t => t.id === id)
    if (index === -1) return res.status(404).json({ error: 'Not found' })
    todos.splice(index, 1)
    res.json({ message: 'Deleted' })
})

// Serve built React frontend (for production on Render)
app.use(express.static(path.join(__dirname, '..', 'dist')))

// All non-API routes → send the React app
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
