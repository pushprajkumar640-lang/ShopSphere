export type Role = 'customer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  product_count?: number;
}

// PostgreSQL NUMERIC columns arrive as strings; the service layer normalises them to numbers.
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_percent: number;
  final_price: number;
  stock: number;
  rating: number;
  image_url: string;
  is_featured: boolean;
  category_id: number;
  category_name: string;
  category_slug: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating_desc' | 'name_asc';
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
}

export interface CartItem {
  productId: number;
  name: string;
  image_url: string;
  unitPrice: number;
  quantity: number;
  stock: number;
}

export interface ShippingInfo {
  fullName: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
}

export interface OrderItem {
  product_id?: number;
  productId?: number;
  product_name?: string;
  name?: string;
  unit_price: number;
  unitPrice?: number;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  shipping_city?: string;
  customer_email?: string;
  created_at: string;
  items: OrderItem[];
}
