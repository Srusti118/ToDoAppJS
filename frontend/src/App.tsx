import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GoogleLogin } from '@react-oauth/google'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from './orpc.ts'
import './index.css'

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

export default function App() {
    const [isLogin, setIsLogin] = useState(true)
    const [globalError, setGlobalError] = useState<string | null>(null)

    const queryClient = useQueryClient()

    const { data: user, isLoading: isAuthLoading } = useQuery({
        ...orpc.auth.me.queryOptions(),
        retry: false,
        staleTime: Infinity
    })

    const userId = user?.id

    const { data: todos = [] } = useQuery({
        ...orpc.todos.list.queryOptions(),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5 // 5 mins
    })

    const loginMut = useMutation({
        ...orpc.auth.login.mutationOptions(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orpc.auth.me.key() })
            setGlobalError(null)
        },
        onError: (err: any) => setGlobalError(err.message || 'Login failed')
    })

    const registerMut = useMutation({
        ...orpc.auth.register.mutationOptions(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orpc.auth.me.key() })
            setGlobalError(null)
        },
        onError: (err: any) => setGlobalError(err.message || 'Registration failed')
    })

    const googleMut = useMutation({
        ...orpc.auth.google.mutationOptions(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orpc.auth.me.key() })
            setGlobalError(null)
        },
        onError: (err: any) => setGlobalError(err.message || 'Google Login Failed')
    })

    const logoutMut = useMutation({
        ...orpc.auth.logout.mutationOptions(),
        onSuccess: () => {
            queryClient.resetQueries({ queryKey: orpc.auth.me.key() })
            queryClient.resetQueries({ queryKey: orpc.todos.list.key() })
        }
    })

    const createTodoMut = useMutation({
        ...orpc.todos.create.mutationOptions(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.todos.list.key() }),
        onError: (err: any) => setGlobalError(err.message || 'Failed to save task')
    })

    const toggleMut = useMutation({
        ...orpc.todos.toggle.mutationOptions(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.todos.list.key() }),
        onError: (err: any) => setGlobalError(err.message || 'Failed to update task')
    })

    const deleteMut = useMutation({
        ...orpc.todos.delete.mutationOptions(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.todos.list.key() }),
        onError: (err: any) => setGlobalError(err.message || 'Failed to delete task')
    })

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: { text: '' }
    })

    const authForm = useForm<AuthSchemaType>({
        resolver: zodResolver(authSchema),
        defaultValues: { username: '', password: '' }
    })

    async function onAuthSubmit(data: AuthSchemaType) {
        setGlobalError(null)
        if (isLogin) {
            loginMut.mutate(data)
        } else {
            registerMut.mutate(data)
        }
    }

    async function handleGoogleSuccess(credentialResponse: any) {
        setGlobalError(null)
        googleMut.mutate({ credential: credentialResponse.credential })
    }

    async function onSubmit(data: FormSchemaType) {
        setGlobalError(null)
        createTodoMut.mutate(data, {
            onSuccess: () => reset()
        })
    }

    if (isAuthLoading) {
        return (
            <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
                <p style={{ color: '#666' }}>Loading...</p>
            </div>
        )
    }

    if (!userId) {
        return (
            <div className="page">
                <div className="card">
                    <h1>{isLogin ? 'Login' : 'Register'}</h1>

                    {globalError && (
                        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                            {globalError}
                        </div>
                    )}

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
                        <button type="submit" disabled={loginMut.isPending || registerMut.isPending || authForm.formState.isSubmitting}>
                            {loginMut.isPending || registerMut.isPending || authForm.formState.isSubmitting ? 'Please wait...' : (isLogin ? 'Login' : 'Signup')}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setGlobalError("Google Login Failed")}
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
                        <button onClick={() => logoutMut.mutate(undefined)} style={{ padding: '4px 8px', fontSize: '12px', background: '#eee', color: '#333' }}>
                            {logoutMut.isPending ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>
                </div>

                {globalError && (
                    <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                        {globalError}
                    </div>
                )}

                {/* Input area */}
                <form
                    className="input-row"
                    onSubmit={handleSubmit(onSubmit)}
                    style={{ flexDirection: 'column', gap: 0 }}
                    autoComplete="off"
                >
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <input
                            type="text"
                            placeholder="Enter a task..."
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            {...register('text')}
                        />
                        <button type="submit" disabled={createTodoMut.isPending}>
                            {createTodoMut.isPending ? '...' : 'Save'}
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
                    {todos.map((todo: Todo) => (
                        <li key={todo.id} className={todo.done ? 'done' : ''}>
                            <input
                                type="checkbox"
                                checked={todo.done}
                                disabled={toggleMut.isPending && toggleMut.variables?.id === todo.id}
                                onChange={() => toggleMut.mutate({ id: todo.id })}
                            />
                            <span>{todo.text}</span>
                            <button className="delete-btn" disabled={deleteMut.isPending && deleteMut.variables?.id === todo.id} onClick={() => deleteMut.mutate({ id: todo.id })}>✕</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
