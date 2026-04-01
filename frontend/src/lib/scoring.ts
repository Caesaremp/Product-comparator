import type { Product } from "../types/product";

// ── Shared helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(lo: number, hi: number, scoreLo: number, scoreHi: number, value: number): number {
  return Math.round(scoreLo + ((value - lo) / (hi - lo)) * (scoreHi - scoreLo));
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// ── Monitor scoring ───────────────────────────────────────────────────────────

type Cat = "coding" | "gaming" | "grafica";

const WEIGHTS: Record<string, Record<Cat, number>> = {
  resolution:   { coding: 30, gaming: 10, grafica: 20 },
  size:         { coding: 12, gaming: 12, grafica: 10 },
  panelType:    { coding:  8, gaming: 15, grafica: 18 },
  refreshRate:  { coding: 10, gaming: 25, grafica:  3 },
  responseTime: { coding:  5, gaming: 18, grafica:  2 },
  colorGamut:   { coding:  5, gaming:  5, grafica: 25 },
  hdr:          { coding:  2, gaming:  8, grafica: 10 },
  ports:        { coding: 15, gaming:  3, grafica:  5 },
  adjustable:   { coding:  5, gaming:  2, grafica:  5 },
  vesa:         { coding:  5, gaming:  0, grafica:  0 },
  energyClass:  { coding:  3, gaming:  2, grafica:  2 },
};

function scoreResolution(resolution: string | number | undefined): number | null {
  if (!resolution) return null;
  const match = String(resolution).match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (!match) return null;
  const pixels = Number(match[1]) * Number(match[2]);
  if (pixels >= 8_294_400) return 100;
  if (pixels >= 5_120_000) return lerp(5_120_000, 8_294_400, 85, 100, pixels);
  if (pixels >= 3_686_400) return lerp(3_686_400, 5_120_000, 70,  85, pixels);
  if (pixels >= 2_073_600) return lerp(2_073_600, 3_686_400, 40,  70, pixels);
  return 15;
}

function scoreSize(size: string | number | undefined, resolution: string | number | undefined): number | null {
  if (!size) return null;
  const inches = Number(size);
  if (!inches) return null;

  if (resolution) {
    const match = String(resolution).match(/(\d+)\s*[xX×]\s*(\d+)/);
    if (match) {
      const w = Number(match[1]);
      const h = Number(match[2]);
      const ppi = Math.sqrt(w * w + h * h) / inches;
      if (ppi >= 160) return 100;
      if (ppi >= 140) return 90;
      if (ppi >= 110) return 80;
      if (ppi >= 90)  return 60;
      return 30;
    }
  }
  if (inches === 27) return 80;
  if (inches === 32) return 75;
  if (inches === 24) return 70;
  return 50;
}

const PANEL_SCORES: Record<string, Record<Cat, number>> = {
  "qd-oled": { coding: 80, gaming: 100, grafica: 100 },
  "oled":    { coding: 75, gaming: 100, grafica:  95 },
  "mini-led":{ coding: 85, gaming:  80, grafica:  85 },
  "ips":     { coding: 90, gaming:  60, grafica:  80 },
  "va":      { coding: 60, gaming:  70, grafica:  65 },
  "tn":      { coding: 30, gaming:  50, grafica:  20 },
};

function scorePanelType(panel: string | number | undefined, cat: Cat): number | null {
  if (!panel) return null;
  const p = String(panel).toLowerCase();
  for (const [key, scores] of Object.entries(PANEL_SCORES)) {
    if (p.includes(key)) return scores[cat];
  }
  return 50; // Non specificato
}

function scoreRefreshRate(hz: string | number | undefined): Record<Cat, number> | null {
  if (!hz) return null;
  const rate = Number(hz);
  if (!rate) return null;
  if (rate >= 240) return { coding: 100, gaming: 100, grafica: 100 };
  if (rate >= 165) return { coding:  90, gaming:  85, grafica:  90 };
  if (rate >= 144) return { coding:  80, gaming:  70, grafica:  80 };
  if (rate >= 120) return { coding:  70, gaming:  50, grafica:  70 };
  if (rate >= 75)  return { coding:  50, gaming:  30, grafica:  50 };
  if (rate >= 60)  return { coding:  40, gaming:  15, grafica:  40 };
  return { coding: 20, gaming: 5, grafica: 20 };
}

function scoreResponseTime(ms: string | number | undefined): number {
  if (ms === undefined || ms === null || ms === "") return 50;
  const val = Number(ms);
  if (Number.isNaN(val)) return 50;
  if (val <= 1) return 100;
  if (val <= 2) return 85;
  if (val <= 4) return 70;
  if (val <= 5) return 55;
  if (val <= 8) return 35;
  return 15;
}

