import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { maskEmail, maskPhone } from "@/lib/mask";

describe("maskEmail", () => {
  test("masks the middle characters of the local part", () => {
    assert.equal(maskEmail("alice@example.com"), "a***e@example.com");
  });

  test("handles very short local parts without negative repeat counts", () => {
    assert.equal(maskEmail("ab@example.com"), "a***@example.com");
    assert.equal(maskEmail("a@example.com"), "a***@example.com");
  });
});

describe("maskPhone", () => {
  test("keeps the first 3 and last 2 digits, masks the rest", () => {
    assert.equal(maskPhone("0700111222"), "070*****22");
  });

  test("strips non-digit characters before masking", () => {
    assert.equal(maskPhone("+256-700-111-222"), "256*******22");
  });

  test("fully masks very short numbers", () => {
    assert.equal(maskPhone("123"), "***");
  });
});
