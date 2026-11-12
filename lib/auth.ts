import jwt from "jsonwebtoken";

// In a real app this comes from an environment variable, never hardcoded.
const SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";

export interface SessionPayload {
  userId: number;
  email: string;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
