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
    const [userId, setUserId] = useState<number | null>(() => {
        const saved = localStorage.getItem('userId')
        return saved ? Number(saved) : null
    })
    const [todos, setTodos] = useState<Todo[]>([])
    const [isLogin, setIsLogin] = useState(true)

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: { text: '' }
    })

    const authForm = useForm({
        defaultValues: { username: '', password: '' }
    })

    // Load todos from backend
    useEffect(() => {
        if (userId) {
            fetch(`${API}/api/todos`, {
                headers: { 'x-user-id': userId.toString() }
            })
                .then(r => r.json())
                .then((data: Todo[]) => {
                    if (Array.isArray(data)) setTodos(data)
                })
                .catch(() => alert('Could not reach the server.'))
        } else {
            setTodos([])
        }
    }, [userId])

    async function onAuthSubmit(data: any) {
        const path = isLogin ? '/api/login' : '/api/register'
        const res = await fetch(`${API}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })

        if (!res.ok) {
            alert('Auth failed')
            return
        }

        const user = await res.json()
        setUserId(user.id)
        localStorage.setItem('userId', user.id.toString())
    }

    async function onSubmit(data: FormSchemaType) {
        if (!userId) return
        const res = await fetch(`${API}/api/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId.toString()
            },
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            alert('Failed to save task')
            return
        }

        const newTodoRes = await res.json()
        const newTodo = Array.isArray(newTodoRes) ? newTodoRes[0] : newTodoRes;

        setTodos([...todos, newTodo])
        reset()
    }

    async function toggleDone(id: number) {
        if (!userId) return

        // Optimistic UI update (optional, but good for responsiveness):
        // setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))

        const res = await fetch(`${API}/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'x-user-id': userId.toString() }
        })
        const updated: Todo[] = await res.json()

        // The backend returns an array from .selectAll(), so we take the first item
        const updatedTodo = Array.isArray(updated) ? updated[0] : updated;

        setTodos(todos.map(t => t.id === id ? { ...t, ...updatedTodo } : t))
    }

    async function handleDelete(id: number) {
        if (!userId) return
        await fetch(`${API}/api/todos/${id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': userId.toString() }
        })
        setTodos(todos.filter(t => t.id !== id))
    }

    function logout() {
        setUserId(null)
        localStorage.removeItem('userId')
    }

    if (!userId) {
        return (
            <div className="page">
                <div className="card">
                    <h1>{isLogin ? 'Login' : 'Register'}</h1>
                    <form className="input-row" style={{ flexDirection: 'column', gap: '10px' }} onSubmit={authForm.handleSubmit(onAuthSubmit)}>
                        <input type="text" placeholder="Username" {...authForm.register('username')} required />
                        <input type="password" placeholder="Password" {...authForm.register('password')} required />
                        <button type="submit">{isLogin ? 'Login' : 'Signup'}</button>
                    </form>
                    <p style={{ marginTop: '15px', textAlign: 'center', cursor: 'pointer', color: '#666' }} onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Need an account? Register" : "Have an account? Login"}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>My To-Do List</h1>
                    <button onClick={logout} style={{ padding: '4px 8px', fontSize: '12px', background: '#eee', color: '#333' }}>Logout</button>
                </div>

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
