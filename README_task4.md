# Task 4: PII Masking, Security Headers, and a CI/CD Security Pipeline

Part of the Datheon Application Security & API Pentesting Internship. Adds a public, unauthenticated lookup endpoint with masked PII, security headers via middleware, and a GitHub Actions workflow that runs the full test suite — including live, running-server checks — on every push.

## Public endpoint with masking

`GET /api/public/verify/[id]` requires no authentication by design (it's meant to be a public lookup, like a certificate verification page), but returns masked contact details rather than raw PII:

    {"id":1,"full_name":"Alice Nambi","email":"a***e@example.com","phone":"070*****22"}

Masking logic lives in `lib/mask.ts`: `maskEmail` keeps the first and last character of the local part; `maskPhone` keeps the first 3 and last 2 digits after stripping separators. Both are covered by unit tests in `tests/mask.test.ts`.

## Security headers

`middleware.ts` applies, to every `/api/*` route:

- `Content-Security-Policy` — restricts script/style sources to same-origin.
- `Strict-Transport-Security` — enforces HTTPS for 2 years once deployed.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` — blocks embedding in a malicious iframe.
- `Referrer-Policy: no-referrer`

Verified both by `tests/headers.test.ts` (checks the live server's actual response headers) and manually via `curl -i`.

## CI/CD security pipeline

`.github/workflows/security.yml` runs on every push and pull request to `main`:

1. Installs dependencies (`npm ci`), including compiling `better-sqlite3`'s native addon on a clean Ubuntu runner.
2. Runs the full unit test suite (BOLA protection, rate limiting, PII masking — 12 tests).
3. Builds the Next.js app and starts it in the background.
4. Waits for the live server to become reachable, then runs `headers.test.ts` and the masking E2E checks **against that real running instance** — genuine DAST-style validation, not just static analysis.
5. Scans the full repository history for verified, live secrets using TruffleHog.

This workflow has run and passed on GitHub's own infrastructure (not just locally), at:
https://github.com/Onesmas757/task4_security_pipeline/actions

Screenshots of two passing runs are included in `screenshots/`.

## Stack

Next.js 16.4.6, TypeScript, better-sqlite3, jsonwebtoken, bcryptjs, Node's built-in test runner, GitHub Actions, TruffleHog.

## Ethical note

All testing was performed against applications built for this exercise, on infrastructure the researcher controls (own machine, own GitHub Actions runs). No production system or real user was accessed.
