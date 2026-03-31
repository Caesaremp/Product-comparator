import type { Product } from "../types/product";

const LEGACY_STORAGE_KEY = "products-data";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const payload = text
    ? (() => {
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return text;
        }
      })()
    : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

async function loadLegacyProducts(): Promise<Product[]> {
  try {
    if (typeof window === "undefined" || !window.storage?.get) {
      return [];
    }

    const result = await window.storage.get(LEGACY_STORAGE_KEY);
    if (!result?.value) {
      return [];
    }

    const parsed = JSON.parse(result.value) as unknown;
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

export async function createProduct(product: Product): Promise<Product> {
  return apiRequest<Product>("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(product: Product): Promise<Product> {
  return apiRequest<Product>(`/products/${encodeURIComponent(product.id)}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export async function deleteProductById(productId: string): Promise<void> {
  await apiRequest(`/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

async function migrateLegacyProducts(products: Product[]): Promise<void> {
  for (const product of products) {
    await createProduct(product);
  }
}

export async function loadProducts(): Promise<Product[]> {
  const products = await apiRequest<Product[]>("/products");
  if (products.length > 0) {
    return products;
  }

  const legacyProducts = await loadLegacyProducts();
  if (legacyProducts.length === 0) {
    return products;
  }

  await migrateLegacyProducts(legacyProducts);
  return apiRequest<Product[]>("/products");
}
