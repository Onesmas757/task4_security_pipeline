import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, UserRow } from "@/lib/db";
import { signSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

const COOKIE_NAME = "session";
const MAX_AGE_SECONDS = 60 * 15; // 15 minutes

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const limit = checkRateLimit(`login:${ip}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit.limit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(limit.retryAfterSeconds),
        },
      }
    );
  }

  const { email, password } = await req.json();

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession({ userId: user.id, email: user.email });
  const res = NextResponse.json({ message: "Logged in" });

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  res.headers.set("X-RateLimit-Limit", String(limit.limit));
  res.headers.set("X-RateLimit-Remaining", String(limit.remaining));

  return res;
}
