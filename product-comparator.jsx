import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Constants ───
const LEGACY_STORAGE_KEY = "products-data";
const API_BASE_URL =
  typeof window !== "undefined" && window.PRODUCT_COMPARATOR_API_BASE_URL
    ? window.PRODUCT_COMPARATOR_API_BASE_URL
    : "http://localhost:3187/api";

const CATEGORY_FIELDS = {
  Monitor: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "size", label: 'Pollici (")', type: "number", unit: '"' },
    { key: "resolution", label: "Risoluzione", type: "text", placeholder: "es. 3840x2160" },
    { key: "panelType", label: "Pannello", type: "select", options: ["IPS", "VA", "TN", "OLED", "Mini-LED", "QD-OLED"] },
    { key: "refreshRate", label: "Refresh Rate", type: "number", unit: "Hz" },
    { key: "responseTime", label: "Tempo Risposta", type: "number", unit: "ms" },
    { key: "hdr", label: "HDR", type: "select", options: ["No", "HDR10", "HDR400", "HDR600", "HDR1000", "HDR1400", "Dolby Vision"] },
    { key: "ports", label: "Porte", type: "text", placeholder: "es. 2xHDMI, 1xDP, USB-C" },
    { key: "speakers", label: "Speaker integrati", type: "select", options: ["Sì", "No"] },
    { key: "adjustable", label: "Stand regolabile", type: "select", options: ["Sì", "No", "Solo tilt"] },
    { key: "vesa", label: "VESA", type: "select", options: ["Sì", "No"] },
    { key: "colorGamut", label: "Gamut colore", type: "text", placeholder: "es. 100% sRGB, 95% DCI-P3" },
    { key: "energyClass", label: "Classe energetica", type: "text" },
  ],
  Laptop: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "cpu", label: "CPU", type: "text" },
    { key: "ram", label: "RAM", type: "number", unit: "GB" },
    { key: "storage", label: "Storage", type: "text", placeholder: "es. 512GB SSD" },
    { key: "gpu", label: "GPU", type: "text" },
    { key: "screenSize", label: "Schermo", type: "number", unit: '"' },
    { key: "screenRes", label: "Risoluzione", type: "text" },
    { key: "battery", label: "Batteria", type: "text", placeholder: "es. 72Wh" },
    { key: "weight", label: "Peso", type: "number", unit: "kg" },
    { key: "os", label: "OS", type: "text" },
  ],
  Tastiera: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "layout", label: "Layout", type: "select", options: ["IT", "US", "UK", "DE", "Custom"] },
    { key: "switchType", label: "Switch", type: "text", placeholder: "es. Cherry MX Brown" },
    { key: "connection", label: "Connessione", type: "select", options: ["USB", "Bluetooth", "2.4GHz", "Multi-device"] },
    { key: "backlight", label: "Retroilluminazione", type: "select", options: ["No", "Singolo colore", "RGB"] },
    { key: "hotswap", label: "Hot-swap", type: "select", options: ["Sì", "No"] },
    { key: "size", label: "Formato", type: "select", options: ["Full-size", "TKL", "75%", "65%", "60%", "40%"] },
  ],
  Generico: [
    { key: "brand", label: "Brand", type: "text" },
    { key: "model", label: "Modello", type: "text" },
    { key: "description", label: "Descrizione", type: "textarea" },
  ],
};

const USE_CASES = {
  Monitor: ["Gaming", "Produttività", "Grafica/Video", "Ufficio", "Streaming", "Programmazione"],
  Laptop: ["Gaming", "Produttività", "Sviluppo", "Portatile/Viaggio", "Creatività"],
  Tastiera: ["Gaming", "Typing", "Programmazione", "Ufficio", "Portatile"],
  Generico: ["Uso quotidiano", "Professionale", "Hobby"],
};

