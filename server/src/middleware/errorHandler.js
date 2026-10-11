import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFound(req, res) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// Centralized error handler: never leaks stack traces or DB internals in production.
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { message: 'Validation failed', details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) },
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Malformed JSON body' } });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: { message: 'A record with this value already exists' } });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: { message: 'Referenced record does not exist' } });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { message: 'Something went wrong on the server' } });
}
