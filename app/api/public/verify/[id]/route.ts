import { NextRequest, NextResponse } from "next/server";
import { db, UserRow } from "@/lib/db";
import { maskEmail, maskPhone } from "@/lib/mask";

// Public, unauthenticated lookup — intentionally returns masked fields only.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = db
    .prepare("SELECT id, email, full_name, phone FROM users WHERE id = ?")
    .get(Number(id)) as UserRow | undefined;

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    full_name: user.full_name,
    email: maskEmail(user.email),
    phone: maskPhone(user.phone),
  });
}
