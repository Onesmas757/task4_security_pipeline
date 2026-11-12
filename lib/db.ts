import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "app.db");
export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL
  )
`);

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string;
}
