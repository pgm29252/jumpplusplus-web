# JumpPlusPlus Sprint Plan

This plan converts IMPLEMENTATION_SPEC.md into execution-ready tickets.

## 1) Planning Assumptions

- Team size baseline: 2 full-stack engineers.
- Sprint length: 2 weeks.
- Estimation unit: story points.
- Target velocity (starting): 24-30 points per sprint.

## 2) Epic Map

- EPIC-A: Test Foundation
- EPIC-B: Auth Hardening
- EPIC-C: Booking Enhancements
- EPIC-D: Event Enhancements
- EPIC-E: Profile Enhancements
- EPIC-F: Admin Analytics and Export
- EPIC-G: Real-time and Notifications
- EPIC-H: DevOps and Operations

## 3) Ticket Backlog

## Sprint 1 (Target: 26 points)

### EPIC-A Test Foundation

1. TST-001 Setup backend test harness

- Points: 3
- Depends on: none
- Scope: configure Vitest + Supertest + test scripts.
- Done when:
  - `npm run test --prefix backend` passes in CI.
  - sample auth route integration test is green.

2. TST-002 Setup frontend E2E harness

- Points: 5
- Depends on: none
- Scope: configure Playwright + baseline fixtures + scripts.
- Done when:
  - `npm run test:e2e --prefix frontend` executes locally and in CI.
  - sample sign-in smoke test passes.

3. TST-003 Auth API integration tests

- Points: 5
- Depends on: TST-001
- Scope: register/login/me/logout happy-path and error-path tests.
- Done when:
  - coverage includes 400/401/409 paths.

4. TST-004 Booking API integration tests

- Points: 8
- Depends on: TST-001
- Scope: create/list/cancel and slot conflict tests.
- Done when:
  - conflict and full-slot cases return correct status codes.

5. TST-005 CI test gate

- Points: 5
- Depends on: TST-001, TST-002
- Scope: add CI workflow for lint/test/build checks.
- Done when:
  - PR fails if any test or build fails.

## Sprint 2 (Target: 28 points)

### EPIC-B Auth Hardening

1. SEC-001 RefreshToken Prisma model and migration

- Points: 3
- Depends on: TST-003
- Scope: add model, indexes, expiry/revocation fields.
- Done when:
  - migration applies successfully and client is regenerated.

2. SEC-002 Implement refresh token issue and rotation

- Points: 8
- Depends on: SEC-001
- Scope: login returns access+refresh token, refresh endpoint rotates token.
- Done when:
  - reused refresh token is rejected.

3. SEC-003 Logout revocation flow

- Points: 3
- Depends on: SEC-002
- Scope: logout revokes refresh tokens for session.
- Done when:
  - revoked token cannot produce new access token.

4. SEC-004 Login rate limiting

- Points: 5
- Depends on: none
- Scope: per-IP and per-identifier throttling.
- Done when:
  - abusive attempts receive 429.

5. SEC-005 Frontend silent refresh and fallback

- Points: 5
- Depends on: SEC-002
- Scope: API client refresh behavior + retry + sign-out fallback.
- Done when:
  - expired access token can recover without user action.

6. SEC-006 Auth hardening tests

- Points: 4
- Depends on: SEC-002, SEC-004, SEC-005
- Scope: integration and E2E coverage for new auth behavior.
- Done when:
  - auth hardening scenarios pass in CI.

## Sprint 3 (Target: 27 points)

### EPIC-C Booking Enhancements

1. BKG-001 Working-hours configuration model and policy

- Points: 5
- Depends on: TST-004
- Scope: add config + validation in booking availability checks.
- Done when:
  - out-of-hours booking attempt fails with clear reason.

2. BKG-002 Blackout dates model and admin API

- Points: 5
- Depends on: BKG-001
- Scope: blackout CRUD (admin) and booking-time validation.
- Done when:
  - blocked slot cannot be booked.

3. BKG-003 Availability endpoint by date

- Points: 5
- Depends on: BKG-001, BKG-002
- Scope: GET availability with slot reasons.
- Done when:
  - endpoint returns availability matrix for selected date.

4. BKG-004 Reschedule booking API

- Points: 5
- Depends on: BKG-003
- Scope: reschedule endpoint with conflict protection.
- Done when:
  - original booking links to rescheduled booking data.

5. BKG-005 Booking UI slot picker and reschedule flow

- Points: 7
- Depends on: BKG-003, BKG-004
- Scope: new availability UX in booking pages.
- Done when:
  - unavailable slots disabled with reason label.

## Sprint 4 (Target: 24 points)

### EPIC-D Event Enhancements

1. EVT-001 Event schema extensions

- Points: 3
- Depends on: none
- Scope: category, tags, imageUrl, recurrence metadata.
- Done when:
  - migration and Prisma client update are applied.

