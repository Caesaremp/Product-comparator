export type { CategoryScores } from "./helpers";
export type { CategoryScoring, ScoreDimension } from "./registry";
export {
  CATEGORY_SCORING,
  PC_COMPONENTS_GROUP,
  SCORED_CATEGORIES,
  calcCategoryScores,
  getCategoryScoring,
  getDimensionScore,
} from "./registry";

export { type MonitorScores, calcMonitorScores } from "./monitor";
export { type BlenderScores, calcBlenderScores } from "./blender";
export { calcRamScores } from "./ram";
export { calcMotherboardScores } from "./motherboard";
export { calcCpuScores } from "./cpu";
export { calcGpuScores } from "./gpu";
export { calcPsuScores } from "./psu";

export {
  calcQualityPriceIndex,
  getMonitorScoreColor,
  getMonitorScoreLabel,
  getQualityPriceColor,
  getQualityPriceLabel,
} from "./presentation";
