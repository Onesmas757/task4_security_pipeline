# Task 2: Remediating BOLA/IDOR in Next.js

Part of the Datheon Application Security & API Pentesting Internship. A minimal Next.js 16 / TypeScript API that reproduces, then fixes, the same Broken Object Level Authorization pattern found against OWASP crAPI in Task 1.

## The vulnerability

`GET /api/users/[id]` originally checked that a request carried a *valid* session token, but never checked whether the session's own user matched the `id` in the URL. Any logged-in user could read any other user's profile (name, email, phone) by changing the ID.

Confirmed by manual testing with two seeded accounts (Alice, id 1; Bob, id 2):

    curl http://localhost:3000/api/users/2 -H "Authorization: Bearer <Alice's token>"
    # returned Bob's full profile — Status: 200

## The fix

The route now compares the authenticated session's `userId` against the requested `id` before querying the database, and returns a generic `403 Forbidden` on mismatch (no leaked fields). See `app/api/users/[id]/route.ts` and `BEFORE_AFTER.diff` for the exact code change.

    if (session.userId !== requestedId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

## Automated test

`tests/bola.test.ts` proves the fix with four cases: legitimate self-access still works, cross-user access is blocked in both directions, and no data leaks into the 403 response body. Unauthenticated requests are still rejected with 401.

Run with:

    npm install
    npm test

Note: this project uses Node's built-in test runner (`node --test`, via `tsx`) rather than Vitest. Vitest's bundled build toolchain requires AVX2 CPU instructions, which the development machine used for this task does not support (confirmed via `/proc/cpuinfo`), causing a low-level crash unrelated to the application code. Node's native test runner has no such dependency and is used here as a stable equivalent, consistent with the task's "Jest/Vitest" requirement for an automated test suite.

## Stack

Next.js 16.4.6, TypeScript, better-sqlite3, jsonwebtoken, bcryptjs, Node's built-in test runner.

## Setup

    npm install
    npx tsx lib/seed.ts    # creates alice@example.com / bob@example.com test users
    npm run dev            # http://localhost:3000
    npm test               # runs the automated BOLA regression tests

## Ethical note

All testing was performed against a local application built for this exercise, on the researcher's own machine. No production system or real user was accessed.
