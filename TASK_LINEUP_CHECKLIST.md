# Proptii Backend Task Lineup Checklist

## Sprint 1 — Immediate / Security

- [ ] TASK-001 · Rotate & Move the Hardcoded Brave API Key
- [x] TASK-002 · Remove Hardcoded Test Email Address
- [x] TASK-003 · Tighten CORS Configuration
- [ ] TASK-004 · Fix `uncaughtException` Handler in Scraper Service

## Sprint 2 — Stability & Dead Code Cleanup

- [x] TASK-001 · Audit and Remove Legacy Express Files in `proptii-backend`
- [-] TASK-002 · Resolve or Remove Dead TypeORM / Property Code
- [x] TASK-003 · Extend Global Exception Filter to Catch All Errors
- [x] TASK-004 · Fix Viewing Request Route Ordering
- [-] TASK-005 · Reduce JSON Body Limit to a Sensible Value

## Sprint 3 — Authentication & Validation

- [x] TASK-001 · Implement JWT Auth Guard in NestJS
- [x] TASK-002 · Replace any DTOs with Typed Request Bodies
- [-] TASK-003 · Add Startup Env Validation (Zod) to NestJS Backend

## Sprint 4 — Code Quality & Standardisation

- [x] TASK-001 · Convert All `.js` Files to `.ts` in `proptii-backend`
- [x] TASK-002 · Replace `console.log` with NestJS Logger
- [ ] TASK-003 · Standardise Environment Variable Names Across All Surfaces
- [-] TASK-004 · Add `source` Flag to Mock Search Responses
- [ ] TASK-005 · Move Firebase Config to Environment Variables

## Sprint 5 — Observability & Resilience & Test Creation

- [-] TASK-001 · Add Rate Limiting to NestJS Backend
- [ ] TASK-002 · Add Structured Logging with Request IDs
- [-] TASK-003 · Implement Real Dependency Health Checks
- [ ] TASK-004 · Write Unit Tests for Core Service Layer
- [-] TASK-005 · Write Integration Tests for Critical API Routes

