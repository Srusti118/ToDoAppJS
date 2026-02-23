import { useState, useEffect } from 'react'
import './index.css'

// Shape of a todo item returned from the backend
interface Todo {
    id: number
    text: string
    done: boolean
}

// In development: uses proxy (localhost:3001)
// In production (Vercel): uses the Render backend URL from env variable
const API = import.meta.env.VITE_API_URL || ''

export default function App() {
    const [input, setInput] = useState<string>('')
    const [todos, setTodos] = useState<Todo[]>([])

    // Load todos from backend on mount , only executed on refreshing the page
    useEffect(() => {
        fetch(`${API}/api/todos`)
            .then(r => r.json())
            .then((data: Todo[]) => setTodos(data))
            .catch(() => alert('Could not reach the server. Is it running?'))
    }, [])

    async function handleSave() {
        const text = input.trim()
        if (!text) return
        const res = await fetch(`${API}/api/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })
        const newTodo: Todo = await res.json()
        setTodos([...todos, newTodo])
        setInput('')
    }

    //checks against the already ticked task
    async function toggleDone(id: number) {
        const res = await fetch(`${API}/api/todos/${id}`, { method: 'PATCH' })
        const updated: Todo = await res.json()
        setTodos(todos.map(t => t.id === id ? updated : t))
    }

    //added delete button --> to remove the to do
    async function handleDelete(id: number) {
        await fetch(`${API}/api/todos/${id}`, { method: 'DELETE' })
        setTodos(todos.filter(t => t.id !== id))
    }

    return (
        <div className="page">
            <div className="card">
                <h1>My To-Do List</h1>

                {/* Input area */}
                <div className="input-row">
                    <input
                        type="text"
                        placeholder="Enter a task..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                    <button onClick={handleSave}>Save</button>
                </div>

                {/* Task list */}
                <ul className="task-list">
                    {todos.length === 0 && (
                        <p className="empty">No tasks yet. Add one above!</p>
                    )}
                    {todos.map(todo => (
                        <li key={todo.id} className={todo.done ? 'done' : ''}>
                            <input
                                type="checkbox"
                                checked={todo.done}
                                onChange={() => toggleDone(todo.id)}
                            />
                            <span>{todo.text}</span>
                            <button className="delete-btn" onClick={() => handleDelete(todo.id)}>✕</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
