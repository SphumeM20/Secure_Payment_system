import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config.js';
import { initialiseDatabase } from './db/database.js';
import { router } from './routes.js';
import { globalLimiter, helmetMiddleware } from './middleware/security.js';

initialiseDatabase();

const app = express();

app.disable('x-powered-by');
app.use(helmetMiddleware);
app.use(globalLimiter);
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: config.webOrigin, credentials: true }));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.use('/api', router);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: error.message || 'Unexpected server error.' });
});

const certPath = path.resolve('certs/localhost-cert.pem');
const keyPath = path.resolve('certs/localhost-key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('Missing HTTPS cert files. Run the provided project with the included certs folder.');
  process.exit(1);
}

https.createServer({
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath)
}, app).listen(config.port, () => {
  console.log(`Secure Payments API running on https://localhost:${config.port}`);
});
