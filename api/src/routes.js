import express from 'express';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { users, payments } from './repositories.js';
import { createSession, clearSession, requireAuth, requireCsrf, safeUser } from './middleware/auth.js';
import { authLimiter } from './middleware/security.js';
import { validateCustomerRegistration, validateLogin, validatePayment, validatePaymentId } from './validators.js';

export const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'secure-payments-api' });
});

router.post('/auth/register-customer', authLimiter, (req, res, next) => {
  try {
    const data = validateCustomerRegistration(req.body);
    const existing = users.findByAccountNumber(data.accountNumber, 'CUSTOMER');
    if (existing) return res.status(409).json({ message: 'Account number is already registered.' });

    const passwordHash = bcrypt.hashSync(data.password, config.bcryptRounds);
    const user = users.createCustomer({ ...data, passwordHash });
    const session = createSession(res, user);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

router.post('/auth/login-customer', authLimiter, (req, res, next) => {
  try {
    const { username, password } = validateLogin(req.body, 'CUSTOMER');
    const user = users.findByAccountNumber(username, 'CUSTOMER');
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid customer login details.' });
    }
    res.json(createSession(res, user));
  } catch (error) {
    next(error);
  }
});

router.post('/auth/login-employee', authLimiter, (req, res, next) => {
  try {
    const { username, password } = validateLogin(req.body, 'EMPLOYEE');
    const user = users.findByAccountNumber(username, 'EMPLOYEE');
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid employee login details.' });
    }
    res.json(createSession(res, user));
  } catch (error) {
    next(error);
  }
});

router.post('/auth/logout', requireAuth(), requireCsrf, (req, res) => {
  clearSession(res);
  res.json({ message: 'Logged out.' });
});

router.get('/auth/me', requireAuth(), (req, res) => {
  const user = users.findById(Number(req.user.sub));
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: safeUser(user) });
});

router.post('/payments', requireAuth('CUSTOMER'), requireCsrf, (req, res, next) => {
  try {
    const data = validatePayment(req.body);
    const payment = payments.create(Number(req.user.sub), data);
    res.status(201).json({ payment });
  } catch (error) {
    next(error);
  }
});

router.get('/payments/my', requireAuth('CUSTOMER'), (req, res) => {
  res.json({ payments: payments.listForCustomer(Number(req.user.sub)) });
});

router.get('/employee/payments', requireAuth('EMPLOYEE'), (req, res) => {
  const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
  const allowed = new Set(['PENDING', 'VERIFIED', 'SENT_TO_SWIFT']);
  const selected = status && allowed.has(status) ? status : undefined;
  res.json({ payments: payments.listForEmployee(selected) });
});

router.post('/employee/payments/:id/verify', requireAuth('EMPLOYEE'), requireCsrf, (req, res, next) => {
  try {
    const id = validatePaymentId(req.params.id);
    const payment = payments.verify(id, Number(req.user.sub));
    if (!payment) return res.status(409).json({ message: 'Only pending payments can be verified.' });
    res.json({ payment });
  } catch (error) {
    next(error);
  }
});

router.post('/employee/payments/:id/send-to-swift', requireAuth('EMPLOYEE'), requireCsrf, (req, res, next) => {
  try {
    const id = validatePaymentId(req.params.id);
    const payment = payments.sendToSwift(id);
    if (!payment) return res.status(409).json({ message: 'Only verified payments can be sent to SWIFT.' });
    res.json({ payment, swiftReference: `SWIFT-${String(id).padStart(6, '0')}` });
  } catch (error) {
    next(error);
  }
});
