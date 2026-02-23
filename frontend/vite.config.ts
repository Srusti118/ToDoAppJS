import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, proxy /api to local backend
// In production (Vercel), VITE_API_URL points to Render backend
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': process.env.VITE_API_URL || 'http://localhost:3001',
        },
    },
})
