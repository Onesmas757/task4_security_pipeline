import { test, describe } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Security headers on public endpoints", () => {
  test("public verify endpoint includes required security headers", async () => {
    const res = await fetch(`${BASE_URL}/api/public/verify/1`);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(res.headers.get("x-frame-options"), "DENY");
    assert.ok(res.headers.get("content-security-policy")?.includes("default-src 'self'"));
    assert.ok(res.headers.get("strict-transport-security")?.includes("max-age="));
  });

  test("public verify endpoint masks email and phone", async () => {
    const res = await fetch(`${BASE_URL}/api/public/verify/1`);
    const body = await res.json();
    assert.ok(!body.email.includes("alice"), "raw email local-part should not appear");
    assert.ok(body.email.includes("*"));
    assert.ok(body.phone.includes("*"));
    assert.equal(body.phone.length, 10); // digits + asterisks, no separators
  });
});
