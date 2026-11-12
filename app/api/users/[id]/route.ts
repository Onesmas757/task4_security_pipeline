import { NextRequest, NextResponse } from "next/server";
import { db, UserRow } from "@/lib/db";
import { verifySession } from "@/lib/auth";

// FIXED: requires a valid session, then verifies that the session's
// own userId matches the requested id before returning any data.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const session = verifySession(token);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestedId = Number(id);

  // The core fix: a user may only fetch their own record.
  if (session.userId !== requestedId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = db
    .prepare("SELECT id, email, full_name, phone FROM users WHERE id = ?")
    .get(requestedId) as UserRow | undefined;

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
