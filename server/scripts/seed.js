import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { pool } from '../src/db/pool.js';

const categories = [
  ['Electronics', 'electronics'],
  ['Fashion', 'fashion'],
  ['Home & Living', 'home-living'],
  ['Sports & Fitness', 'sports-fitness'],
  ['Books', 'books'],
];

// image_url uses stable Unsplash/Picsum-style placeholders; swap for your own assets in production.
const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

const products = [
  ['Wireless Noise-Cancelling Headphones', 'Over-ear Bluetooth headphones with 30-hour battery and adaptive ANC.', 5999, 25, 40, 4.6, 'electronics', true],
  ['Smart Fitness Watch', 'Heart-rate, SpO2 and sleep tracking with a 7-day battery.', 3499, 15, 60, 4.3, 'electronics', true],
  ['4K Ultra HD Action Camera', 'Waterproof 4K60 camera with image stabilisation and voice control.', 8499, 10, 12, 4.5, 'electronics', false],
  ['Portable Bluetooth Speaker', 'Compact IP67 speaker with deep bass and 12-hour playtime.', 1999, 30, 80, 4.2, 'electronics', false],
  ['Classic Cotton Oxford Shirt', 'Breathable everyday shirt, tailored fit, machine washable.', 1299, 20, 120, 4.4, 'fashion', true],
  ['Slim-Fit Chino Trousers', 'Stretch cotton chinos in navy, a versatile wardrobe staple.', 1799, 0, 90, 4.1, 'fashion', false],
  ['Leather Weekend Backpack', 'Full-grain leather backpack with padded laptop sleeve.', 4299, 35, 25, 4.7, 'fashion', true],
  ['Aviator Polarised Sunglasses', 'UV400 polarised lenses with lightweight metal frame.', 999, 40, 150, 4.0, 'fashion', false],
  ['Ceramic Pour-Over Coffee Set', 'Hand-glazed dripper, carafe and two mugs for slow mornings.', 2199, 10, 35, 4.6, 'home-living', true],
  ['Minimalist Desk Lamp', 'Dimmable LED lamp with USB charging port and warm-to-cool tones.', 1499, 5, 50, 4.3, 'home-living', false],
  ['Non-Stick Cookware Set (5 pc)', 'PFOA-free aluminium set with glass lids, oven-safe to 200°C.', 3299, 30, 18, 4.5, 'home-living', false],
  ['Indoor Plant Pot Trio', 'Matte ceramic planters with bamboo drainage trays.', 899, 0, 70, 4.2, 'home-living', false],
  ['Adjustable Dumbbell Pair', 'Quick-select 2–20 kg dumbbells for compact home training.', 7999, 18, 8, 4.8, 'sports-fitness', true],
  ['Yoga Mat Pro (6mm)', 'Non-slip TPE mat with alignment lines and carry strap.', 1199, 12, 100, 4.5, 'sports-fitness', false],
  ['Resistance Band Set', 'Five latex-free bands with handles, door anchor and carry bag.', 799, 25, 130, 4.1, 'sports-fitness', false],
  ['Atomic Habits (Paperback)', 'James Clear on building good habits and breaking bad ones.', 499, 20, 200, 4.8, 'books', true],
  ['Clean Code', 'Robert C. Martin on writing readable, maintainable software.', 749, 10, 60, 4.7, 'books', false],
  ['The Pragmatic Programmer', 'Timeless advice for software craftsmanship, 20th anniversary edition.', 899, 0, 45, 4.6, 'books', false],
];

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const catIds = {};
    for (const [name, slug] of categories) {
      const { rows } = await client.query(
        `INSERT INTO categories (name, slug) VALUES ($1,$2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [name, slug]);
      catIds[slug] = rows[0].id;
    }

    // Seed products only when the table is empty, so re-running never duplicates catalog data.
    const { rows: [{ count }] } = await client.query('SELECT COUNT(*)::int AS count FROM products');
    if (count === 0) {
      for (const [name, description, price, discount, stock, rating, cat, featured] of products) {
        await client.query(
          `INSERT INTO products (name, description, price, discount_percent, stock, rating, image_url, is_featured, category_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [name, description, price, discount, stock, rating, img(name.toLowerCase().replace(/\W+/g, '-')), featured, catIds[cat]],
        );
      }
      console.log(`Seeded ${products.length} products`);
    } else {
      console.log('Products already present, skipping product seed');
    }

    if (env.adminEmail && env.adminPassword) {
      const hash = await bcrypt.hash(env.adminPassword, 12);
      await client.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ('Store Admin', $1, $2, 'admin')
         ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash`,
        [env.adminEmail.toLowerCase(), hash],
      );
      console.log(`Admin account ready: ${env.adminEmail}`);
    }

    await client.query('COMMIT');
    console.log('Seeding complete');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