// ─── Helpers ───
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function calcQualityPriceIndex(product) {
  const price = parseFloat(product.price);
  if (!price || price <= 0) return null;
  let score = 0;
  let factors = 0;

  // Rating contributes heavily
  if (product.rating) {
    score += (product.rating / 5) * 40;
    factors++;
  }
  // Use cases breadth
  if (product.useCases?.length) {
    score += Math.min(product.useCases.length / 4, 1) * 20;
    factors++;
  }
  // Filled specs ratio
  const catFields = CATEGORY_FIELDS[product.category] || CATEGORY_FIELDS.Generico;
  const filledSpecs = catFields.filter((f) => product.specs?.[f.key]?.toString().trim()).length;
  const specRatio = filledSpecs / catFields.length;
  score += specRatio * 20;
  factors++;

  // Reviews count
  if (product.reviews?.length) {
    score += Math.min(product.reviews.length / 5, 1) * 20;
    factors++;
  }

  if (factors === 0) return null;
  const qualityScore = score / factors;

  // Normalize price (lower = better) on a log scale
  const priceNorm = Math.max(1, 10 - Math.log10(price) * 2);
  return Math.round((qualityScore * priceNorm) / 10);
}

function getQPColor(index) {
  if (index === null) return "var(--c-muted)";
  if (index >= 75) return "#22c55e";
  if (index >= 50) return "#eab308";
  if (index >= 30) return "#f97316";
  return "#ef4444";
}

function getQPLabel(index) {
  if (index === null) return "N/D";
  if (index >= 75) return "Eccellente";
  if (index >= 50) return "Buono";
  if (index >= 30) return "Discreto";
  return "Scarso";
}

// ─── Storage ───
function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const payload = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

async function loadLegacyProducts() {
  try {
    if (typeof window === "undefined" || !window.storage?.get) {
      return [];
    }

    const result = await window.storage.get(LEGACY_STORAGE_KEY);
    return result ? JSON.parse(result.value) : [];
  } catch {
    return [];
  }
}

