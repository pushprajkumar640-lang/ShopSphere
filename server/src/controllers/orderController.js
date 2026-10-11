import { pool, query } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

const SHIPPING_FLAT = 49;
const FREE_SHIPPING_THRESHOLD = 999;

// Demo checkout: prices and stock are read from the DB, never trusted from the client.
export async function placeOrder(req, res) {
  const { items, shipping } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Merge duplicate product lines, then lock rows to prevent overselling under concurrency.
    const qty = new Map();
    for (const it of items) qty.set(it.productId, (qty.get(it.productId) || 0) + it.quantity);
    const ids = [...qty.keys()];

    const { rows: products } = await client.query(
      `SELECT id, name, stock, ROUND(price * (100 - discount_percent) / 100.0, 2) AS final_price
       FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE`,
      [ids],
    );
    if (products.length !== ids.length) throw new AppError(400, 'One or more products are no longer available');

    const lines = products.map((p) => {
      const quantity = qty.get(p.id);
      if (quantity > p.stock) throw new AppError(409, `Only ${p.stock} unit(s) of "${p.name}" left in stock`);
      return { ...p, quantity, unitPrice: Number(p.final_price), lineTotal: Number(p.final_price) * quantity };
    });

    const subtotal = Number(lines.reduce((s, l) => s + l.lineTotal, 0).toFixed(2));
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT;
    const total = Number((subtotal + shippingFee).toFixed(2));

    const { rows: [order] } = await client.query(
      `INSERT INTO orders (user_id, subtotal, shipping, total, shipping_name, shipping_address, shipping_city, shipping_zip, shipping_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, status, subtotal, shipping, total, created_at`,
      [req.user.id, subtotal, shippingFee, total, shipping.fullName, shipping.address, shipping.city, shipping.zip, shipping.phone],
    );

    for (const l of lines) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES ($1,$2,$3,$4,$5)',
        [order.id, l.id, l.name, l.unitPrice, l.quantity],
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [l.quantity, l.id]);
    }

    await client.query('COMMIT');
    res.status(201).json({ order: { ...order, items: lines.map(({ id, name, unitPrice, quantity, lineTotal }) => ({ productId: id, name, unitPrice, quantity, lineTotal })) } });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function attachItems(orders) {
  if (!orders.length) return [];
  const { rows: items } = await query(
    'SELECT order_id, product_id, product_name, unit_price, quantity FROM order_items WHERE order_id = ANY($1::uuid[]) ORDER BY id',
    [orders.map((o) => o.id)],
  );
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) }));
}

export async function myOrders(req, res) {
  const { rows } = await query(
    'SELECT id, status, subtotal, shipping, total, shipping_city, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id],
  );
  res.json({ orders: await attachItems(rows) });
}

export async function getMyOrder(req, res) {
  const { rows } = await query(
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id],
  );
  if (!rows[0]) throw new AppError(404, 'Order not found');
  const [withItems] = await attachItems(rows);
  res.json({ order: withItems });
}

export async function allOrders(_req, res) {
  const { rows } = await query(
    `SELECT o.id, o.status, o.subtotal, o.shipping, o.total, o.shipping_name, o.shipping_city, o.created_at, u.email AS customer_email
     FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 200`,
  );
  res.json({ orders: await attachItems(rows) });
}
