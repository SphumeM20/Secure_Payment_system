import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5001),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'DEV_ONLY_CHANGE_ME_0123456789_LONG_SECRET',
  webOrigin: process.env.WEB_ORIGIN || 'https://localhost:5173',
  dbPath: process.env.DB_PATH || './data/secure_payments.sqlite',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12)
};

if (config.env === 'production' && config.jwtSecret.includes('CHANGE_ME')) {
  throw new Error('JWT_SECRET must be changed in production.');
}
