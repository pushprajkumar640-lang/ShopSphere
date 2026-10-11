import type { ShippingInfo } from '../lib/types';

export type Errors<T> = Partial<Record<keyof T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9 ()-]{7,20}$/;
const ZIP = /^[A-Za-z0-9 -]{3,12}$/;

export function validateShipping(v: ShippingInfo): Errors<ShippingInfo> {
  const e: Errors<ShippingInfo> = {};
  if (!v.fullName.trim()) e.fullName = 'Full name is required';
  if (v.address.trim().length < 5) e.address = 'Enter a full address';
  if (!v.city.trim()) e.city = 'City is required';
  if (!ZIP.test(v.zip.trim())) e.zip = 'Enter a valid postal code';
  if (!PHONE.test(v.phone.trim())) e.phone = 'Enter a valid phone number';
  return e;
}

export function validateRegister(v: { name: string; email: string; password: string }) {
  const e: Record<string, string> = {};
  if (!v.name.trim()) e.name = 'Name is required';
  if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email';
  if (v.password.length < 8) e.password = 'Password must be at least 8 characters';
  else if (!/[A-Za-z]/.test(v.password) || !/[0-9]/.test(v.password)) e.password = 'Use at least one letter and one number';
  return e;
}

export const isEmpty = (o: object) => Object.keys(o).length === 0;
