import type { Product } from "../../types/product";
import {
  type CategoryScores,
  buildCategoryScores,
  composeOverall,
  flagScore,
  priceMultiplier,
  rankBy,
  rankSpec,
  specNumber,
  tierScore,
  weightedAverage,
} from "./helpers";

export const RAM_DIMENSIONS = [
  { key: "gaming", label: "Gaming", shortLabel: "Gaming" },
  { key: "produttivita", label: "Produttività", shortLabel: "Produtt." },
  { key: "overclock", label: "Overclock", shortLabel: "OC" },
  { key: "compatibilita", label: "Compatibilità", shortLabel: "Compat." },
];

const USE_CASE_WEIGHTS: Record<string, Record<string, number>> = {
  "Gaming":         { gaming: 100 },
  "Produttività":   { produttivita: 100 },
  "Overclock":      { overclock: 100 },
  "Build compatta": { compatibilita: 100 },
  "Workstation":    { produttivita: 80, compatibilita: 20 },
};

const MEMORY_TYPE_TIERS: Array<[RegExp, number]> = [
  [/ddr5/, 100],
  [/ddr4/, 60],
  [/ddr3/, 25],
];

const PROFILE_TIERS: Array<[RegExp, number]> = [
  [/xmp\s*\+\s*expo/, 100],
  [/expo/, 85],
  [/xmp/, 85],
  [/^no$/, 0],
];

/** True latency in ns — the metric that actually matters, not CL alone. */
function trueLatencyNs(product: Product): number | null {
  const cas = specNumber(product, "casLatency");
  const speed = specNumber(product, "speed");
  if (cas === null || speed === null || speed <= 0) return null;
  return (cas * 2000) / speed;
}

/** Two modules hit dual channel with the least stress on the memory controller. */
function moduleLayoutScore(product: Product): number | null {
  const modules = specNumber(product, "moduleCount");
  if (modules === null) return null;
  if (modules === 2) return 100;
  if (modules === 4) return 75;
  if (modules === 1) return 45;
  return 60;
}

function moduleCompatibilityScore(product: Product): number | null {
  const modules = specNumber(product, "moduleCount");
  if (modules === null) return null;
  if (modules <= 2) return 100;
  if (modules === 4) return 55;
  return 35;
}

export function calcRamScores(product: Product, peers: Product[]): CategoryScores | null {
  if (peers.length === 0) return null;

  const memoryType = tierScore(product.specs.memoryType, MEMORY_TYPE_TIERS);
  const profile = tierScore(product.specs.xmpProfile, PROFILE_TIERS);
  const speed = rankSpec(product, peers, "speed");
  const latency = rankBy(product, peers, trueLatencyNs, true);
  const capacity = rankSpec(product, peers, "capacity");
  const height = rankSpec(product, peers, "height", true);
  const voltage = rankSpec(product, peers, "voltage", true);
  const warranty = rankSpec(product, peers, "warranty");
  const heatspreader = flagScore(product.specs.heatspreader);
  const ecc = flagScore(product.specs.eccSupport);
  const layout = moduleLayoutScore(product);
  const compatLayout = moduleCompatibilityScore(product);

  const perf: Record<string, number> = {
    gaming: weightedAverage([
      { score: latency, weight: 30 },
      { score: speed, weight: 25 },
      { score: capacity, weight: 20 },
      { score: memoryType, weight: 15 },
      { score: profile, weight: 10 },
    ]),
    produttivita: weightedAverage([
      { score: capacity, weight: 40 },
      { score: speed, weight: 18 },
      { score: latency, weight: 12 },
      { score: layout, weight: 10 },
      { score: memoryType, weight: 10 },
      { score: ecc, weight: 10 },
    ]),
    overclock: weightedAverage([
      { score: speed, weight: 30 },
      { score: latency, weight: 20 },
      { score: profile, weight: 20 },
      { score: heatspreader, weight: 15 },
      { score: voltage, weight: 15 },
    ]),
    compatibilita: weightedAverage([
      { score: height, weight: 35 },
      { score: compatLayout, weight: 20 },
      { score: voltage, weight: 20 },
      { score: profile, weight: 15 },
      { score: warranty, weight: 10 },
    ]),
  };

  const overall = composeOverall(perf, product.useCases, USE_CASE_WEIGHTS);
  return buildCategoryScores(perf, overall, priceMultiplier(product, peers, 100));
}
