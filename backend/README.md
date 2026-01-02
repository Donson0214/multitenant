# Multi-Tenant Analytics Backend

## Overview
Express + TypeScript API using Prisma, Firebase Authentication, BullMQ workers, and PostgreSQL/MySQL to support multi-tenant analytics, dashboards, and automations.

## Architecture Notes
- **Multi-tenancy**: `tenantId` is stored on all tenant-scoped tables. The API resolves the tenant via membership for each authenticated request and never accepts tenant IDs from client input.
- **Authentication**: Firebase ID tokens are verified server-side. An internal JWT session token can be minted from `/api/v1/auth/session` for internal service-to-service use.
- **RBAC**: Owner, Analyst, and Viewer roles enforced with middleware at route boundaries.
- **Background jobs**: BullMQ workers handle ETL polling, automation evaluation, metric jobs, and notification fan-out.
- See `backend/docs/ARCHITECTURE.md` for deeper details.

## Environment Variables
Create a `.env` file:
- `DATABASE_URL` (required)
- `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT`
- `INTERNAL_JWT_SECRET`
- `PLATFORM_ADMIN_EMAILS` (comma-separated)
- `WEBHOOK_RATE_LIMIT_PER_MINUTE`
- `WEBHOOK_REPLAY_TTL_SECONDS`
- `WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS`
- `ETL_POLL_INTERVAL_MS`
- `AUTOMATION_EVAL_INTERVAL_MS`
- `REST_POLL_TIMEOUT_MS`
- `PORT`
- Firebase Admin credentials via `GOOGLE_APPLICATION_CREDENTIALS`

## Local Development
```
npm install
npm run dev
```

## Workers
Run workers in separate terminals if needed:
```
node dist/workers/etl.worker.js
node dist/workers/automations.worker.js
node dist/workers/metrics.worker.js
node dist/workers/notifications.worker.js
```

## Seed Data
```
npm run seed
```

## Testing
```
npm test
```

## API Notes
- `GET /api/v1/tenants/me` returns onboarding status when no membership exists.
- `POST /api/v1/data-sources/:id/ingest` accepts CSV text or JSON records.
- `POST /api/v1/webhooks/data-sources/:id` requires `x-webhook-id` and `x-webhook-timestamp`; if a webhook secret is configured, also send `x-webhook-signature` (HMAC SHA256 over `${timestamp}.${rawBody}`).
