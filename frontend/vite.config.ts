import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// In development, proxy /api to local backend
// In production (Vercel), VITE_API_URL points to Render backend
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon_io/favicon.ico', 'favicon_io/apple-touch-icon.png'],
            manifest: {
                name: 'TodoFlow',
                short_name: 'TodoFlow',
                description: 'A clean, modern To-Do app built with React 19',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: '/favicon_io/android-chrome-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/favicon_io/android-chrome-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            '/api': process.env.VITE_API_URL || 'http://localhost:3001',
        },
    },
})
