import { query } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

const SORT_SQL = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'final_price ASC',
  price_desc: 'final_price DESC',
  rating_desc: 'p.rating DESC, p.id ASC',
  name_asc: 'p.name ASC',
};

// Final price is computed in SQL so sorting/filtering by price reflects the discount.
const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.description, p.price, p.discount_percent, p.stock, p.rating,
         p.image_url, p.is_featured, p.category_id, c.name AS category_name, c.slug AS category_slug,
         ROUND(p.price * (100 - p.discount_percent) / 100.0, 2) AS final_price
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

export async function listProducts(req, res) {
  const { search, category, sort, minPrice, maxPrice, featured, page, limit } = req.query;
  const where = [];
  const params = [];
  const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)); };

  if (search) add('p.name ILIKE ?', `%${search.replace(/[%_]/g, '\\$&')}%`);
  if (category) add('c.slug = ?', category);
  if (featured) add('p.is_featured = ?', featured === 'true');
  if (minPrice !== undefined) add('ROUND(p.price * (100 - p.discount_percent) / 100.0, 2) >= ?', minPrice);
  if (maxPrice !== undefined) add('ROUND(p.price * (100 - p.discount_percent) / 100.0, 2) <= ?', maxPrice);

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countRes = await query(`SELECT COUNT(*)::int AS total FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`, params);

  params.push(limit, (page - 1) * limit);
  const { rows } = await query(
    `${PRODUCT_SELECT} ${whereSql} ORDER BY ${SORT_SQL[sort]} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  res.json({
    products: rows,
    pagination: { page, limit, total: countRes.rows[0].total, totalPages: Math.max(1, Math.ceil(countRes.rows[0].total / limit)) },
  });
}

export async function getProduct(req, res) {
  const { rows } = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [req.params.id]);
  if (!rows[0]) throw new AppError(404, 'Product not found');
  res.json({ product: rows[0] });
}

export async function listCategories(_req, res) {
  const { rows } = await query(
    `SELECT c.id, c.name, c.slug, COUNT(p.id)::int AS product_count
     FROM categories c LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id ORDER BY c.name`,
  );
  res.json({ categories: rows });
}

export async function createProduct(req, res) {
  const p = req.body;
  const { rows } = await query(
    `INSERT INTO products (name, description, price, discount_percent, stock, rating, image_url, is_featured, category_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [p.name, p.description, p.price, p.discount_percent, p.stock, p.rating, p.image_url, p.is_featured, p.category_id],
  );
  const { rows: created } = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [rows[0].id]);
  res.status(201).json({ product: created[0] });
}

export async function updateProduct(req, res) {
  const allowed = ['name', 'description', 'price', 'discount_percent', 'stock', 'rating', 'image_url', 'is_featured', 'category_id'];
  const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!entries.length) throw new AppError(400, 'No updatable fields supplied');
  const setSql = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const values = entries.map(([, v]) => v);
  values.push(req.params.id);
  const { rowCount } = await query(`UPDATE products SET ${setSql} WHERE id = $${values.length}`, values);
  if (!rowCount) throw new AppError(404, 'Product not found');
  const { rows } = await query(`${PRODUCT_SELECT} WHERE p.id = $1`, [req.params.id]);
  res.json({ product: rows[0] });
}

export async function deleteProduct(req, res) {
  const { rowCount } = await query('DELETE FROM products WHERE id = $1', [req.params.id]).catch((err) => {
    if (err.code === '23503') throw new AppError(409, 'This product appears in past orders and cannot be deleted. Set its stock to 0 instead.');
    throw err;
  });
  if (!rowCount) throw new AppError(404, 'Product not found');
  res.status(204).end();
}
