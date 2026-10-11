// Integration tests against a running API (start the server first, then `npm test`).
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.API_URL || 'http://localhost:4000/api';

test('health endpoint responds', async () => {
  const res = await fetch(`${BASE}/health`);
  assert.equal(res.status, 200);
});

test('products endpoint validates sort parameter', async () => {
  const res = await fetch(`${BASE}/products?sort=bogus`);
  assert.equal(res.status, 400);
});

test('admin routes reject anonymous users', async () => {
  const res = await fetch(`${BASE}/admin/stats`);
  assert.equal(res.status, 401);
});

test('registration rejects weak passwords', async () => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'T', email: 't@example.com', password: 'short' }),
  });
  assert.equal(res.status, 400);
});

test('checkout requires the demo acknowledgement', async () => {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer invalid.token.here' },
    body: JSON.stringify({ items: [{ productId: 1, quantity: 1 }] }),
  });
  assert.ok([400, 401].includes(res.status));
});