function scoreColorGamut(gamut: string | number | undefined): number | null {
  if (!gamut) return null;
  const str = String(gamut);
  const dci = str.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:dci-?p3|dci\s+p3)/i);
  if (dci) {
    const pct = Number(dci[1]);
    if (pct >= 98) return 100;
    if (pct >= 95) return 90;
    if (pct >= 90) return 80;
    return 60;
  }
  const adobe = str.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:adobe\s*rgb|adobergb)/i);
  if (adobe && Number(adobe[1]) >= 99) return 85;
  const srgb = str.match(/(\d+(?:\.\d+)?)\s*%?\s*srgb/i);
  if (srgb) {
    const pct = Number(srgb[1]);
    if (pct >= 100) return 70;
    if (pct >= 99)  return 65;
    return 40;
  }
  return 40;
}

function scoreHdr(hdr: string | number | undefined): number | null {
  if (!hdr) return null;
  const h = String(hdr).toLowerCase();
  if (h === "no") return 0;
  if (h.includes("1400")) return 100;
  if (h.includes("1000")) return 90;
  if (h.includes("dolby")) return 85;
  if (h.includes("600"))  return 70;
  if (h.includes("400"))  return 30;
  if (h.includes("10"))   return 20;
  return null;
}

function scorePorts(product: Product): number {
  const hdmi  = Number(product.specs.hdmiPorts)        || 0;
  const dp    = Number(product.specs.dpPorts)          || 0;
  const usbC  = Number(product.specs.usbCPorts)        || 0;
  const usbA  = Number(product.specs.usbAPorts)        || 0;
  const tb    = Number(product.specs.thunderboltPorts) || 0;
  const txt   = String(product.specs.ports || "").toLowerCase();

  const hasAnyInfo = hdmi || dp || usbC || usbA || tb || txt.trim().length > 0;
  if (!hasAnyInfo) return 30; // default per spec

  let score = 0;
  const hasPD  = tb > 0 || /\b(pd|power.?delivery)\b/.test(txt);
  const hasUsbC = usbC > 0 || tb > 0 || /usb.?c/.test(txt);

  if (hasUsbC && hasPD)   score += 35;
  else if (hasUsbC)       score += 20;
  if (dp > 0 || /\b(dp|displayport)\b/.test(txt)) score += 20;
  if (hdmi >= 2)          score += 15;
  else if (hdmi === 1)    score += 8;
  if (usbA > 0 || /usb.?a/.test(txt)) score += 10;
  if (/\bkvm\b/.test(txt))              score += 10;
  if (/\b(ethernet|rj.?45)\b/.test(txt)) score += 5;
  if (/\b(audio|jack)\b/.test(txt))     score += 5;

  return clamp(score, 0, 100);
}

function scoreAdjustable(adjustable: string | number | undefined): number | null {
  if (!adjustable) return null;
  const a = String(adjustable).toLowerCase();
  if (a === "sì" || a === "si" || a === "yes") return 85;
  if (a.includes("tilt") && !a.includes("sì") && !a.includes("si")) return 30;
  if (a === "solo tilt") return 30;
  if (a === "no") return 0;
  return null;
}

function scoreVesa(vesa: string | number | undefined): number | null {
  if (!vesa) return null;
  const v = String(vesa).toLowerCase();
  if (v === "sì" || v === "si" || v === "yes") return 100;
  if (v === "no") return 0;
  return null;
}

function scoreEnergyClass(energyClass: string | number | undefined): number {
  if (!energyClass) return 50;
  const letter = String(energyClass).toUpperCase().match(/[A-G]/)?.[0];
  const map: Record<string, number> = { A: 100, B: 85, C: 70, D: 55, E: 40, F: 25, G: 10 };
  return letter ? (map[letter] ?? 50) : 50;
}

// ── Factor score map helpers ──────────────────────────────────────────────────

type CatScores = Record<Cat, number | null>;

function uniform(score: number | null): CatScores {
  return { coding: score, gaming: score, grafica: score };
}

function uniformValue(score: number): CatScores {
  return { coding: score, gaming: score, grafica: score };
}

// ── Overall from use cases ────────────────────────────────────────────────────

const USE_CASE_WEIGHTS: Record<string, Record<Cat, number>> = {
  "Gaming":         { coding:   0, gaming: 100, grafica:   0 },
  "Programmazione": { coding: 100, gaming:   0, grafica:   0 },
  "Grafica/Video":  { coding:   0, gaming:   0, grafica: 100 },
  "Produttività":   { coding:  60, gaming:  20, grafica:  20 },
  "Ufficio":        { coding:  70, gaming:  10, grafica:  20 },
  "Streaming":      { coding:  20, gaming:  40, grafica:  40 },
};

function calcOverall(scores: Record<Cat, number>, useCases: string[]): number {
  const combined: Record<Cat, number> = { coding: 0, gaming: 0, grafica: 0 };
  let totalWeight = 0;

  for (const uc of useCases) {
    const w = USE_CASE_WEIGHTS[uc];
    if (w) {
      for (const cat of ["coding", "gaming", "grafica"] as Cat[]) combined[cat] += w[cat];
      totalWeight += 100;
    }
  }

  if (totalWeight === 0) {
    return Math.round((scores.coding + scores.gaming + scores.grafica) / 3);
  }

  let overall = 0;
  for (const cat of ["coding", "gaming", "grafica"] as Cat[]) {
    overall += scores[cat] * (combined[cat] / totalWeight);
  }
  return Math.round(overall);
}

