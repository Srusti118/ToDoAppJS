import express, { Request, Response } from 'express'
import cors from 'cors'
import { z } from 'zod'
import { db, initDB } from './db/index.js'
import { sql } from './db/baseTable.js'

import { RPCHandler } from '@orpc/server/node'
import { router } from './router.js'

const app = express()

const rpcHandler = new RPCHandler(router)

app.use(cors({
    origin: process.env.FRONTEND_URL || '*'
}))

app.use(express.json())

app.all(['/rpc', '/rpc/*'], async (req, res) => {
    const result = await rpcHandler.handle(req, res, { prefix: '/rpc' })
    if (!result.matched) {
        res.status(404).send('No procedure matched')
    }
})

const PORT = process.env.PORT || 3001

// Start server after DB init
initDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
    })
    .catch((err: Error) => {
        console.error('❌ Failed to connect to database:', err.message)
        process.exit(1)
    })
