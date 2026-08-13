import type { Product } from "../../types/product";
import {
  averageAvailable,
  clamp,
  countDelimitedValues,
  hasAffirmative,
  hasText,
  median,
  scoreRelativeCount,
  scoreRelativeRank,
  weightedAverage,
} from "./helpers";

type BlenderCat = "smoothie" | "ghiaccio" | "famiglia" | "pulizia";

export interface BlenderScores {
  smoothie:   number;
  ghiaccio:   number;
  famiglia:   number;
  pulizia:    number;
  overall:    number;
  smoothieQP: number;
  ghiaccioQP: number;
  famigliaQP: number;
  puliziaQP:  number;
  overallQP:  number;
}

function getBlenders(allProducts: Product[]): Product[] {
  return allProducts.filter((entry) => entry.category === "Frullatore");
}

function blenderNumberScore(product: Product, allBlenders: Product[], key: keyof Product["specs"]): number | null {
  return scoreRelativeRank(product.specs[key], allBlenders.map((entry) => entry.specs[key]));
}

function blenderProgramCount(product: Product): number {
  return countDelimitedValues(product.specs.programs);
}

function blenderManualControlCount(product: Product): number {
  return countDelimitedValues(product.specs.manualSpeeds);
}

function blenderBladeFeatureCount(product: Product): number {
  return [
    hasText(product.specs.bladeTechnology),
    hasText(product.specs.bladeMaterial),
    hasText(product.specs.bladeCount),
  ].filter(Boolean).length;
}

function blenderMaterialFeatureCount(product: Product): number {
  return [
    hasText(product.specs.jarMaterial),
    hasText(product.specs.bladeMaterial),
    hasAffirmative(product.specs.bpaFree),
  ].filter(Boolean).length;
}

function blenderCleaningFeatureCount(product: Product): number {
  const programs = String(product.specs.programs || "").toLowerCase();
  const accessories = String(product.specs.includedAccessories || "").toLowerCase();
  return [
    hasAffirmative(product.specs.dishwasherSafe),
    programs.includes("pulizia") || programs.includes("clean"),
    accessories.includes("rimovibil") || accessories.includes("remov"),
  ].filter(Boolean).length;
}

function blenderPortabilityFeatureCount(product: Product): number {
  const accessories = String(product.specs.includedAccessories || "").toLowerCase();
  return [
    hasText(product.specs.travelCupCapacity),
    accessories.includes("bicchiere") || accessories.includes("cup") || accessories.includes("asporto"),
  ].filter(Boolean).length;
}

function blenderAccessoryCount(product: Product): number {
  return countDelimitedValues(product.specs.includedAccessories);
}

function blenderFeatureScore(product: Product, allBlenders: Product[], getCount: (entry: Product) => number): number | null {
  return scoreRelativeCount(getCount(product), allBlenders.map(getCount));
}

const BLENDER_USE_CASE_WEIGHTS: Record<string, Partial<Record<BlenderCat, number>>> = {
  "Smoothie":        { smoothie: 100 },
  "Ghiaccio":        { ghiaccio: 100 },
  "Salse":           { smoothie: 50, famiglia: 30, pulizia: 20 },
  "Zuppe/Vellutate": { famiglia: 60, pulizia: 40 },
  "Famiglia":        { famiglia: 100 },
  "Monoporzione":    { smoothie: 70, pulizia: 30 },
  "Pulizia facile":  { pulizia: 100 },
};

function calcBlenderOverall(scores: Record<BlenderCat, number>, useCases: string[]): number {
  const combined: Record<BlenderCat, number> = { smoothie: 0, ghiaccio: 0, famiglia: 0, pulizia: 0 };
  let totalWeight = 0;

  for (const useCase of useCases) {
    const weights = BLENDER_USE_CASE_WEIGHTS[useCase];
    if (weights) {
      for (const cat of ["smoothie", "ghiaccio", "famiglia", "pulizia"] as BlenderCat[]) {
        combined[cat] += weights[cat] || 0;
      }
      totalWeight += Object.values(weights).reduce((sum, weight) => sum + (weight || 0), 0);
    }
  }

  if (totalWeight === 0) {
    return Math.round((scores.smoothie + scores.ghiaccio + scores.famiglia + scores.pulizia) / 4);
  }

  let overall = 0;
  for (const cat of ["smoothie", "ghiaccio", "famiglia", "pulizia"] as BlenderCat[]) {
    overall += scores[cat] * (combined[cat] / totalWeight);
  }
  return Math.round(overall);
}

