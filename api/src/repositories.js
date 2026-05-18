import { db } from './db/database.js';

export const users = {
  findByAccountNumber(accountNumber, role) {
    return db.prepare('SELECT * FROM users WHERE account_number = ? AND role = ?').get(accountNumber, role);
  },
  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },
  createCustomer({ fullName, idNumber, accountNumber, passwordHash }) {
    const result = db.prepare(`
      INSERT INTO users (role, full_name, id_number, account_number, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `).run('CUSTOMER', fullName, idNumber, accountNumber, passwordHash);
    return users.findById(result.lastInsertRowid);
  }
};

function mapPayment(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    amount: (row.amount_cents / 100).toFixed(2),
    currency: row.currency,
    provider: row.provider,
    beneficiaryName: row.beneficiary_name,
    beneficiaryAccount: row.beneficiary_account,
    swiftCode: row.swift_code,
    bankName: row.bank_name,
    status: row.status,
    employeeId: row.employee_id,
    verifiedAt: row.verified_at,
    sentToSwiftAt: row.sent_to_swift_at,
    createdAt: row.created_at
  };
}

export const payments = {
  create(customerId, data) {
    const result = db.prepare(`
      INSERT INTO payments (
        customer_id, amount_cents, currency, provider, beneficiary_name,
        beneficiary_account, swift_code, bank_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customerId,
      data.amountCents,
      data.currency,
      data.provider,
      data.beneficiaryName,
      data.beneficiaryAccount,
      data.swiftCode,
      data.bankName
    );
    return payments.findById(result.lastInsertRowid);
  },
  findById(id) {
    const row = db.prepare(`
      SELECT p.*, u.full_name AS customer_name
      FROM payments p
      JOIN users u ON u.id = p.customer_id
      WHERE p.id = ?
    `).get(id);
    return mapPayment(row);
  },
  listForCustomer(customerId) {
    return db.prepare(`
      SELECT p.*, u.full_name AS customer_name
      FROM payments p
      JOIN users u ON u.id = p.customer_id
      WHERE p.customer_id = ?
      ORDER BY p.created_at DESC
    `).all(customerId).map(mapPayment);
  },
  listForEmployee(status) {
    const base = `
      SELECT p.*, u.full_name AS customer_name
      FROM payments p
      JOIN users u ON u.id = p.customer_id
    `;
    if (status) {
      return db.prepare(`${base} WHERE p.status = ? ORDER BY p.created_at DESC`).all(status).map(mapPayment);
    }
    return db.prepare(`${base} ORDER BY p.created_at DESC`).all().map(mapPayment);
  },
  verify(id, employeeId) {
    const result = db.prepare(`
      UPDATE payments
      SET status = 'VERIFIED', employee_id = ?, verified_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'PENDING'
    `).run(employeeId, id);
    if (result.changes === 0) return null;
    return payments.findById(id);
  },
  sendToSwift(id) {
    const result = db.prepare(`
      UPDATE payments
      SET status = 'SENT_TO_SWIFT', sent_to_swift_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'VERIFIED'
    `).run(id);
    if (result.changes === 0) return null;
    return payments.findById(id);
  }
};