// ── Main export ───────────────────────────────────────────────────────────────

export interface MonitorScores {
  coding:    number;
  gaming:    number;
  grafica:   number;
  overall:   number;
  codingQP:  number;
  gamingQP:  number;
  graficaQP: number;
  overallQP: number;
}

export function calcMonitorScores(product: Product, allProducts: Product[]): MonitorScores | null {
  if (product.category !== "Monitor") return null;

  const s = product.specs;
  const refreshRaw = scoreRefreshRate(s.refreshRate);

  const factorScores: Record<string, CatScores> = {
    resolution:   uniform(scoreResolution(s.resolution)),
    size:         uniform(scoreSize(s.size, s.resolution)),
    panelType:    {
      coding:  scorePanelType(s.panelType, "coding"),
      gaming:  scorePanelType(s.panelType, "gaming"),
      grafica: scorePanelType(s.panelType, "grafica"),
    },
    refreshRate:  refreshRaw
      ? { coding: refreshRaw.coding, gaming: refreshRaw.gaming, grafica: refreshRaw.grafica }
      : uniform(null),
    responseTime: uniformValue(scoreResponseTime(s.responseTime)),
    colorGamut:   uniform(scoreColorGamut(s.colorGamut)),
    hdr:          uniform(scoreHdr(s.hdr)),
    ports:        uniformValue(scorePorts(product)),
    adjustable:   uniform(scoreAdjustable(s.adjustable)),
    vesa:         uniform(scoreVesa(s.vesa)),
    energyClass:  uniformValue(scoreEnergyClass(s.energyClass)),
  };

  const perfScores = {} as Record<Cat, number>;

  for (const cat of ["coding", "gaming", "grafica"] as Cat[]) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [factor, catScores] of Object.entries(factorScores)) {
      const score = catScores[cat];
      const weight = WEIGHTS[factor][cat];
      if (score !== null && weight > 0) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }

    perfScores[cat] = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  const overall = calcOverall(perfScores, product.useCases);

  // Q/P: median price of monitors in the database
  const monitorPrices = allProducts
    .filter((p) => p.category === "Monitor")
    .map((p) => Number.parseFloat(String(p.price)))
    .filter((p) => !Number.isNaN(p) && p > 0)
    .sort((a, b) => a - b);

  const medianPrice = monitorPrices.length > 0 ? median(monitorPrices) : 400;
  const price = Number.parseFloat(String(product.price));
  const pm = price > 0 ? clamp(medianPrice / price, 0.3, 2.0) : 1.0;

  return {
    coding:    perfScores.coding,
    gaming:    perfScores.gaming,
    grafica:   perfScores.grafica,
    overall,
    codingQP:  clamp(Math.round(perfScores.coding  * pm), 0, 100),
    gamingQP:  clamp(Math.round(perfScores.gaming  * pm), 0, 100),
    graficaQP: clamp(Math.round(perfScores.grafica * pm), 0, 100),
    overallQP: clamp(Math.round(overall            * pm), 0, 100),
  };
}

// ── Score labels / colors (monitor scale: 80/60/40) ──────────────────────────

export function getMonitorScoreColor(score: number | null): string {
  if (score === null) return "var(--c-muted)";
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

export function getMonitorScoreLabel(score: number | null): string {
  if (score === null) return "N/D";
  if (score >= 80) return "Eccellente";
  if (score >= 60) return "Buono";
  if (score >= 40) return "Discreto";
  return "Scarso";
}

// ── Legacy Q/P index (non-monitor categories) ─────────────────────────────────

import { CATEGORY_FIELDS } from "../data/catalog";

export function calcQualityPriceIndex(product: Product): number | null {
  const price = Number.parseFloat(String(product.price));
  if (!price || price <= 0) return null;

  let score = 0;
  let factors = 0;

  if (product.rating) {
    score += (product.rating / 5) * 40;
    factors += 1;
  }

  if (product.useCases.length) {
    score += Math.min(product.useCases.length / 4, 1) * 20;
    factors += 1;
  }

  const categoryFields = CATEGORY_FIELDS[product.category] ?? CATEGORY_FIELDS.Generico;
  const filledSpecs = categoryFields.filter((field) => product.specs[field.key]?.toString().trim()).length;
  score += (filledSpecs / categoryFields.length) * 20;
  factors += 1;

  if (product.reviews.length) {
    score += Math.min(product.reviews.length / 5, 1) * 20;
    factors += 1;
  }

  if (factors === 0) return null;

  const qualityScore = score / factors;
  const priceNorm = Math.max(1, 10 - Math.log10(price) * 2);
  return Math.round((qualityScore * priceNorm) / 10);
}

export function getQualityPriceColor(index: number | null): string {
  if (index === null) return "var(--c-muted)";
  if (index >= 75) return "#22c55e";
  if (index >= 50) return "#eab308";
  if (index >= 30) return "#f97316";
  return "#ef4444";
}

export function getQualityPriceLabel(index: number | null): string {
  if (index === null) return "N/D";
  if (index >= 75) return "Eccellente";
  if (index >= 50) return "Buono";
  if (index >= 30) return "Discreto";
  return "Scarso";
}