export function calcBlenderScores(product: Product, allProducts: Product[]): BlenderScores | null {
  if (product.category !== "Frullatore") return null;

  const allBlenders = getBlenders(allProducts);
  if (allBlenders.length === 0) return null;

  const power = blenderNumberScore(product, allBlenders, "power");
  const rpm = blenderNumberScore(product, allBlenders, "rpm");
  const capacity = blenderNumberScore(product, allBlenders, "capacity");
  const usableCapacity = blenderNumberScore(product, allBlenders, "usableCapacity");
  const travelCupCapacity = blenderNumberScore(product, allBlenders, "travelCupCapacity");
  const bladeCount = blenderNumberScore(product, allBlenders, "bladeCount");
  const programs = blenderFeatureScore(product, allBlenders, blenderProgramCount);
  const manualControl = blenderFeatureScore(product, allBlenders, blenderManualControlCount);
  const bladeFeatures = blenderFeatureScore(product, allBlenders, blenderBladeFeatureCount);
  const materials = blenderFeatureScore(product, allBlenders, blenderMaterialFeatureCount);
  const cleaning = blenderFeatureScore(product, allBlenders, blenderCleaningFeatureCount);
  const portability = blenderFeatureScore(product, allBlenders, blenderPortabilityFeatureCount);
  const accessories = blenderFeatureScore(product, allBlenders, blenderAccessoryCount);
  const iceCrush = hasAffirmative(product.specs.iceCrush) ? 100 : null;

  const blades = averageAvailable([bladeCount, bladeFeatures]);
  const familyCapacity = averageAvailable([capacity, usableCapacity]);
  const portabilityScore = averageAvailable([travelCupCapacity, portability]);

  const perfScores: Record<BlenderCat, number> = {
    smoothie: weightedAverage([
      { score: power, weight: 22 },
      { score: rpm, weight: 18 },
      { score: programs, weight: 16 },
      { score: manualControl, weight: 8 },
      { score: blades, weight: 22 },
      { score: portabilityScore, weight: 14 },
    ]),
    ghiaccio: weightedAverage([
      { score: power, weight: 24 },
      { score: rpm, weight: 12 },
      { score: blades, weight: 28 },
      { score: iceCrush, weight: 18 },
      { score: programs, weight: 18 },
    ]),
    famiglia: weightedAverage([
      { score: familyCapacity, weight: 45 },
      { score: programs, weight: 15 },
      { score: cleaning, weight: 20 },
      { score: materials, weight: 10 },
      { score: power, weight: 10 },
    ]),
    pulizia: weightedAverage([
      { score: cleaning, weight: 55 },
      { score: programs, weight: 15 },
      { score: materials, weight: 10 },
      { score: accessories, weight: 20 },
    ]),
  };

  const overall = calcBlenderOverall(perfScores, product.useCases);
  const blenderPrices = allBlenders
    .map((entry) => Number.parseFloat(String(entry.price)))
    .filter((price) => !Number.isNaN(price) && price > 0)
    .sort((a, b) => a - b);
  const medianPrice = blenderPrices.length > 0 ? median(blenderPrices) : 100;
  const price = Number.parseFloat(String(product.price));
  const pm = price > 0 ? clamp(medianPrice / price, 0.3, 2.0) : 1.0;

  return {
    smoothie:   perfScores.smoothie,
    ghiaccio:   perfScores.ghiaccio,
    famiglia:   perfScores.famiglia,
    pulizia:    perfScores.pulizia,
    overall,
    smoothieQP: clamp(Math.round(perfScores.smoothie * pm), 0, 100),
    ghiaccioQP: clamp(Math.round(perfScores.ghiaccio * pm), 0, 100),
    famigliaQP: clamp(Math.round(perfScores.famiglia * pm), 0, 100),
    puliziaQP:  clamp(Math.round(perfScores.pulizia  * pm), 0, 100),
    overallQP:  clamp(Math.round(overall             * pm), 0, 100),
  };
}
