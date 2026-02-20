import { useState } from 'react'
import './index.css'

export default function App() {

    // updates the input field value 
    //  i/p -> old value , seti/p -> updated value 
    const [input, setInput] = useState('')
    //updates the todos list
    const [todos, setTodos] = useState([])

    //save button triggers this function
    function handleSave() {

        //extra spaces gets trimmed
        const text = input.trim()

        //check if the to do list is not empty 
        if (!text) return
        //helps attach the new todo to already existing todo 
        setTodos([...todos, { id: Date.now(), text, done: false }])
        setInput('')
    }

    //check box
    function toggleDone(id) {

        //walk through all the todos , wherever the id matches , switch the status
        setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
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

                        {/* Whatever value is stored in input, it will be displayed in the input field */}
                        value={input}

                        {/*updates the i/p field*/}
                        onChange={e => setInput(e.target.value)}

                        {/*if enter is pressed, it will call the save function*/}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                    <button onClick={handleSave}>Save</button>
                </div>

                {/* Task list */}
                <ul className="task-list">

                    {/* if the todos list is empty, it will display a message */}
                    {todos.length === 0 && (
                        <p className="empty">No tasks yet. Add one above!</p>
                    )}
                    {/* it will map through all the todos and display them */}
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
        </div>
    )
}
