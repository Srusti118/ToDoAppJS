import * as Sentry from "@sentry/react";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
// 1. Initialize Sentry for React
Sentry.init({
    dsn: "https://845893bf586b66d53aa7e9405d27d8e7@o4510961737793536.ingest.us.sentry.io/4510961775083520",
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
        }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

const provider = new WebTracerProvider({
    spanProcessors: [
        new BatchSpanProcessor(new ConsoleSpanExporter())
    ]
});

provider.register();

console.log('✅ Frontend Telemetry initialized (Sentry & OpenTelemetry)');
