import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const COOKIE_NAME = 'secure_payments_session';

export function createSession(res, user) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const payload = {
    sub: String(user.id),
    role: user.role,
    name: user.full_name,
    accountNumber: user.account_number,
    csrf: csrfToken
  };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/'
  });

  return { csrfToken, user: safeUser(user) };
}

export function clearSession(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/'
  });
}

export function requireAuth(role) {
  return (req, res, next) => {
    try {
      const token = req.cookies?.[COOKIE_NAME];
      if (!token) {
        return res.status(401).json({ message: 'Not authenticated.' });
      }
      const payload = jwt.verify(token, config.jwtSecret);
      if (role && payload.role !== role) {
        return res.status(403).json({ message: 'Access denied.' });
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired session.' });
    }
  };
}

export function requireCsrf(req, res, next) {
  const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!unsafeMethods.includes(req.method)) {
    return next();
  }
  const csrfHeader = req.get('x-csrf-token');
  if (!req.user?.csrf || !csrfHeader || csrfHeader !== req.user.csrf) {
    return res.status(403).json({ message: 'CSRF token missing or invalid.' });
  }
  next();
}

export function safeUser(user) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.full_name,
    accountNumber: user.account_number
  };
}
