import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

const BCRYPT_ROUNDS = 12;

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export async function register(req, res) {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     RETURNING id, name, email, role`,
    [name, email, passwordHash],
  ).catch((err) => {
    if (err.code === '23505') throw new AppError(409, 'An account with this email already exists');
    throw err;
  });
  res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  // Constant-ish timing: always run bcrypt so response time doesn't reveal whether the email exists.
  const valid = await bcrypt.compare(password, user?.password_hash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !valid) throw new AppError(401, 'Invalid email or password');
  res.json({ token: signToken(user), user: publicUser(user) });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}
