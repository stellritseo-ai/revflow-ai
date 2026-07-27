import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://mock@o0.ingest.sentry.io/0",
  tracesSampleRate: 1.0,
  debug: false,
});
