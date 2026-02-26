import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import './index.css'

import { orpc } from './lib/orpc'

// Shape of a Todo is now inferred from the AppRouter types

const formSchema = z.object({
    text: z.string().trim().min(1, 'Task cannot be empty')
})

type FormSchemaType = z.infer<typeof formSchema>

// The orpc client already knows the API URL from its configuration

export default function App() {
    const [todos, setTodos] = useState<any[]>([]) // Using any[] temporarily, but it will be typed by orpc result

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormSchemaType>({
        resolver: zodResolver(formSchema),
        defaultValues: { text: '' }
    })

    // Load todos from backend on mount , only executed on refreshing the page
    useEffect(() => {
        orpc.listTodos()
            .then((data) => setTodos(data))
            .catch(() => alert('Could not reach the server. Is it running?'))
    }, [])

    async function onSubmit(data: FormSchemaType) {
        const { text } = data
        try {
            const newTodo = await orpc.createTodo({ text })
            setTodos([...todos, newTodo])
            reset()
        } catch (error: any) {
            alert(error.message || 'Failed to save task')
        }
    }

    //checks against the already ticked task
    async function toggleDone(id: number) {
        try {
            const updated = await orpc.toggleTodo({ id })
            setTodos(todos.map(t => t.id === id ? updated : t))
        } catch (error: any) {
            alert(error.message || 'Failed to toggle task')
        }
    }

    //added delete button --> to remove the to do
    async function handleDelete(id: number) {
        try {
            await orpc.deleteTodo({ id })
            setTodos(todos.filter(t => t.id !== id))
        } catch (error: any) {
            alert(error.message || 'Failed to delete task')
        }
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
