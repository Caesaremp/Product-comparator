import type { Product, ProductCategory } from "../../types/product";
import { calcBlenderScores } from "./blender";
import { CPU_DIMENSIONS, calcCpuScores } from "./cpu";
import { GPU_DIMENSIONS, calcGpuScores } from "./gpu";
import type { CategoryScores } from "./helpers";
import { calcMonitorScores } from "./monitor";
import { MOTHERBOARD_DIMENSIONS, calcMotherboardScores } from "./motherboard";
import { PSU_DIMENSIONS, calcPsuScores } from "./psu";
import { RAM_DIMENSIONS, calcRamScores } from "./ram";

export interface ScoreDimension {
  /** Stable key used in `CategoryScores.perf` / `.qp` and in sort modes. */
  key: string;
  label: string;
  /** Compact label for the product row bars. */
  shortLabel: string;
}

export interface CategoryScoring {
  /** Optional parent grouping, used to group the sort options. */
  group?: string;
  dimensions: ScoreDimension[];
  compute: (product: Product, peers: Product[]) => CategoryScores | null;
}

export const PC_COMPONENTS_GROUP = "Componenti PC";

export const CATEGORY_SCORING: Partial<Record<ProductCategory, CategoryScoring>> = {
  Monitor: {
    dimensions: [
      { key: "coding", label: "Coding", shortLabel: "Coding" },
      { key: "gaming", label: "Gaming", shortLabel: "Gaming" },
      { key: "grafica", label: "Grafica", shortLabel: "Grafica" },
    ],
    compute: (product, peers) => {
      const scores = calcMonitorScores(product, peers);
      if (!scores) return null;
      return {
        perf: { coding: scores.coding, gaming: scores.gaming, grafica: scores.grafica },
        qp: { coding: scores.codingQP, gaming: scores.gamingQP, grafica: scores.graficaQP },
        overall: scores.overall,
        overallQP: scores.overallQP,
      };
    },
  },
  Frullatore: {
    dimensions: [
      { key: "smoothie", label: "Smoothie", shortLabel: "Smooth" },
      { key: "ghiaccio", label: "Ghiaccio", shortLabel: "Ghiacc" },
      { key: "famiglia", label: "Famiglia", shortLabel: "Fam." },
      { key: "pulizia", label: "Pulizia", shortLabel: "Pulizia" },
    ],
    compute: (product, peers) => {
      const scores = calcBlenderScores(product, peers);
      if (!scores) return null;
      return {
        perf: {
          smoothie: scores.smoothie,
          ghiaccio: scores.ghiaccio,
          famiglia: scores.famiglia,
          pulizia: scores.pulizia,
        },
        qp: {
          smoothie: scores.smoothieQP,
          ghiaccio: scores.ghiaccioQP,
          famiglia: scores.famigliaQP,
          pulizia: scores.puliziaQP,
        },
        overall: scores.overall,
        overallQP: scores.overallQP,
      };
    },
  },
  RAM: {
    group: PC_COMPONENTS_GROUP,
    dimensions: RAM_DIMENSIONS,
    compute: calcRamScores,
  },
  "Scheda Madre": {
    group: PC_COMPONENTS_GROUP,
    dimensions: MOTHERBOARD_DIMENSIONS,
    compute: calcMotherboardScores,
  },
  CPU: {
    group: PC_COMPONENTS_GROUP,
    dimensions: CPU_DIMENSIONS,
    compute: calcCpuScores,
  },
  GPU: {
    group: PC_COMPONENTS_GROUP,
    dimensions: GPU_DIMENSIONS,
    compute: calcGpuScores,
  },
  Alimentatore: {
    group: PC_COMPONENTS_GROUP,
    dimensions: PSU_DIMENSIONS,
    compute: calcPsuScores,
  },
};

export const SCORED_CATEGORIES = Object.keys(CATEGORY_SCORING) as ProductCategory[];

export function getCategoryScoring(category: ProductCategory): CategoryScoring | null {
  return CATEGORY_SCORING[category] ?? null;
}

/** Scores a product against the other products of its own category. */
export function calcCategoryScores(product: Product, allProducts: Product[]): CategoryScores | null {
  const scoring = CATEGORY_SCORING[product.category];
  if (!scoring) return null;

  const peers = allProducts.filter((entry) => entry.category === product.category);
  return scoring.compute(product, peers.length > 0 ? peers : [product]);
}

/** Reads one dimension (or `overall`) out of a product's scores. */
export function getDimensionScore(
  product: Product,
  allProducts: Product[],
  dimension: string,
  qualityPrice: boolean,
): number | null {
  const scores = calcCategoryScores(product, allProducts);
  if (!scores) return null;
  if (dimension === "overall") return qualityPrice ? scores.overallQP : scores.overall;
  const values = qualityPrice ? scores.qp : scores.perf;
  return values[dimension] ?? null;
}
