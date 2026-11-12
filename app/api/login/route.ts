import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, UserRow } from "@/lib/db";
import { signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession({ userId: user.id, email: user.email });
  return NextResponse.json({ token });
}
