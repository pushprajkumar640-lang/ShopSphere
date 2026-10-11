import { z } from 'zod';

const trimmed = (max) => z.string().trim().min(1, 'This field is required').max(max);

export const registerSchema = z.object({
  name: trimmed(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password is too long')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').max(72),
});

export const productQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating_desc', 'name_asc']).default('newest'),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const productInputSchema = z.object({
  name: trimmed(150),
  description: z.string().trim().max(2000).default(''),
  price: z.coerce.number().min(0).max(1000000),
  discount_percent: z.coerce.number().int().min(0).max(90).default(0),
  stock: z.coerce.number().int().min(0).max(100000),
  rating: z.coerce.number().min(0).max(5).default(0),
  image_url: z.string().trim().max(500).default(''),
  is_featured: z.boolean().default(false),
  category_id: z.coerce.number().int().positive(),
});

export const productUpdateSchema = productInputSchema.partial();

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().min(1).max(20),
  })).min(1, 'Your cart is empty').max(50),
  shipping: z.object({
    fullName: trimmed(100),
    address: trimmed(200),
    city: trimmed(80),
    zip: z.string().trim().regex(/^[A-Za-z0-9 -]{3,12}$/, 'Enter a valid postal code'),
    phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number'),
  }),
  demoAcknowledged: z.literal(true, { errorMap: () => ({ message: 'Please acknowledge this is a demo order' }) }),
});