async function createProduct(product) {
  return apiRequest("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

async function updateProduct(product) {
  return apiRequest(`/products/${encodeURIComponent(product.id)}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

async function deleteProductById(productId) {
  return apiRequest(`/products/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

async function migrateLegacyProducts(products) {
  for (const product of products) {
    await createProduct(product);
  }
}

async function loadProducts() {
  const products = await apiRequest("/products");
  if (products.length > 0) {
    return products;
  }

  const legacyProducts = await loadLegacyProducts();
  if (legacyProducts.length === 0) {
    return products;
  }

  await migrateLegacyProducts(legacyProducts);
  return apiRequest("/products");
}

// ─── Styles ───
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');

  :root {
    --c-bg: #0f1117;
    --c-surface: #181a23;
    --c-surface2: #1f2231;
    --c-border: #2a2d3a;
    --c-border-hover: #3d4155;
    --c-text: #e8e9ed;
    --c-text-secondary: #9498a8;
    --c-muted: #585c72;
    --c-accent: #14e1b8;
    --c-accent-dim: rgba(20, 225, 184, 0.12);
    --c-accent-hover: #11c9a3;
    --c-danger: #ef4444;
    --c-danger-dim: rgba(239, 68, 68, 0.12);
    --c-warning: #eab308;
    --c-navy: #1d2435;
    --font-body: 'DM Sans', sans-serif;
    --font-mono: 'Space Mono', monospace;
    --radius: 10px;
    --radius-sm: 6px;
    --shadow: 0 4px 24px rgba(0,0,0,0.3);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body, #root {
    font-family: var(--font-body);
    background: var(--c-bg);
    color: var(--c-text);
    min-height: 100vh;
  }

  .app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 0 32px;
    border-bottom: 1px solid var(--c-border);
    margin-bottom: 28px;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-icon {
    width: 36px;
    height: 36px;
    background: var(--c-accent);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: var(--c-bg);
    font-weight: 700;
  }
  .logo h1 {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.3px;
  }
  .logo h1 span {
    color: var(--c-accent);
  }

  /* ── Nav ── */
  .nav {
    display: flex;
    gap: 4px;
    background: var(--c-surface);
    border-radius: var(--radius);
    padding: 4px;
  }
  .nav-btn {
    padding: 8px 18px;
    border: none;
    background: transparent;
    color: var(--c-text-secondary);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 500;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .nav-btn:hover {
    color: var(--c-text);
    background: var(--c-surface2);
  }
  .nav-btn.active {
    background: var(--c-accent);
    color: var(--c-bg);
    font-weight: 600;
  }

  /* ── Cards ── */
  .card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius);
    padding: 20px;
    transition: border-color 0.2s;
  }
  .card:hover {
    border-color: var(--c-border-hover);
  }

  /* ── Buttons ── */
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-primary {
    background: var(--c-accent);
    color: var(--c-bg);
  }
  .btn-primary:hover { background: var(--c-accent-hover); }
  .btn-secondary {
    background: var(--c-surface2);
    color: var(--c-text);
    border: 1px solid var(--c-border);
  }
  .btn-secondary:hover { border-color: var(--c-accent); color: var(--c-accent); }
  .btn-danger {
    background: var(--c-danger-dim);
    color: var(--c-danger);
  }
  .btn-danger:hover { background: #ef444433; }
  .btn-ghost {
    background: transparent;
    color: var(--c-text-secondary);
    padding: 6px 10px;
  }
  .btn-ghost:hover { color: var(--c-accent); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Inputs ── */
  .input, .select, .textarea {
    width: 100%;
    padding: 10px 14px;
    background: var(--c-bg);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-sm);
    color: var(--c-text);
    font-family: var(--font-body);
    font-size: 13px;
    transition: border-color 0.2s;
    outline: none;
  }
  .input:focus, .select:focus, .textarea:focus {
    border-color: var(--c-accent);
  }
  .input::placeholder, .textarea::placeholder {
    color: var(--c-muted);
  }
  .textarea {
    resize: vertical;
    min-height: 70px;
  }
  .select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239498a8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  .label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--c-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  .field { margin-bottom: 14px; }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .status-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
    padding: 14px 16px;
    background: var(--c-danger-dim);
    border: 1px solid rgba(239, 68, 68, 0.35);
    border-radius: var(--radius);
  }
  .status-banner p {
    color: var(--c-text);
    font-size: 13px;
    line-height: 1.5;
  }

  /* ── Product Grid ── */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    margin-top: 20px;
  }
  .product-card {
    position: relative;
    cursor: pointer;
  }
  .product-card .pc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }
  .pc-category {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--c-accent);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 4px;
  }
  .pc-name {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
  }
  .pc-price {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 700;
    color: var(--c-accent);
    white-space: nowrap;
  }
  .pc-specs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }
  .spec-chip {
    font-size: 11px;
    padding: 3px 8px;
    background: var(--c-surface2);
    border-radius: 4px;
    color: var(--c-text-secondary);
  }
  .pc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--c-border);
  }
  .qp-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .qp-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .pc-actions {
    display: flex;
    gap: 4px;
  }

  /* ── Compare ── */
  .compare-table {
    width: 100%;
    overflow-x: auto;
    margin-top: 20px;
  }
  .compare-table table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
  }
  .compare-table th, .compare-table td {
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid var(--c-border);
    font-size: 13px;
  }
  .compare-table th {
    color: var(--c-text-secondary);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
    background: var(--c-surface);
    position: sticky;
    left: 0;
    min-width: 140px;
  }
  .compare-table td {
    min-width: 180px;
  }
  .compare-table tr:hover td {
    background: var(--c-surface);
  }
  .highlight-best {
    color: var(--c-accent) !important;
    font-weight: 600;
  }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius);
    width: 100%;
    max-width: 640px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 28px;
    box-shadow: var(--shadow);
  }
  .modal-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* ── Tags / Chips ── */
  .use-case-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .uc-tag {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 20px;
    border: 1px solid var(--c-border);
    background: transparent;
    color: var(--c-text-secondary);
    cursor: pointer;
    font-family: var(--font-body);
    transition: all 0.15s;
  }
  .uc-tag.selected {
    background: var(--c-accent-dim);
    border-color: var(--c-accent);
    color: var(--c-accent);
  }
  .uc-tag:hover { border-color: var(--c-accent); }

  /* ── Rating Stars ── */
  .stars {
    display: flex;
    gap: 2px;
  }
  .star {
    cursor: pointer;
    font-size: 20px;
    color: var(--c-muted);
    transition: color 0.1s;
    background: none;
    border: none;
    padding: 0;
  }
  .star.filled { color: var(--c-warning); }
  .star:hover { color: var(--c-warning); }

  /* ── Reviews ── */
  .review-item {
    padding: 12px;
    background: var(--c-bg);
    border-radius: var(--radius-sm);
    margin-bottom: 8px;
  }
  .review-source {
    font-size: 11px;
    color: var(--c-accent);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .review-text {
    font-size: 13px;
    color: var(--c-text-secondary);
    margin-top: 4px;
    line-height: 1.5;
  }

  /* ── Checkbox compare ── */
  .compare-check {
    appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid var(--c-border);
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .compare-check:checked {
    background: var(--c-accent);
    border-color: var(--c-accent);
  }
  .compare-check:checked::after {
    content: '✓';
    position: absolute;
    top: -1px;
    left: 2px;
    font-size: 12px;
    color: var(--c-bg);
    font-weight: 700;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--c-muted);
  }
  .empty-state svg {
    margin-bottom: 16px;
    opacity: 0.4;
  }
  .empty-state h3 {
    font-size: 16px;
    color: var(--c-text-secondary);
    margin-bottom: 8px;
  }
  .empty-state p {
    font-size: 13px;
    max-width: 360px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* ── Toolbar ── */
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .filter-group {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .filter-group .select {
    width: auto;
    min-width: 130px;
  }

  /* ── Sections in modal ── */
  .section-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--c-accent);
    margin: 20px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--c-border);
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 3px; }

  /* ── Link chip ── */
  .link-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--c-accent-dim);
    border-radius: 4px;
    font-size: 11px;
    color: var(--c-accent);
    text-decoration: none;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .link-chip:hover { background: rgba(20,225,184,0.2); }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .header { flex-direction: column; gap: 16px; align-items: flex-start; }
    .products-grid { grid-template-columns: 1fr; }
    .field-row { grid-template-columns: 1fr; }
    .nav { width: 100%; }
    .nav-btn { flex: 1; text-align: center; padding: 8px 10px; font-size: 12px; }
  }
