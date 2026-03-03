import './src/telemetry.js';
import express, { Request, Response } from 'express'
import * as Sentry from '@sentry/node';
import cors from 'cors'
import { z } from 'zod'
import { db, initDB } from './db/index.js'
import { sql } from './db/baseTable.js'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { authenticateUser } from './src/middleware/auth.js'

const app = express()

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
import { RPCHandler } from '@orpc/server/node'
import { appRouter } from './src/router.js'

let allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
allowedOrigin = allowedOrigin.replace(/\/$/, '');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin === allowedOrigin) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked request from origin: ${origin}. Expected: ${allowedOrigin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}))

app.use(express.json())
app.use(cookieParser())


const rpcHandler = new RPCHandler(appRouter);

app.use('/api', async (req: Request, res: Response, next) => {
    // ORPC StandardUrl uses originalUrl which includes '/api'.
    // Use req.url which has the prefix stripped by Express so it matches our AppRouter config.
    const savedOriginal = req.originalUrl;
    req.originalUrl = req.url;

    let userId: number | undefined;
    const token = req.cookies?.auth_token;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
        } catch (e) {
            // Invalid token, ignore and let ORPC protected routes reject it
        }
    }

    try {
        const { matched } = await rpcHandler.handle(req, res, {
            context: {
                userId,
                res
            }
        });

        req.originalUrl = savedOriginal;

        if (!matched) {
            next();
        }
    } catch (e: any) {
        req.originalUrl = savedOriginal;
        next(e);
    }
});

app.get("/api/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error in Node.js!");
});

// Sentry Error Handler (must be after all controllers)
Sentry.setupExpressErrorHandler(app);

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
