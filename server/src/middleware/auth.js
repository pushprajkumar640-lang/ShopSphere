import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

// Verifies the Bearer JWT and loads the CURRENT user row (so role changes / deletions take effect immediately).
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError(401, 'Authentication required');

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    } catch {
      throw new AppError(401, 'Session is invalid or expired. Please sign in again.');
    }

    const { rows } = await query('SELECT id, name, email, role FROM users WHERE id = $1', [payload.sub]);
    if (!rows[0]) throw new AppError(401, 'User no longer exists');
    req.user = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

// Server-side authorization: never trust the client to hide admin UI.
export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') return next(new AppError(403, 'Admin access required'));
  next();
}
