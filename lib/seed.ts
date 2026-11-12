import bcrypt from "bcryptjs";
import { db } from "./db";

const users = [
  { email: "alice@example.com", password: "alice-pass-123", full_name: "Alice Nambi", phone: "0700111222" },
  { email: "bob@example.com", password: "bob-pass-456", full_name: "Bob Okello", phone: "0700333444" },
];

const insert = db.prepare(
  "INSERT OR IGNORE INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)"
);

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  insert.run(u.email, hash, u.full_name, u.phone);
}

console.log("Seeded users:");
for (const row of db.prepare("SELECT id, email, full_name FROM users").all()) {
  console.log(row);
}
