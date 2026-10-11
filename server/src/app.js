import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
// Optional single-service deployment: serve the built React app from the API when it exists.
const clientDist = process.env.CLIENT_DIST || path.resolve(here, '../../client/dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }));
  app.use(cors({ origin: env.clientOrigins, credentials: false }));
  app.use(express.json({ limit: '100kb' }));

  // Brute-force protection on auth endpoints.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message: 'Too many attempts. Try again in 15 minutes.' } },
  });
  app.use('/api/auth', authLimiter);

  app.use('/api', routes);
  app.use('/api', notFound);

  if (env.nodeEnv === 'production' && fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist, { maxAge: '1y', index: false }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
