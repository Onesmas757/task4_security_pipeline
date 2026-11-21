# Task 3: Secure Session Security

Part of the Datheon Application Security & API Pentesting Internship. Extends the Task 2 BOLA remediation project with secure, cookie-based session handling, token expiration, and rate limiting.

## The problem

Storing a JWT in `localStorage` (or returning it in a JSON body for client-side JS to store itself) exposes it to any successful Cross-Site Scripting (XSS) attack, since JavaScript running on the page can read anything JavaScript put there.

## The fix

`POST /api/login` now sets the session token directly as a cookie, with:

- `HttpOnly` — JavaScript cannot read this cookie under any circumstance, even via `document.cookie`, which removes the XSS token-theft vector entirely.
- `SameSite=Lax` — the cookie is withheld on most cross-site requests, mitigating CSRF.
- `Secure` in production — the cookie is only sent over HTTPS once deployed (disabled only for local `http://localhost` development).
- `Max-Age=900` (15 minutes) — a short, enforced expiration, limiting the usefulness of a token even if compromised through some other means.

The response body no longer contains the token at all: `{"message":"Logged in"}`.

`GET /api/users/[id]` was updated to read the session from the cookie (`req.cookies.get("session")`) instead of an `Authorization` header. The ownership check from Task 2 is unchanged.

## Rate limiting

`lib/rateLimit.ts` implements an in-memory sliding-window counter (5 attempts per 60 seconds, tracked per request key — here, by IP address). `/api/login` returns `429 Too Many Requests` with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers once the limit is hit, stopping automated brute-force password guessing regardless of whether a guess would eventually succeed.

Verified manually against a running server: 5 incorrect login attempts returned 401, and the 6th returned 429 with `Retry-After: 60`.

Note: this is a single-process, in-memory implementation suitable for a demo. A real multi-instance deployment would back the counter with shared storage such as Redis, as the task suggests.

## Automated tests

`tests/bola.test.ts` (updated for cookie-based auth) and `tests/rateLimit.test.ts` (new) — 7 tests total, covering: legitimate self-access, bidirectional BOLA blocking, rejection with no session, rate-limit allow/block behavior, and per-key isolation.

    npm test

## Stack

Same as Task 2: Next.js 16.4.6, TypeScript, better-sqlite3, jsonwebtoken, bcryptjs, Node's built-in test runner (`node --test` via `tsx` — see Task 2's README for why Vitest is not used on this machine).

## Ethical note

All testing was performed against a local application on the researcher's own machine. No production system or real user was accessed.
