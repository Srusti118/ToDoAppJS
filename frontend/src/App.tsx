import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import './index.css'

// Shape of a todo item returned from the backend
interface Todo {
    id: number
    text: string
    done: boolean
}

const formSchema = z.object({
    text: z.string().trim().min(1, 'Task cannot be empty')
})

type FormSchemaType = z.infer<typeof formSchema>

// In development: uses proxy (localhost:3001)
// In production (Vercel): uses the Render backend URL from env variable
const API = import.meta.env.VITE_API_URL || ''

export default function App() {
    const [todos, setTodos] = useState<Todo[]>([])

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: { text: '' }
    })

    // Load todos from backend on mount , only executed on refreshing the page
    useEffect(() => {
        fetch(`${API}/api/todos`)
            .then(r => r.json())
            .then((data: Todo[]) => setTodos(data))
            .catch(() => alert('Could not reach the server. Is it running?'))
    }, [])

    async function onSubmit(data: FormSchemaType) {
        const { text } = data
        const res = await fetch(`${API}/api/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })

        if (!res.ok) {
            const errorData = await res.json()
            alert(errorData.error || 'Failed to save task')
            return
        }

        const newTodo: Todo = await res.json()
        setTodos([...todos, newTodo])
        reset()
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
                <form
                    className="input-row"
                    onSubmit={handleSubmit(onSubmit)}
                    style={{ flexDirection: 'column', gap: 0 }}
                >
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <input
                            type="text"
                            placeholder="Enter a task..."
                            {...register('text')}
                        />
                        <button type="submit">Save</button>
                    </div>
                    {errors.text && (
                        <span style={{ color: '#d32f2f', fontSize: '13px', marginTop: '6px', marginLeft: '2px' }}>
                            {errors.text.message}
                        </span>
                    )}
                </form>

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
