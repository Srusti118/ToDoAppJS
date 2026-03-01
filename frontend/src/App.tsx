import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GoogleLogin } from '@react-oauth/google'
import axios from 'axios'
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

const authSchema = z.object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters')
})

type AuthSchemaType = z.infer<typeof authSchema>

// In development: uses proxy (localhost:3001)
// In production (Vercel): uses the Render backend URL from env variable
const API = import.meta.env.VITE_API_URL || ''

export default function App() {
    const [userId, setUserId] = useState<number | null>(null)
    const [todos, setTodos] = useState<Todo[]>([])
    const [isLogin, setIsLogin] = useState(true)
    const [crashReact, setCrashReact] = useState(false)

    if (crashReact) {
        throw new Error("Sentry Frontend Error Test!");
    }

    // Setup axios instance for cookie handling
    const api = axios.create({
        baseURL: API,
        withCredentials: true
    })

    const { register, handleSubmit, reset, formState: { errors, isSubmitting: isTodoSubmitting } } = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: { text: '' }
    })

    const authForm = useForm<AuthSchemaType>({
        resolver: zodResolver(authSchema),
        defaultValues: { username: '', password: '' }
    })

    // Check if user is logged in natively via auth_token on load
    useEffect(() => {
        api.get('/api/auth/me')
            .then(res => setUserId(res.data.id))
            .catch(() => setUserId(null))
    }, [])

    // Load todos from backend
    useEffect(() => {
        if (userId) {
            api.get('/api/todos')
                .then(res => {
                    if (Array.isArray(res.data)) setTodos(res.data)
                })
                .catch(() => alert('Could not reach the server.'))
        } else {
            setTodos([])
        }
    }, [userId])

    async function onAuthSubmit(data: AuthSchemaType) {
        const path = isLogin ? '/api/login' : '/api/register'
        try {
            const res = await api.post(path, data)
            setUserId(res.data.id)
        } catch (err) {
            alert('Auth failed')
        }
    }

    async function handleGoogleSuccess(credentialResponse: any) {
        try {
            const res = await api.post('/api/auth/google', {
                credential: credentialResponse.credential
            })
            setUserId(res.data.id)
        } catch (err) {
            alert('Google Login Failed')
        }
    }

    async function onSubmit(data: FormSchemaType) {
        if (!userId) return
        try {
            const res = await api.post('/api/todos', data)
            const newTodo = Array.isArray(res.data) ? res.data[0] : res.data;
            setTodos([...todos, newTodo])
            reset()
        } catch (err) {
            alert('Failed to save task')
        }
    }

    async function toggleDone(id: number) {
        if (!userId) return

        try {
            const res = await api.patch(`/api/todos/${id}`)
            const updatedTodo = Array.isArray(res.data) ? res.data[0] : res.data;
            setTodos(todos.map(t => t.id === id ? { ...t, ...updatedTodo } : t))
        } catch (e) {
            alert('Failed to update task')
        }
    }

    async function handleDelete(id: number) {
        if (!userId) return
        try {
            await api.delete(`/api/todos/${id}`)
            setTodos(todos.filter(t => t.id !== id))
        } catch (e) {
            console.error('Failed to delete task')
        }
    }

    async function logout() {
        try {
            await api.post('/api/auth/logout')
        } finally {
            setUserId(null)
        }
    }

    if (!userId) {
        return (
            <div className="page">
                <div className="card">
                    <h1>{isLogin ? 'Login' : 'Register'}</h1>
                    <form className="input-row" style={{ flexDirection: 'column', gap: '10px' }} onSubmit={authForm.handleSubmit(onAuthSubmit)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'flex-start' }}>
                            <input type="text" placeholder="Username" {...authForm.register('username')} style={{ width: '100%' }} />
                            {authForm.formState.errors.username && (
                                <span style={{ color: '#d32f2f', fontSize: '13px', marginLeft: '2px' }}>
                                    {authForm.formState.errors.username.message}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'flex-start' }}>
                            <input type="password" placeholder="Password" {...authForm.register('password')} style={{ width: '100%' }} />
                            {authForm.formState.errors.password && (
                                <span style={{ color: '#d32f2f', fontSize: '13px', marginLeft: '2px' }}>
                                    {authForm.formState.errors.password.message}
                                </span>
                            )}
                        </div>
                        <button type="submit" disabled={authForm.formState.isSubmitting}>
                            {authForm.formState.isSubmitting ? 'Please wait...' : (isLogin ? 'Login' : 'Signup')}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => alert("Google Login Failed")}
                            useOneTap
                        />
                    </div>

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
                    <div>
                        <button onClick={() => setCrashReact(true)} style={{ padding: '4px 8px', fontSize: '12px', background: '#e53935', color: 'white', marginRight: '8px' }}>Test Error</button>
                        <button onClick={logout} style={{ padding: '4px 8px', fontSize: '12px', background: '#eee', color: '#333' }}>Logout</button>
                    </div>
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
                        <button type="submit" disabled={isTodoSubmitting}>
                            {isTodoSubmitting ? '...' : 'Save'}
                        </button>
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
