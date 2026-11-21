// Masking utilities for data returned on public, unauthenticated endpoints.

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length === 0) return "***";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "*".repeat(digits.length);
  const visibleStart = digits.slice(0, 3);
  const visibleEnd = digits.slice(-2);
  const maskedMiddle = "*".repeat(digits.length - 5);
  return `${visibleStart}${maskedMiddle}${visibleEnd}`;
}
