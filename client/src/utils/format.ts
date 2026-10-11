const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export const formatINR = (n: number) => inr.format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const discountedPrice = (price: number, discountPercent: number) =>
  Math.round(price * (100 - discountPercent)) / 100;
