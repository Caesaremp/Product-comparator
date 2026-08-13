import type { Product } from "../../types/product";
import {
  type CategoryScores,
  PCIE_TIERS,
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

export const CPU_DIMENSIONS = [
  { key: "gaming", label: "Gaming", shortLabel: "Gaming" },
  { key: "produttivita", label: "Produttività", shortLabel: "Produtt." },
  { key: "efficienza", label: "Efficienza", shortLabel: "Effic." },
  { key: "overclock", label: "Overclock", shortLabel: "OC" },
];

const USE_CASE_WEIGHTS: Record<string, Record<string, number>> = {
  "Gaming":       { gaming: 100 },
  "Produttività": { produttivita: 100 },
  "Efficienza":   { efficienza: 100 },
  "Overclock":    { overclock: 100 },
  "Workstation":  { produttivita: 80, efficienza: 20 },
};

function totalCores(product: Product): number | null {
  const performance = specNumber(product, "cores");
  const efficiency = specNumber(product, "efficiencyCores");
  if (performance === null && efficiency === null) return null;
  return (performance ?? 0) + (efficiency ?? 0);
}

/** Games barely use more than eight cores, so the count saturates there. */
function gamingCores(product: Product): number | null {
  const total = totalCores(product);
  return total === null ? null : Math.min(total, 8);
}

/** Highest memory speed the CPU officially supports, e.g. "DDR5-5600" → 5600. */
function memorySpeedSupport(product: Product): number | null {
  const raw = product.specs.memorySupport;
  if (!raw) return null;
  const matches = String(raw).match(/\d{4,5}/g);
  if (!matches) return null;
  return Math.max(...matches.map(Number));
}

/** Power actually drawn under load: max power when declared, TDP otherwise. */
function powerDraw(product: Product): number | null {
  return specNumber(product, "maxPower") ?? specNumber(product, "tdp");
}

function performancePerWatt(product: Product): number | null {
  const multi = specNumber(product, "benchmarkMulti");
  const power = powerDraw(product);
  if (multi === null || power === null || power <= 0) return null;
  return multi / power;
}

export function calcCpuScores(product: Product, peers: Product[]): CategoryScores | null {
  if (peers.length === 0) return null;

  const singleCore = rankSpec(product, peers, "benchmarkSingle");
  const multiCore = rankSpec(product, peers, "benchmarkMulti");
  const boostClock = rankSpec(product, peers, "boostClock");
  const l3Cache = rankSpec(product, peers, "l3Cache");
  const threads = rankSpec(product, peers, "threads");
  const pcieLanes = rankSpec(product, peers, "pcieLanes");
  const cores = rankBy(product, peers, totalCores);
  const coresForGaming = rankBy(product, peers, gamingCores);
  const memory = rankBy(product, peers, memorySpeedSupport);
  const perfPerWatt = rankBy(product, peers, performancePerWatt);
  const lowPower = rankBy(product, peers, powerDraw, true);
  const tdp = rankSpec(product, peers, "tdp", true);
  const lithography = rankSpec(product, peers, "lithography", true);
  const powerHeadroom = rankBy(product, peers, powerDraw);
  const pcie = tierScore(product.specs.pcieVersion, PCIE_TIERS);
  const unlocked = flagScore(product.specs.unlocked);

  const perf: Record<string, number> = {
    gaming: weightedAverage([
      { score: singleCore, weight: 30 },
      { score: l3Cache, weight: 27 },
      { score: boostClock, weight: 13 },
      { score: coresForGaming, weight: 10 },
      { score: memory, weight: 10 },
      { score: pcie, weight: 10 },
    ]),
    produttivita: weightedAverage([
      { score: multiCore, weight: 40 },
      { score: cores, weight: 22 },
      { score: threads, weight: 15 },
      { score: l3Cache, weight: 10 },
      { score: memory, weight: 8 },
      { score: pcieLanes, weight: 5 },
    ]),
    efficienza: weightedAverage([
      { score: perfPerWatt, weight: 50 },
      { score: tdp, weight: 25 },
      { score: lithography, weight: 15 },
      { score: lowPower, weight: 10 },
    ]),
    overclock: weightedAverage([
      { score: unlocked, weight: 30 },
      { score: boostClock, weight: 22 },
      { score: singleCore, weight: 18 },
      { score: lithography, weight: 15 },
      { score: powerHeadroom, weight: 15 },
    ]),
  };

  const overall = composeOverall(perf, product.useCases, USE_CASE_WEIGHTS);
  return buildCategoryScores(perf, overall, priceMultiplier(product, peers, 300));
}
