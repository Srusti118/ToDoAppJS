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

const allowedOrigin = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.replace(/\/$/, '');

        // 1. Exact match with configured FRONTEND_URL or any localhost (for Flutter dev)
        if (normalizedOrigin === allowedOrigin || normalizedOrigin.startsWith('http://localhost:')) {
            return callback(null, true);
        }

        // 2. Allow any preview URL from this specific project
        if (normalizedOrigin.startsWith('https://to-do-app-js') && normalizedOrigin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        console.warn(`⚠️ CORS Blocked: Origin [${origin}] does not match allowed [${allowedOrigin}]`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))

app.use(express.json({ type: ['application/json', 'text/plain'] }))
app.use(cookieParser())


app.use((req, res, next) => {
    console.log(`\n--- [${new Date().toISOString()}] ${req.method} ${req.url} ---`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});

const rpcHandler = new RPCHandler(appRouter);

app.use('/api', async (req: Request, res: Response, next) => {
    console.log(`\n[API Trace] ${req.method} ${req.originalUrl}`);
    console.log(`[API Trace] Content-Type: ${req.headers['content-type']}`);
    console.log(`[API Trace] Raw Body State:`, JSON.stringify(req.body, null, 2));

    let userId: number | undefined;
    let token: string | undefined;

    // 1. Prioritize Authorization header (Bearer token) over cookies
    // This is vital for Web browsers to ignore stale cookies in favor of localStorage tokens
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
        console.log(`[API Trace] Extracted Bearer token from header`);
    } else if (req.cookies?.auth_token) {
        token = req.cookies.auth_token;
        console.log(`[API Trace] Found auth_token in cookies`);
    }

    if (token) {
        console.log(`[API Trace] Token length: ${token.length}`);
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
            console.log(`[API Trace] User verified: ${userId}`);
        } catch (e) {
            console.log(`[API Trace] Token invalid`);
        }
    }

    try {
        console.log(`[API Trace] Handing over to rpcHandler (prefix: /api)...`);
        const { matched } = await rpcHandler.handle(req, res, {
            prefix: '/api',
            context: {
                userId,
                res
            }
        });

        console.log(`[API Trace] oRPC matched: ${matched}`);

        if (!matched) {
            next();
        }
    } catch (e: any) {

        // Handle ORPC errors specifically to expose validation issues
        if (e.code === 'BAD_REQUEST' && e.data?.issues) {
            console.error('[ORPC Validation Error Details]:', JSON.stringify(e.data.issues, null, 2));
            console.error('[Full Body at Failure]:', JSON.stringify(req.body, null, 2));
            return res.status(400).json({
                message: 'Input validation failed',
                issues: e.data.issues,
                debug_body: req.body // Temporary for debugging
            });
        }

        console.error('[API Error]', e);
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
