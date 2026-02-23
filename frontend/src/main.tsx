import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ─────────────────────────────────────────────────────────────────────────────
// document.getElementById('root') can return HTMLElement | null
// TypeScript knows this and will warn: "you can't pass null to createRoot"
//
// "as HTMLElement" is TYPE CASTING — we're telling TypeScript:
//   "Trust me, I know this element exists in index.html, it's not null"
// This is safe because index.html always has <div id="root"></div>
// ─────────────────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root') as HTMLElement).render(
    <StrictMode>
        {/* StrictMode runs extra checks in development to catch bad patterns early */}
        <App />
    </StrictMode>,
)
