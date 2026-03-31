import { CATEGORY_FIELDS } from "../data/catalog";
import type { Product } from "../types/product";

export function calcQualityPriceIndex(product: Product): number | null {
  const price = Number.parseFloat(String(product.price));
  if (!price || price <= 0) {
    return null;
  }

  let score = 0;
  let factors = 0;

  if (product.rating) {
    score += (product.rating / 5) * 40;
    factors += 1;
  }

  if (product.useCases.length) {
    score += Math.min(product.useCases.length / 4, 1) * 20;
    factors += 1;
  }

  const categoryFields = CATEGORY_FIELDS[product.category] ?? CATEGORY_FIELDS.Generico;
  const filledSpecs = categoryFields.filter((field) => product.specs[field.key]?.toString().trim()).length;
  score += (filledSpecs / categoryFields.length) * 20;
  factors += 1;

  if (product.reviews.length) {
    score += Math.min(product.reviews.length / 5, 1) * 20;
    factors += 1;
  }

  if (factors === 0) {
    return null;
  }

  const qualityScore = score / factors;
  const priceNorm = Math.max(1, 10 - Math.log10(price) * 2);
  return Math.round((qualityScore * priceNorm) / 10);
}

export function getQualityPriceColor(index: number | null): string {
  if (index === null) {
    return "var(--c-muted)";
  }
  if (index >= 75) {
    return "#22c55e";
  }
  if (index >= 50) {
    return "#eab308";
  }
  if (index >= 30) {
    return "#f97316";
  }
  return "#ef4444";
}

export function getQualityPriceLabel(index: number | null): string {
  if (index === null) {
    return "N/D";
  }
  if (index >= 75) {
    return "Eccellente";
  }
  if (index >= 50) {
    return "Buono";
  }
  if (index >= 30) {
    return "Discreto";
  }
  return "Scarso";
}