2. EVT-002 Event filter/search APIs

- Points: 5
- Depends on: EVT-001
- Scope: category/tag/query filters with pagination support.
- Done when:
  - API returns filtered/paginated results correctly.

3. EVT-003 Event recurrence create/duplicate logic

- Points: 8
- Depends on: EVT-001
- Scope: recurring template and duplicate endpoint.
- Done when:
  - generated schedule matches recurrence rule.

4. EVT-004 Event form UI updates

- Points: 5
- Depends on: EVT-001, EVT-003
- Scope: category/tag/image/recurrence fields in UI.
- Done when:
  - create/edit form persists new metadata.

5. EVT-005 Event discovery UX improvements

- Points: 3
- Depends on: EVT-002
- Scope: search and filter controls in listing pages.
- Done when:
  - users can filter events from dashboard page.

## Sprint 5 (Target: 25 points)

### EPIC-E/F Profile + Analytics

1. PRF-001 Avatar upload API and storage adapter

- Points: 5
- Depends on: SEC-002
- Scope: upload endpoint + file validation + storage abstraction.
- Done when:
  - user avatar URL is saved and retrievable.

2. PRF-002 User preferences model and APIs

- Points: 5
- Depends on: none
- Scope: timezone/locale/notification preferences read/write.
- Done when:
  - preferences persist and load correctly.

3. PRF-003 Profile settings UI

- Points: 5
- Depends on: PRF-001, PRF-002
- Scope: profile page form for avatar and preferences.
- Done when:
  - settings update reflects in UI immediately.

4. ADM-001 Booking analytics API

- Points: 5
- Depends on: BKG-004
- Scope: aggregate metrics and trend endpoint.
- Done when:
  - admin metrics match source data for date range.

5. ADM-002 CSV export endpoint + UI action

- Points: 5
- Depends on: ADM-001
- Scope: admin CSV download with filters.
- Done when:
  - CSV includes expected headers and rows.

## Sprint 6 (Target: 26 points)

### EPIC-G/H Real-time + DevOps

1. RTC-001 WebSocket infrastructure and auth handshake

- Points: 5
- Depends on: SEC-002
- Scope: socket server, auth middleware, connection lifecycle.
- Done when:
  - authenticated clients connect and subscribe.

2. RTC-002 Booking update event broadcasting

- Points: 5
- Depends on: RTC-001
- Scope: emit booking.updated events on create/cancel/reschedule.
- Done when:
  - two client sessions stay synchronized.

3. RTC-003 Notification center UI

- Points: 5
- Depends on: RTC-002
- Scope: unread badge, list view, mark-as-read behavior.
- Done when:
  - notifications render and unread count updates.

4. OPS-001 Dockerization

- Points: 5
- Depends on: none
- Scope: Dockerfiles + compose for frontend/backend/db.
- Done when:
  - local full stack runs with one compose command.

5. OPS-002 Monitoring and alerting baseline

- Points: 3
- Depends on: OPS-001
- Scope: health checks, basic error-rate and uptime alerts.
- Done when:
  - alert channels receive test signal.

6. OPS-003 Backup and rollback runbook

- Points: 3
- Depends on: OPS-001
- Scope: scheduled backups + restore procedure docs.
- Done when:
  - restore dry-run is documented and validated.

## 4) Dependency Graph (High Level)

1. TST-\* should start first to protect later releases.
2. SEC-_ should complete before RTC-_ and before production launch.
3. BKG-_ should complete before ADM-_ analytics finalization.
4. EVT-_ and PRF-_ can run in parallel once Sprint 3 starts.
5. OPS-\* can start in parallel with later feature work.

## 5) Risk Register

1. Token rotation complexity

- Risk: session breakage and edge-case loops.
- Mitigation: integration tests for all token states.

2. Booking concurrency

- Risk: race conditions for high-demand slots.
- Mitigation: DB transactions + unique constraints + idempotency key.

3. Timezone handling

- Risk: wrong slot display/booking across locales.
- Mitigation: normalize UTC storage and strict timezone conversion in UI.

4. Real-time infrastructure

- Risk: connection instability and duplicate events.
- Mitigation: event IDs, reconnection strategy, dedupe client-side.

## 6) Release Criteria

Before production release:

1. All Sprint 1-3 tickets completed and validated.
2. Critical auth/security tickets completed (SEC-001..SEC-006).
3. API integration and E2E suites green in CI.
4. Rollback and backup process validated.
5. Monitoring and alerting active.

## 7) Ticket Template

Use this for each new task:

- ID:
- Title:
- Epic:
- Points:
- Depends on:
- Scope:
- API changes:
- DB changes:
- UI changes:
- Acceptance criteria:
- Test coverage:
- Risks:
