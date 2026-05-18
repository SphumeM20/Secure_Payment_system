import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';

const dbDir = path.dirname(config.dbPath);
fs.mkdirSync(dbDir, { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initialiseDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('CUSTOMER','EMPLOYEE')),
      full_name TEXT NOT NULL,
      id_number TEXT,
      account_number TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      provider TEXT NOT NULL,
      beneficiary_name TEXT NOT NULL,
      beneficiary_account TEXT NOT NULL,
      swift_code TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','VERIFIED','SENT_TO_SWIFT')),
      employee_id INTEGER,
      verified_at TEXT,
      sent_to_swift_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (employee_id) REFERENCES users(id)
    );
  `);

  const existingEmployee = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('EMPLOYEE');
  if (!existingEmployee) {
    const hash = bcrypt.hashSync('Employee@12345', config.bcryptRounds);
    db.prepare(`
      INSERT INTO users (role, full_name, id_number, account_number, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run('EMPLOYEE', 'Demo Bank Employee', null, 'EMP001', hash);
  }
}
