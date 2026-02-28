import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// 1. Initialize Sentry (which leverages OpenTelemetry in v8+)
Sentry.init({
    dsn: "https://d931f72a8fbf223ea54e0091de77ae3a@o4510961737793536.ingest.us.sentry.io/4510961747034112",
    integrations: [
        nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
});

// 2. Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
    // Adds standard Node.js auto-instrumentations (http, express, fs, etc.)
    instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

console.log('✅ Telemetry initialized (Sentry & OpenTelemetry)');
