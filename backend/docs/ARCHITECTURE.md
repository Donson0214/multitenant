# Architecture

## Multi-Tenancy Strategy
- Tenant scoping is enforced at the service layer using `tenantId` derived from the authenticated membership.
- Requests never accept `tenantId` from body or params; it is injected by middleware after Firebase auth.
- Platform admins are allowed to bypass tenant scoping for support (email allowlist).

## Data Flow
1. Data sources ingest raw records (CSV, webhook, REST polling).
2. Records are mapped to dataset schema and stored in `dataset_records`.
3. Metrics evaluate over dataset records using aggregations and optional expressions.
4. Automations evaluate metrics on schedule and generate automation runs + notifications.

## Security
- Firebase Admin verifies ID tokens per request.
- Role checks at the route boundary enforce access control.
- Public webhook endpoints use rate limiting, replay protection, and optional HMAC signatures when a shared secret is configured.

## Deployment Notes
- Run API and workers as separate processes.
- Redis is required for BullMQ.
- PostgreSQL or MySQL supported via Prisma.
