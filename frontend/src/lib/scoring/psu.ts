import type { Product } from "../../types/product";
import {
  type CategoryScores,
  buildCategoryScores,
  composeOverall,
  countDelimitedValues,
  flagScore,
  priceMultiplier,
  rankCount,
  rankSpec,
  tierScore,
  weightedAverage,
} from "./helpers";

export const PSU_DIMENSIONS = [
  { key: "potenza", label: "Potenza / Headroom", shortLabel: "Potenza" },
  { key: "efficienza", label: "Efficienza", shortLabel: "Effic." },
  { key: "silenziosita", label: "Silenziosità", shortLabel: "Silenz." },
  { key: "affidabilita", label: "Affidabilità", shortLabel: "Affid." },
  { key: "compattezza", label: "Compattezza", shortLabel: "Compat." },
];

const USE_CASE_WEIGHTS: Record<string, Record<string, number>> = {
  "Build high-end": { potenza: 100 },
  "Efficienza":     { efficienza: 100 },
  "Silenziosità":   { silenziosita: 100 },
  "Affidabilità":   { affidabilita: 100 },
  "Build compatta": { compattezza: 100 },
};

const EFFICIENCY_TIERS: Array<[RegExp, number]> = [
  [/titanium/, 100],
  [/platinum/, 92],
  [/gold/, 80],
  [/silver/, 65],
  [/bronze/, 55],
  [/white/, 40],
  [/^no$/, 20],
];

const ATX_TIERS: Array<[RegExp, number]> = [
  [/3\.1/, 100],
  [/3\.0/, 85],
  [/2\./, 50],
];

const MODULAR_TIERS: Array<[RegExp, number]> = [
  [/full/, 100],
  [/semi/, 65],
  [/non modulare/, 30],
];

const BEARING_TIERS: Array<[RegExp, number]> = [
  [/levitazione|magnetic/, 100],
  [/fdb|fluid/, 92],
  [/rifle/, 80],
  [/ball/, 65],
  [/sleeve/, 40],
];

/** Small form factors are the point of a compact build, ATX is the baseline. */
const FORM_FACTOR_TIERS: Array<[RegExp, number]> = [
  [/sfx-l/, 85],
  [/sfx/, 100],
  [/tfx/, 85],
  [/atx/, 50],
];

function protectionCount(product: Product): number {
  return countDelimitedValues(product.specs.protections);
}

export function calcPsuScores(product: Product, peers: Product[]): CategoryScores | null {
  if (peers.length === 0) return null;

  const wattage = rankSpec(product, peers, "wattage");
  const pcie5 = rankSpec(product, peers, "pcie5Connectors");
  const pcieConnectors = rankSpec(product, peers, "pcieConnectors");
  const sataConnectors = rankSpec(product, peers, "sataConnectors");
  const fanSize = rankSpec(product, peers, "fanSize");
  const quiet = rankSpec(product, peers, "noise", true);
  const shallow = rankSpec(product, peers, "depth", true);
  const warranty = rankSpec(product, peers, "warranty");
  const protections = rankCount(product, peers, protectionCount);
  const efficiency = tierScore(product.specs.efficiencyRating, EFFICIENCY_TIERS);
  const atx = tierScore(product.specs.atxVersion, ATX_TIERS);
  const modular = tierScore(product.specs.modular, MODULAR_TIERS);
  const bearing = tierScore(product.specs.fanBearing, BEARING_TIERS);
  const formFactor = tierScore(product.specs.formFactor, FORM_FACTOR_TIERS);
  const zeroRpm = flagScore(product.specs.zeroRpm);
  const japaneseCapacitors = flagScore(product.specs.japaneseCapacitors);

  const perf: Record<string, number> = {
    potenza: weightedAverage([
      { score: wattage, weight: 45 },
      { score: pcie5, weight: 20 },
      { score: pcieConnectors, weight: 20 },
      { score: sataConnectors, weight: 15 },
    ]),
    efficienza: weightedAverage([
      { score: efficiency, weight: 65 },
      { score: atx, weight: 20 },
      { score: japaneseCapacitors, weight: 15 },
    ]),
    silenziosita: weightedAverage([
      { score: quiet, weight: 35 },
      { score: zeroRpm, weight: 30 },
      { score: fanSize, weight: 20 },
      { score: bearing, weight: 15 },
    ]),
    affidabilita: weightedAverage([
      { score: warranty, weight: 32 },
      { score: efficiency, weight: 20 },
      { score: protections, weight: 20 },
      { score: japaneseCapacitors, weight: 16 },
      { score: bearing, weight: 12 },
    ]),
    compattezza: weightedAverage([
      { score: shallow, weight: 45 },
      { score: formFactor, weight: 35 },
      { score: modular, weight: 20 },
    ]),
  };

  const overall = composeOverall(perf, product.useCases, USE_CASE_WEIGHTS);
  return buildCategoryScores(perf, overall, priceMultiplier(product, peers, 120));
}
