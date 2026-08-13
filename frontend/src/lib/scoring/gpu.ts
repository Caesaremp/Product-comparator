import type { Product } from "../../types/product";
import {
  type CategoryScores,
  PCIE_TIERS,
  buildCategoryScores,
  composeOverall,
  priceMultiplier,
  rankBy,
  rankSpec,
  specNumber,
  tierScore,
  weightedAverage,
} from "./helpers";

export const GPU_DIMENSIONS = [
  { key: "gaming", label: "Gaming (raster)", shortLabel: "Gaming" },
  { key: "raytracing", label: "Ray tracing", shortLabel: "RT" },
  { key: "creazione", label: "Creazione / AI", shortLabel: "Creaz." },
  { key: "efficienza", label: "Efficienza", shortLabel: "Effic." },
  { key: "compattezza", label: "Compattezza", shortLabel: "Compat." },
];

const USE_CASE_WEIGHTS: Record<string, Record<string, number>> = {
  "Gaming":         { gaming: 100 },
  "Ray tracing":    { raytracing: 100 },
  "Creazione/AI":   { creazione: 100 },
  "Efficienza":     { efficienza: 100 },
  "Build compatta": { compattezza: 100 },
};

const MEMORY_TYPE_TIERS: Array<[RegExp, number]> = [
  [/hbm/, 100],
  [/gddr7/, 100],
  [/gddr6x/, 85],
  [/gddr6/, 70],
  [/gddr5/, 40],
];

const RAY_TRACING_TIERS: Array<[RegExp, number]> = [
  [/4[ª^]?\s*gen/, 100],
  [/3[ª^]?\s*gen/, 85],
  [/2[ª^]?\s*gen/, 70],
  [/^no$/, 0],
  [/sì|si|yes/, 55],
];

const UPSCALING_TIERS: Array<[RegExp, number]> = [
  [/dlss\s*4|fsr\s*4|xess\s*2/, 100],
  [/dlss\s*3|fsr\s*3/, 85],
  [/dlss|fsr|xess/, 70],
  [/^(?:no|nessuno)$/, 0],
];

/** Memory bandwidth in GB/s — bus width and memory clock only matter together. */
function memoryBandwidth(product: Product): number | null {
  const bus = specNumber(product, "memoryBus");
  const speed = specNumber(product, "memorySpeed");
  if (bus === null || speed === null) return null;
  return (bus * speed) / 8;
}

function performancePerWatt(product: Product): number | null {
  const benchmark = specNumber(product, "benchmark3d");
  const tdp = specNumber(product, "tdp");
  if (benchmark === null || tdp === null || tdp <= 0) return null;
  return benchmark / tdp;
}

export function calcGpuScores(product: Product, peers: Product[]): CategoryScores | null {
  if (peers.length === 0) return null;

  const benchmark = rankSpec(product, peers, "benchmark3d");
  const vram = rankSpec(product, peers, "vram");
  const shadingUnits = rankSpec(product, peers, "shadingUnits");
  const boostClock = rankSpec(product, peers, "boostClock");
  const bandwidth = rankBy(product, peers, memoryBandwidth);
  const perfPerWatt = rankBy(product, peers, performancePerWatt);
  const lowTdp = rankSpec(product, peers, "tdp", true);
  const lowPsu = rankSpec(product, peers, "recommendedPsu", true);
  const shortCard = rankSpec(product, peers, "length", true);
  const fewSlots = rankSpec(product, peers, "slots", true);
  const memoryType = tierScore(product.specs.memoryType, MEMORY_TYPE_TIERS);
  const rayTracing = tierScore(product.specs.rayTracing, RAY_TRACING_TIERS);
  const upscaling = tierScore(product.specs.upscaling, UPSCALING_TIERS);
  const pcie = tierScore(product.specs.pcieVersion, PCIE_TIERS);

  const perf: Record<string, number> = {
    gaming: weightedAverage([
      { score: benchmark, weight: 40 },
      { score: bandwidth, weight: 18 },
      { score: shadingUnits, weight: 14 },
      { score: vram, weight: 13 },
      { score: boostClock, weight: 10 },
      { score: pcie, weight: 5 },
    ]),
    raytracing: weightedAverage([
      { score: benchmark, weight: 30 },
      { score: rayTracing, weight: 25 },
      { score: vram, weight: 18 },
      { score: upscaling, weight: 15 },
      { score: bandwidth, weight: 12 },
    ]),
    creazione: weightedAverage([
      { score: vram, weight: 40 },
      { score: bandwidth, weight: 20 },
      { score: benchmark, weight: 20 },
      { score: memoryType, weight: 10 },
      { score: shadingUnits, weight: 10 },
    ]),
    efficienza: weightedAverage([
      { score: perfPerWatt, weight: 55 },
      { score: lowTdp, weight: 25 },
      { score: lowPsu, weight: 20 },
    ]),
    compattezza: weightedAverage([
      { score: shortCard, weight: 40 },
      { score: fewSlots, weight: 30 },
      { score: lowTdp, weight: 15 },
      { score: lowPsu, weight: 15 },
    ]),
  };

  const overall = composeOverall(perf, product.useCases, USE_CASE_WEIGHTS);
  return buildCategoryScores(perf, overall, priceMultiplier(product, peers, 500));
}
