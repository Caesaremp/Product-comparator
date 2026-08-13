import type { Product, ProductSpecValue, SpecKey } from "../../types/product";

// ── Numeric helpers ───────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(lo: number, hi: number, scoreLo: number, scoreHi: number, value: number): number {
  return Math.round(scoreLo + ((value - lo) / (hi - lo)) * (scoreHi - scoreLo));
}

export function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function averageAvailable(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  if (available.length === 0) return null;
  return Math.round(available.reduce((sum, value) => sum + value, 0) / available.length);
}

export interface WeightedEntry {
  score: number | null;
  weight: number;
}

export function weightedAverage(entries: WeightedEntry[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const entry of entries) {
    if (entry.score !== null && entry.weight > 0) {
      weightedSum += entry.score * entry.weight;
      totalWeight += entry.weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

// ── Value readers ─────────────────────────────────────────────────────────────

export function toNumber(value: ProductSpecValue | undefined): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(String(value).replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

export function specNumber(product: Product, key: SpecKey): number | null {
  return toNumber(product.specs[key]);
}

export function hasText(value: ProductSpecValue | undefined): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function hasAffirmative(value: ProductSpecValue | undefined): boolean {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "sì" || normalized === "si" || normalized === "yes" || normalized === "true" || normalized.includes("sì");
}

export function countDelimitedValues(value: ProductSpecValue | undefined): number {
  if (!value) return 0;
  const normalized = String(value)
    .toLowerCase()
    .replace(/\b(?:and|e|con)\b/g, ",")
    .replace(/[+/|]/g, ",");
  return normalized
    .split(/[,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean).length;
}

/**
 * Yes/no specs: affirmative wins, an explicit negative scores 0, a missing
 * value stays null so it does not drag the weighted average down.
 */
export function flagScore(value: ProductSpecValue | undefined, yes = 100, no = 0): number | null {
  if (!hasText(value)) return null;
  if (hasAffirmative(value)) return yes;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "no" || normalized === "false" || normalized === "nessuno") return no;
  return null;
}

/**
 * Categorical specs whose tiers are intrinsic to the technology (80 Plus levels,
 * chipset families, PCIe generations): the first matching entry wins.
 */
export function tierScore(value: ProductSpecValue | undefined, tiers: Array<[RegExp, number]>): number | null {
  if (!hasText(value)) return null;
  const normalized = String(value).trim().toLowerCase();
  for (const [pattern, score] of tiers) {
    if (pattern.test(normalized)) return score;
  }
  return null;
}

/** PCIe generation, shared by motherboards, CPUs and GPUs. */
export const PCIE_TIERS: Array<[RegExp, number]> = [
  [/5\.0|gen\s*5/, 100],
  [/4\.0|gen\s*4/, 75],
  [/3\.0|gen\s*3/, 40],
];

// ── Relative (dataset-driven) scoring ─────────────────────────────────────────

export function scoreRelativeRank(
  value: ProductSpecValue | undefined,
  values: Array<ProductSpecValue | undefined>,
): number | null {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null;

  const sorted = values
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry) && entry > 0)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;

  const lowerCount = sorted.filter((entry) => entry < numericValue).length;
  const equalCount = sorted.filter((entry) => entry === numericValue).length;
  return clamp(Math.round(((lowerCount + equalCount) / sorted.length) * 100), 0, 100);
}

export function scoreRelativeCount(count: number, counts: number[]): number | null {
  if (count <= 0) return null;
  const max = Math.max(...counts, 0);
  if (max <= 0) return null;
  return clamp(Math.round((count / max) * 100), 0, 100);
}

/**
 * Scores a derived numeric value against the other products of its category.
 * `invert` marks metrics where lower is better (latency, power draw, noise, size).
 *
 * Half the score is the percentile (where the product ranks) and half is the
 * ratio to the best value in the dataset (how far it actually is). Percentile
 * alone turns a 3% gap into 30 points when the category holds few products;
 * the ratio keeps the distance meaningful without hardcoding any threshold.
 */
export function rankBy(
  product: Product,
  peers: Product[],
  getValue: (entry: Product) => number | null,
  invert = false,
): number | null {
  const value = getValue(product);
  if (value === null || !Number.isFinite(value) || value <= 0) return null;

  const values = peers
    .map(getValue)
    .filter((entry): entry is number => entry !== null && Number.isFinite(entry) && entry > 0);
  if (values.length === 0) return null;

  const worseCount = invert ? values.filter((entry) => entry > value).length : values.filter((entry) => entry < value).length;
  const equalCount = values.filter((entry) => entry === value).length;
  const percentile = ((worseCount + equalCount) / values.length) * 100;

  const best = invert ? Math.min(...values) : Math.max(...values);
  const ratio = invert ? (best / value) * 100 : (value / best) * 100;

  return clamp(Math.round((percentile + clamp(ratio, 0, 100)) / 2), 0, 100);
}

export function rankSpec(product: Product, peers: Product[], key: SpecKey, invert = false): number | null {
  return rankBy(product, peers, (entry) => specNumber(entry, key), invert);
}

/** Percentile of a feature count (list-like or boolean-derived specs). */
export function rankCount(product: Product, peers: Product[], getCount: (entry: Product) => number): number | null {
  return scoreRelativeCount(getCount(product), peers.map(getCount));
}

// ── Overall & quality/price composition ───────────────────────────────────────

export interface CategoryScores {
  /** Performance score per dimension key, 0–100. */
  perf: Record<string, number>;
  /** Same dimensions corrected by the price multiplier, 0–100. */
  qp: Record<string, number>;
  overall: number;
  overallQP: number;
}

/**
 * Weighs the per-dimension scores with the product's declared use cases; with
 * no use case selected every dimension counts the same.
 */
export function composeOverall(
  perf: Record<string, number>,
  useCases: string[],
  useCaseWeights: Record<string, Record<string, number>>,
): number {
  const dimensions = Object.keys(perf);
  if (dimensions.length === 0) return 0;

  const combined: Record<string, number> = {};
  let totalWeight = 0;

  for (const dimension of dimensions) combined[dimension] = 0;

  for (const useCase of useCases) {
    const weights = useCaseWeights[useCase];
    if (!weights) continue;
    for (const dimension of dimensions) {
      const weight = weights[dimension] || 0;
      combined[dimension] += weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return Math.round(dimensions.reduce((sum, dimension) => sum + perf[dimension], 0) / dimensions.length);
  }

  let overall = 0;
  for (const dimension of dimensions) {
    overall += perf[dimension] * (combined[dimension] / totalWeight);
  }
  return Math.round(overall);
}

/** Median price of the category over the product price, clamped to 0.3–2.0. */
export function priceMultiplier(product: Product, peers: Product[], fallbackMedian: number): number {
  const prices = peers
    .map((entry) => Number.parseFloat(String(entry.price)))
    .filter((price) => !Number.isNaN(price) && price > 0)
    .sort((a, b) => a - b);
  const medianPrice = prices.length > 0 ? median(prices) : fallbackMedian;
  const price = Number.parseFloat(String(product.price));
  return price > 0 ? clamp(medianPrice / price, 0.3, 2.0) : 1.0;
}

export function buildCategoryScores(
  perf: Record<string, number>,
  overall: number,
  multiplier: number,
): CategoryScores {
  const qp: Record<string, number> = {};
  for (const [dimension, score] of Object.entries(perf)) {
    qp[dimension] = clamp(Math.round(score * multiplier), 0, 100);
  }

  return {
    perf,
    qp,
    overall,
    overallQP: clamp(Math.round(overall * multiplier), 0, 100),
  };
}
