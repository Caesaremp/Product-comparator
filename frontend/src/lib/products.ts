import type { Product } from "../types/product";

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function createEmptyProduct(): Product {
  return {
    id: genId(),
    name: "",
    category: "Monitor",
    price: "",
    url: "",
    rating: 0,
    specs: {},
    useCases: [],
    reviews: [],
    notes: "",
    createdAt: new Date().toISOString(),
  };
}

export function getDisplayName(product: Product): string {
  const brand = product.specs.brand?.toString().trim();
  const model = product.specs.model?.toString().trim();
  if (brand && model) {
    return `${brand} ${model}`;
  }
  return product.name || "Prodotto senza nome";
}
