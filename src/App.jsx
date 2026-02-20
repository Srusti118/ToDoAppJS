import { useState } from 'react'
import './index.css'

export default function App() {
  const [input, setInput] = useState('')
  const [todos, setTodos] = useState([])

  function handleSave() {
    const text = input.trim()
    if (!text) return
    setTodos([...todos, { id: Date.now(), text, done: false }])
    setInput('')
  }

  function toggleDone(id) {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  return (

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
          </li>
        ))}
      </ul>
    </div>

  )
}
