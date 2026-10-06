export function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getProductDiscount(product: { price: number; oldPrice?: number | null; promoPrice?: number | null }) {
  const base = product.oldPrice ?? product.promoPrice ?? product.price;
  if (!base || base <= product.price) return 0;
  return Math.round(((base - product.price) / base) * 100);
}

export function getProductPrice(product: { price: number; promoPrice?: number | null }) {
  return product.promoPrice ?? product.price;
}

export function getSafeImageUrl(url?: string | null) {
  return url && url.startsWith("https://") ? url : "/images/placeholder.svg";
}

export function buildOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CMD-${new Date().getFullYear()}-${timestamp}-${suffix}`;
}