`;

// ─── Components ───

function StarRating({ value, onChange, size = 20 }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${n <= value ? "filled" : ""}`}
          style={{ fontSize: size }}
          onClick={() => onChange?.(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ProductModal({ product, onSave, onClose, categories }) {
  const [data, setData] = useState(
    product || {
      id: genId(),
      name: "",
      category: "Monitor",
      price: "",
      url: "",
      rating: 0,
      specs: {},
      useCases: [],
      reviews: [],
      notes: "",
      createdAt: new Date().toISOString(),
    }
  );
  const [newReview, setNewReview] = useState({ source: "", text: "", rating: 0 });

  const fields = CATEGORY_FIELDS[data.category] || CATEGORY_FIELDS.Generico;
  const useCases = USE_CASES[data.category] || USE_CASES.Generico;

  const updateSpec = (key, val) => {
    setData((d) => ({ ...d, specs: { ...d.specs, [key]: val } }));
  };

  const toggleUseCase = (uc) => {
    setData((d) => ({
      ...d,
      useCases: d.useCases.includes(uc) ? d.useCases.filter((u) => u !== uc) : [...d.useCases, uc],
    }));
  };

  const addReview = () => {
    if (!newReview.source.trim() || !newReview.text.trim()) return;
    setData((d) => ({
      ...d,
      reviews: [...d.reviews, { ...newReview, id: genId() }],
    }));
    setNewReview({ source: "", text: "", rating: 0 });
  };

  const removeReview = (id) => {
    setData((d) => ({ ...d, reviews: d.reviews.filter((r) => r.id !== id) }));
  };

  const displayName =
    data.specs?.brand && data.specs?.model
      ? `${data.specs.brand} ${data.specs.model}`
      : data.name;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <span>{product ? "Modifica Prodotto" : "Nuovo Prodotto"}</span>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>

        {/* ── Base Info ── */}
        <div className="field-row">
          <div className="field">
            <label className="label">Categoria</label>
            <select
              className="select"
              value={data.category}
              onChange={(e) => setData((d) => ({ ...d, category: e.target.value, specs: {}, useCases: [] }))}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Prezzo (€)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="299.99"
              value={data.price}
              onChange={(e) => setData((d) => ({ ...d, price: e.target.value }))}
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Nome prodotto</label>
          <input
            className="input"
            placeholder="es. Dell S2722QC"
            value={data.name}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
          />
        </div>

        <div className="field">
          <label className="label">Link prodotto</label>
          <input
            className="input"
            type="url"
            placeholder="https://amazon.it/..."
            value={data.url}
            onChange={(e) => setData((d) => ({ ...d, url: e.target.value }))}
          />
        </div>

        <div className="field">
          <label className="label">Valutazione personale</label>
          <StarRating value={data.rating} onChange={(v) => setData((d) => ({ ...d, rating: v }))} />
        </div>

        {/* ── Specs ── */}
        <div className="section-title">Caratteristiche</div>
        <div className="field-row">
          {fields.map((f) => (
            <div className="field" key={f.key}>
              <label className="label">
                {f.label} {f.unit && <span style={{ opacity: 0.5 }}>({f.unit})</span>}
              </label>
              {f.type === "select" ? (
                <select
                  className="select"
                  value={data.specs?.[f.key] || ""}
                  onChange={(e) => updateSpec(f.key, e.target.value)}
                >
                  <option value="">—</option>
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  className="textarea"
                  placeholder={f.placeholder || ""}
                  value={data.specs?.[f.key] || ""}
                  onChange={(e) => updateSpec(f.key, e.target.value)}
                />
              ) : (
                <input
                  className="input"
                  type={f.type}
                  placeholder={f.placeholder || ""}
                  value={data.specs?.[f.key] || ""}
                  onChange={(e) => updateSpec(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Use Cases ── */}
        <div className="section-title">Casi d'uso</div>
        <div className="use-case-tags">
          {useCases.map((uc) => (
            <button
              key={uc}
              className={`uc-tag ${data.useCases.includes(uc) ? "selected" : ""}`}
              onClick={() => toggleUseCase(uc)}
            >
              {uc}
            </button>
          ))}
        </div>

        {/* ── Reviews ── */}
        <div className="section-title">Recensioni</div>
        {data.reviews.map((r) => (
          <div className="review-item" key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="review-source">{r.source}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {r.rating > 0 && <StarRating value={r.rating} size={12} />}
                <button className="btn btn-ghost btn-sm" onClick={() => removeReview(r.id)}>✕</button>
              </div>
            </div>
            <p className="review-text">{r.text}</p>
          </div>
        ))}
        <div style={{ marginTop: 10 }}>
          <div className="field-row">
            <div className="field">
              <label className="label">Fonte</label>
              <input
                className="input"
                placeholder="es. TechRadar, YouTube, Amazon"
                value={newReview.source}
                onChange={(e) => setNewReview((r) => ({ ...r, source: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="label">Rating fonte</label>
              <StarRating value={newReview.rating} onChange={(v) => setNewReview((r) => ({ ...r, rating: v }))} size={16} />
            </div>
          </div>
          <div className="field">
            <label className="label">Nota / estratto</label>
            <textarea
              className="textarea"
              placeholder="Punti chiave della recensione..."
              value={newReview.text}
              onChange={(e) => setNewReview((r) => ({ ...r, text: e.target.value }))}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={addReview}>
            + Aggiungi recensione
          </button>
        </div>

        {/* ── Notes ── */}
        <div className="section-title">Note personali</div>
        <div className="field">
          <textarea
            className="textarea"
            placeholder="Le tue considerazioni..."
            value={data.notes}
            onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
          />
        </div>

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              const finalName = data.specs?.brand && data.specs?.model
                ? `${data.specs.brand} ${data.specs.model}`
                : data.name;
              onSave({ ...data, name: finalName || data.name || "Prodotto senza nome" });
            }}
          >
            {product ? "Salva modifiche" : "Aggiungi prodotto"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, compareSelected, onToggleCompare }) {
  const fields = CATEGORY_FIELDS[product.category] || CATEGORY_FIELDS.Generico;
  const qpIndex = calcQualityPriceIndex(product);
  const topSpecs = fields
    .filter((f) => product.specs?.[f.key])
    .slice(0, 5)
    .map((f) => {
      const val = product.specs[f.key];
      return f.unit ? `${val}${f.unit}` : val;
    });

  return (
    <div className="card product-card" onClick={() => onEdit(product)}>
      <div className="pc-header">
        <div>
          <div className="pc-category">{product.category}</div>
          <div className="pc-name">{product.name || "—"}</div>
        </div>
        <div className="pc-price">{product.price ? `€${parseFloat(product.price).toFixed(2)}` : "—"}</div>
      </div>

      {topSpecs.length > 0 && (
        <div className="pc-specs">
          {topSpecs.map((s, i) => (
            <span className="spec-chip" key={i}>{s}</span>
          ))}
        </div>
      )}

      {product.useCases?.length > 0 && (
        <div className="pc-specs" style={{ marginTop: 6 }}>
          {product.useCases.map((uc) => (
            <span className="spec-chip" key={uc} style={{ borderLeft: `2px solid var(--c-accent)`, paddingLeft: 8 }}>
              {uc}
            </span>
          ))}
        </div>
      )}

      <div className="pc-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="qp-badge">
            <span className="qp-dot" style={{ background: getQPColor(qpIndex) }} />
            <span style={{ color: getQPColor(qpIndex) }}>{qpIndex ?? "—"}</span>
            <span style={{ color: "var(--c-muted)", fontWeight: 400 }}>{getQPLabel(qpIndex)}</span>
          </div>
          {product.rating > 0 && <StarRating value={product.rating} size={13} />}
        </div>
        <div className="pc-actions" onClick={(e) => e.stopPropagation()}>
          {product.url && (
            <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Apri link">
              ↗
            </a>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }} title="Confronta">
            <input
              type="checkbox"
              className="compare-check"
              checked={compareSelected}
              onChange={() => onToggleCompare(product.id)}
            />
          </label>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(product.id)} title="Elimina">
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

function CompareView({ products }) {
  if (products.length < 2) {
    return (
      <div className="empty-state">
        <h3>Seleziona almeno 2 prodotti</h3>
        <p>Usa le checkbox nelle card prodotto per selezionare quelli da confrontare.</p>
      </div>
    );
  }

  const category = products[0].category;
  const fields = CATEGORY_FIELDS[category] || CATEGORY_FIELDS.Generico;

  const rows = [
    { label: "Prezzo", key: "_price", render: (p) => (p.price ? `€${parseFloat(p.price).toFixed(2)}` : "—") },
    { label: "Rating", key: "_rating", render: (p) => (p.rating ? "★".repeat(p.rating) + "☆".repeat(5 - p.rating) : "—") },
    { label: "Q/P Index", key: "_qp", render: (p) => { const idx = calcQualityPriceIndex(p); return idx !== null ? `${idx} — ${getQPLabel(idx)}` : "—"; } },
    ...fields.map((f) => ({
      label: f.label,
      key: f.key,
      render: (p) => {
        const val = p.specs?.[f.key];
        if (!val) return "—";
        return f.unit ? `${val} ${f.unit}` : val;
      },
    })),
    { label: "Casi d'uso", key: "_uc", render: (p) => p.useCases?.join(", ") || "—" },
    { label: "Recensioni", key: "_reviews", render: (p) => (p.reviews?.length ? `${p.reviews.length} fonte/i` : "—") },
    { label: "Link", key: "_url", render: (p) => p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="link-chip">Apri ↗</a> : "—" },
  ];

  // Find best price (lowest)
  const prices = products.map((p) => parseFloat(p.price)).filter((n) => !isNaN(n) && n > 0);
  const bestPrice = prices.length ? Math.min(...prices) : null;

  // Find best QP
  const qps = products.map((p) => calcQualityPriceIndex(p)).filter((n) => n !== null);
  const bestQP = qps.length ? Math.max(...qps) : null;

  return (
    <div className="compare-table">
      <table>
        <thead>
          <tr>
            <th></th>
            {products.map((p) => (
              <td key={p.id} style={{ fontWeight: 700, fontSize: 14 }}>{p.name || "—"}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th>{row.label}</th>
              {products.map((p) => {
                let className = "";
                if (row.key === "_price" && bestPrice !== null && parseFloat(p.price) === bestPrice) className = "highlight-best";
                if (row.key === "_qp" && bestQP !== null && calcQualityPriceIndex(p) === bestQP) className = "highlight-best";
                return <td key={p.id} className={className}>{row.render(p)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [persistenceError, setPersistenceError] = useState("");
  const [view, setView] = useState("products"); // products | compare
  const [editProduct, setEditProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [compareIds, setCompareIds] = useState(new Set());
  const [filterCategory, setFilterCategory] = useState("Tutti");
  const [sortBy, setSortBy] = useState("date"); // date | price | qp | rating

  const categories = Object.keys(CATEGORY_FIELDS);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadProducts();
      setProducts(data);
      setPersistenceError("");
    } catch (error) {
      setPersistenceError(getErrorMessage(error, "Impossibile connettersi al database locale."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleSave = async (product) => {
    const existing = products.find((p) => p.id === product.id);

    try {
      const savedProduct = existing ? await updateProduct(product) : await createProduct(product);
      setProducts((current) =>
        existing
          ? current.map((item) => (item.id === savedProduct.id ? savedProduct : item))
          : [...current, savedProduct]
      );
      setPersistenceError("");
      setShowModal(false);
      setEditProduct(null);
    } catch (error) {
      setPersistenceError(getErrorMessage(error, "Impossibile salvare il prodotto."));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProductById(id);
      setProducts((current) => current.filter((p) => p.id !== id));
      setCompareIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setPersistenceError("");
    } catch (error) {
      setPersistenceError(getErrorMessage(error, "Impossibile eliminare il prodotto."));
    }
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = filterCategory === "Tutti" ? products : products.filter((p) => p.category === filterCategory);
    switch (sortBy) {
      case "price":
        list = [...list].sort((a, b) => (parseFloat(a.price) || 9999) - (parseFloat(b.price) || 9999));
        break;
      case "qp":
        list = [...list].sort((a, b) => (calcQualityPriceIndex(b) ?? -1) - (calcQualityPriceIndex(a) ?? -1));
        break;
      case "rating":
        list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [products, filterCategory, sortBy]);

  const compareProducts = products.filter((p) => compareIds.has(p.id));

  if (loading) {
    return (
      <div className="app">
        <style>{CSS}</style>
        <div className="empty-state">
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{CSS}</style>

      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <h1>
            Product<span>Lab</span>
          </h1>
        </div>
        <nav className="nav">
          <button className={`nav-btn ${view === "products" ? "active" : ""}`} onClick={() => setView("products")}>
            Prodotti {products.length > 0 && `(${products.length})`}
          </button>
          <button
            className={`nav-btn ${view === "compare" ? "active" : ""}`}
            onClick={() => setView("compare")}
          >
            Confronta {compareIds.size > 0 && `(${compareIds.size})`}
          </button>
        </nav>
      </header>

      {persistenceError && (
        <div className="status-banner">
          <p>{persistenceError}</p>
          <button className="btn btn-secondary btn-sm" onClick={refreshProducts}>
            Riprova
          </button>
        </div>
      )}

      {/* Toolbar */}
      {view === "products" && (
        <div className="toolbar">
          <div className="filter-group">
            <select className="select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="Tutti">Tutte le categorie</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date">Più recenti</option>
              <option value="price">Prezzo ↑</option>
              <option value="qp">Qualità/Prezzo ↓</option>
              <option value="rating">Rating ↓</option>
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditProduct(null);
              setShowModal(true);
            }}
          >
            + Nuovo prodotto
          </button>
        </div>
      )}

      {/* Products View */}
      {view === "products" && (
        <>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <h3>Nessun prodotto ancora</h3>
              <p>Aggiungi il tuo primo prodotto per iniziare a confrontare e trovare il miglior rapporto qualità/prezzo.</p>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onEdit={(prod) => {
                    setEditProduct(prod);
                    setShowModal(true);
                  }}
                  onDelete={handleDelete}
                  compareSelected={compareIds.has(p.id)}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Compare View */}
      {view === "compare" && <CompareView products={compareProducts} />}

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditProduct(null);
          }}
        />
      )}
    </div>
  );
}
