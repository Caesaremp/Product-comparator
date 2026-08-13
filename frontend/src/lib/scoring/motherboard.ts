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

export const MOTHERBOARD_DIMENSIONS = [
  { key: "gaming", label: "Gaming", shortLabel: "Gaming" },
  { key: "produttivita", label: "Produttività / Espandibilità", shortLabel: "Espand." },
  { key: "overclock", label: "Overclock", shortLabel: "OC" },
  { key: "connettivita", label: "Connettività", shortLabel: "Connett." },
];

const USE_CASE_WEIGHTS: Record<string, Record<string, number>> = {
  "Gaming":       { gaming: 100 },
  "Produttività": { produttivita: 100 },
  "Overclock":    { overclock: 100 },
  "Connettività": { connettivita: 100 },
  "Workstation":  { produttivita: 70, connettivita: 30 },
};

/** Chipset tiers follow the vendor letter convention (Intel Z/B/H, AMD X/B/A). */
const CHIPSET_TIERS: Array<[RegExp, number]> = [
  [/^(?:trx|wrx|w)\d/, 100],
  [/^[xz]\d+\s*e\b/, 100],
  [/^[xz]\d/, 90],
  [/^b\d/, 70],
  [/^[ha]\d/, 45],
];

const WIFI_TIERS: Array<[RegExp, number]> = [
  [/7/, 100],
  [/6e/, 88],
  [/6/, 75],
  [/5/, 55],
  [/^no$/, 0],
];

const NETWORK_TIERS: Array<[RegExp, number]> = [
  [/10\s*gbe/, 100],
  [/5\s*gbe/, 88],
  [/2\.5\s*gbe/, 75],
  [/1\s*gbe/, 45],
];

const AUDIO_TIERS: Array<[RegExp, number]> = [
  [/ess|sabre|alc4082/, 100],
  [/alc4080/, 92],
  [/alc12\d\d/, 80],
  [/alc1150/, 68],
  [/alc(?:897|892|888|887)/, 50],
];

/** Full-size boards leave room for VRM heatsinks and airflow. */
const FORM_FACTOR_TIERS: Array<[RegExp, number]> = [
  [/e-atx/, 100],
  [/micro-atx|matx|m-atx/, 70],
  [/mini-itx|itx/, 45],
  [/atx/, 100],
];

function usbPortCount(product: Product): number | null {
  const rear = specNumber(product, "rearUsbPorts");
  const typeC = specNumber(product, "usbCPorts");
  if (rear === null && typeC === null) return null;
  return (rear ?? 0) + (typeC ?? 0);
}

export function calcMotherboardScores(product: Product, peers: Product[]): CategoryScores | null {
  if (peers.length === 0) return null;

  const chipset = tierScore(product.specs.chipset, CHIPSET_TIERS);
  const pcie = tierScore(product.specs.pcieVersion, PCIE_TIERS);
  const wifi = tierScore(product.specs.wifi, WIFI_TIERS);
  const network = tierScore(product.specs.networking, NETWORK_TIERS);
  const audio = tierScore(product.specs.audioCodec, AUDIO_TIERS);
  const formFactor = tierScore(product.specs.formFactor, FORM_FACTOR_TIERS);
  const vrm = rankSpec(product, peers, "vrmPhases");
  const memorySlots = rankSpec(product, peers, "memorySlots");
  const maxMemory = rankSpec(product, peers, "maxMemory");
  const maxMemorySpeed = rankSpec(product, peers, "maxMemorySpeed");
  const m2Slots = rankSpec(product, peers, "m2Slots");
  const sataPorts = rankSpec(product, peers, "sataPorts");
  const pcieX16 = rankSpec(product, peers, "pcieX16Slots");
  const usbC = rankSpec(product, peers, "usbCPorts");
  const fanHeaders = rankSpec(product, peers, "fanHeaders");
  const usbPorts = rankBy(product, peers, usbPortCount);
  const biosFlashback = flagScore(product.specs.biosFlashback);

  const perf: Record<string, number> = {
    gaming: weightedAverage([
      { score: pcie, weight: 22 },
      { score: vrm, weight: 18 },
      { score: chipset, weight: 15 },
      { score: m2Slots, weight: 15 },
      { score: maxMemorySpeed, weight: 15 },
      { score: audio, weight: 8 },
      { score: wifi, weight: 7 },
    ]),
    produttivita: weightedAverage([
      { score: m2Slots, weight: 20 },
      { score: maxMemory, weight: 15 },
      { score: usbPorts, weight: 15 },
      { score: pcieX16, weight: 13 },
      { score: network, weight: 13 },
      { score: sataPorts, weight: 12 },
      { score: memorySlots, weight: 12 },
    ]),
    overclock: weightedAverage([
      { score: vrm, weight: 33 },
      { score: chipset, weight: 22 },
      { score: maxMemorySpeed, weight: 22 },
      { score: formFactor, weight: 13 },
      { score: biosFlashback, weight: 10 },
    ]),
    connettivita: weightedAverage([
      { score: usbPorts, weight: 25 },
      { score: usbC, weight: 20 },
      { score: network, weight: 20 },
      { score: wifi, weight: 20 },
      { score: audio, weight: 10 },
      { score: fanHeaders, weight: 5 },
    ]),
  };

  const overall = composeOverall(perf, product.useCases, USE_CASE_WEIGHTS);
  return buildCategoryScores(perf, overall, priceMultiplier(product, peers, 200));
}
