import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, _resetRateLimitsForTests } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    _resetRateLimitsForTests();
  });

  test("allows requests up to the limit", () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit("test-key-a");
      assert.equal(result.allowed, true);
    }
  });

  test("blocks the request immediately after the limit is reached", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("test-key-b");
    const sixth = checkRateLimit("test-key-b");
    assert.equal(sixth.allowed, false);
    assert.equal(sixth.remaining, 0);
    assert.ok(sixth.retryAfterSeconds > 0);
  });

  test("tracks separate keys independently", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("test-key-c1");
    // A different key (e.g. a different IP) should be unaffected.
    const result = checkRateLimit("test-key-c2");
    assert.equal(result.allowed, true);
  });
});
