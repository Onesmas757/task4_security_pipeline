import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/users/[id]/route";
import { signSession } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

function makeRequest(url: string, token: string) {
  return new NextRequest(url, {
    headers: { authorization: `Bearer ${token}` },
  });
}

describe("GET /api/users/[id] — BOLA protection", () => {
  let aliceId: number;
  let bobId: number;
  let aliceToken: string;
  let bobToken: string;

  before(() => {
    const insert = db.prepare(
      "INSERT OR IGNORE INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)"
    );
    insert.run("test-alice@example.com", bcrypt.hashSync("x", 4), "Test Alice", "0000000001");
    insert.run("test-bob@example.com", bcrypt.hashSync("x", 4), "Test Bob", "0000000002");

    const alice = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("test-alice@example.com") as { id: number };
    const bob = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("test-bob@example.com") as { id: number };

    aliceId = alice.id;
    bobId = bob.id;
    aliceToken = signSession({ userId: aliceId, email: "test-alice@example.com" });
    bobToken = signSession({ userId: bobId, email: "test-bob@example.com" });
  });

  test("allows a user to fetch their own profile", async () => {
    const req = makeRequest(`http://localhost/api/users/${aliceId}`, aliceToken);
    const res = await GET(req, { params: Promise.resolve({ id: String(aliceId) }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, aliceId);
  });

  test("blocks a user from fetching another user's profile (BOLA check)", async () => {
    const req = makeRequest(`http://localhost/api/users/${bobId}`, aliceToken);
    const res = await GET(req, { params: Promise.resolve({ id: String(bobId) }) });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal("phone" in body, false);
    assert.equal("email" in body, false);
  });

  test("blocks the reverse direction too", async () => {
    const req = makeRequest(`http://localhost/api/users/${aliceId}`, bobToken);
    const res = await GET(req, { params: Promise.resolve({ id: String(aliceId) }) });
    assert.equal(res.status, 403);
  });

  test("rejects requests with no token at all", async () => {
    const req = new NextRequest(`http://localhost/api/users/${aliceId}`);
    const res = await GET(req, { params: Promise.resolve({ id: String(aliceId) }) });
    assert.equal(res.status, 401);
  });
});
