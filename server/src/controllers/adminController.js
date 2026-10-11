import { query } from '../db/pool.js';

export async function stats(_req, res) {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM products) AS products,
      (SELECT COUNT(*)::int FROM orders) AS orders,
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS customers,
      (SELECT COALESCE(SUM(total), 0)::float FROM orders) AS revenue,
      (SELECT COUNT(*)::int FROM products WHERE stock <= 5) AS low_stock`);
  res.json({ stats: rows[0] });
}
