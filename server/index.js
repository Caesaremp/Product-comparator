const fs = require("fs");
const os = require("os");
const path = require("path");
const express = require("express");
const Database = require("better-sqlite3");

const PORT = Number(process.env.PORT || 3187);
const APP_DATA_ROOT = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
const APP_DIRECTORY = path.join(APP_DATA_ROOT, "ProductComparator");
const DATABASE_PATH = path.join(APP_DIRECTORY, "product-comparator.db");
const FRONTEND_DIST_DIRECTORY = path.join(__dirname, "..", "frontend", "dist");

const SPEC_COLUMN_DEFINITIONS = {
  Monitor: [
    { key: "size", column: "monitor_size_inches", kind: "number" },
    { key: "resolution", column: "monitor_resolution", kind: "text" },
    { key: "panelType", column: "monitor_panel_type", kind: "text" },
    { key: "refreshRate", column: "monitor_refresh_rate_hz", kind: "number" },
    { key: "responseTime", column: "monitor_response_time_ms", kind: "number" },
    { key: "hdr", column: "monitor_hdr", kind: "text" },
    { key: "ports", column: "monitor_ports", kind: "text" },
    { key: "speakers", column: "monitor_speakers", kind: "text" },
    { key: "adjustable", column: "monitor_adjustable", kind: "text" },
    { key: "vesa", column: "monitor_vesa", kind: "text" },
    { key: "colorGamut", column: "monitor_color_gamut", kind: "text" },
    { key: "energyClass", column: "monitor_energy_class", kind: "text" },
    { key: "hdmiPorts", column: "monitor_hdmi_ports", kind: "number" },
    { key: "dpPorts", column: "monitor_dp_ports", kind: "number" },
    { key: "usbCPorts", column: "monitor_usb_c_ports", kind: "number" },
    { key: "usbAPorts", column: "monitor_usb_a_ports", kind: "number" },
    { key: "thunderboltPorts", column: "monitor_thunderbolt_ports", kind: "number" },
    { key: "contrast", column: "monitor_contrast", kind: "text" },
    { key: "weight", column: "monitor_weight_kg", kind: "number" },
    { key: "curved", column: "monitor_curved", kind: "text" },
  ],
  Laptop: [
    { key: "brand", column: "laptop_brand", kind: "text" },
    { key: "model", column: "laptop_model", kind: "text" },
    { key: "cpu", column: "laptop_cpu", kind: "text" },
    { key: "ram", column: "laptop_ram_gb", kind: "number" },
    { key: "storage", column: "laptop_storage", kind: "text" },
    { key: "gpu", column: "laptop_gpu", kind: "text" },
    { key: "screenSize", column: "laptop_screen_size_inches", kind: "number" },
    { key: "screenRes", column: "laptop_screen_resolution", kind: "text" },
    { key: "battery", column: "laptop_battery", kind: "text" },
    { key: "weight", column: "laptop_weight_kg", kind: "number" },
    { key: "os", column: "laptop_os", kind: "text" },
    { key: "panelType", column: "laptop_panel_type", kind: "text" },
    { key: "refreshRate", column: "laptop_refresh_rate_hz", kind: "number" },
    { key: "webcam", column: "laptop_webcam", kind: "text" },
    { key: "microphone", column: "laptop_microphone", kind: "text" },
    { key: "hdmiPorts", column: "laptop_hdmi_ports", kind: "number" },
    { key: "usbAPorts", column: "laptop_usb_a_ports", kind: "number" },
    { key: "usbCPorts", column: "laptop_usb_c_ports", kind: "number" },
    { key: "thunderboltPorts", column: "laptop_thunderbolt_ports", kind: "number" },
  ],
  Tastiera: [
    { key: "brand", column: "keyboard_brand", kind: "text" },
    { key: "model", column: "keyboard_model", kind: "text" },
    { key: "layout", column: "keyboard_layout", kind: "text" },
    { key: "switchType", column: "keyboard_switch_type", kind: "text" },
    { key: "connection", column: "keyboard_connection", kind: "text" },
    { key: "backlight", column: "keyboard_backlight", kind: "text" },
    { key: "hotswap", column: "keyboard_hotswap", kind: "text" },
    { key: "size", column: "keyboard_size", kind: "text" },
  ],
  Frullatore: [
    { key: "brand", column: "blender_brand", kind: "text" },
    { key: "model", column: "blender_model", kind: "text" },
    { key: "power", column: "blender_power_w", kind: "number" },
    { key: "rpm", column: "blender_rpm", kind: "number" },
    { key: "capacity", column: "blender_capacity_l", kind: "number" },
    { key: "usableCapacity", column: "blender_usable_capacity_l", kind: "number" },
    { key: "travelCupCapacity", column: "blender_travel_cup_capacity_l", kind: "number" },
    { key: "programs", column: "blender_programs", kind: "text" },
    { key: "manualSpeeds", column: "blender_manual_speeds", kind: "text" },
    { key: "bladeTechnology", column: "blender_blade_technology", kind: "text" },
    { key: "bladeMaterial", column: "blender_blade_material", kind: "text" },
    { key: "bladeCount", column: "blender_blade_count", kind: "number" },
    { key: "jarMaterial", column: "blender_jar_material", kind: "text" },
    { key: "dishwasherSafe", column: "blender_dishwasher_safe", kind: "text" },
    { key: "bpaFree", column: "blender_bpa_free", kind: "text" },
    { key: "iceCrush", column: "blender_ice_crush", kind: "text" },
    { key: "weight", column: "blender_weight_kg", kind: "number" },
    { key: "dimensions", column: "blender_dimensions", kind: "text" },
    { key: "includedAccessories", column: "blender_included_accessories", kind: "text" },
  ],
  RAM: [
    { key: "brand", column: "ram_brand", kind: "text" },
    { key: "model", column: "ram_model", kind: "text" },
    { key: "memoryType", column: "ram_memory_type", kind: "text" },
    { key: "formFactor", column: "ram_form_factor", kind: "text" },
    { key: "capacity", column: "ram_capacity_gb", kind: "number" },
    { key: "moduleCount", column: "ram_module_count", kind: "number" },
    { key: "speed", column: "ram_speed_mts", kind: "number" },
    { key: "casLatency", column: "ram_cas_latency", kind: "number" },
    { key: "timings", column: "ram_timings", kind: "text" },
    { key: "voltage", column: "ram_voltage_v", kind: "number" },
    { key: "xmpProfile", column: "ram_xmp_profile", kind: "text" },
    { key: "heatspreader", column: "ram_heatspreader", kind: "text" },
    { key: "height", column: "ram_height_mm", kind: "number" },
    { key: "rgb", column: "ram_rgb", kind: "text" },
    { key: "eccSupport", column: "ram_ecc_support", kind: "text" },
    { key: "warranty", column: "ram_warranty_years", kind: "number" },
  ],
  "Scheda Madre": [
    { key: "brand", column: "mobo_brand", kind: "text" },
    { key: "model", column: "mobo_model", kind: "text" },
    { key: "socket", column: "mobo_socket", kind: "text" },
    { key: "chipset", column: "mobo_chipset", kind: "text" },
    { key: "formFactor", column: "mobo_form_factor", kind: "text" },
    { key: "memoryType", column: "mobo_memory_type", kind: "text" },
    { key: "memorySlots", column: "mobo_memory_slots", kind: "number" },
    { key: "maxMemory", column: "mobo_max_memory_gb", kind: "number" },
    { key: "maxMemorySpeed", column: "mobo_max_memory_speed_mts", kind: "number" },
    { key: "vrmPhases", column: "mobo_vrm_phases", kind: "number" },
    { key: "pcieVersion", column: "mobo_pcie_version", kind: "text" },
    { key: "pcieX16Slots", column: "mobo_pcie_x16_slots", kind: "number" },
    { key: "m2Slots", column: "mobo_m2_slots", kind: "number" },
    { key: "sataPorts", column: "mobo_sata_ports", kind: "number" },
    { key: "rearUsbPorts", column: "mobo_rear_usb_ports", kind: "number" },
    { key: "usbCPorts", column: "mobo_usb_c_ports", kind: "number" },
    { key: "networking", column: "mobo_networking", kind: "text" },
    { key: "wifi", column: "mobo_wifi", kind: "text" },
    { key: "audioCodec", column: "mobo_audio_codec", kind: "text" },
    { key: "biosFlashback", column: "mobo_bios_flashback", kind: "text" },
    { key: "fanHeaders", column: "mobo_fan_headers", kind: "number" },
    { key: "rgbHeaders", column: "mobo_rgb_headers", kind: "number" },
  ],
  CPU: [
    { key: "brand", column: "cpu_brand", kind: "text" },
    { key: "model", column: "cpu_model", kind: "text" },
    { key: "socket", column: "cpu_socket", kind: "text" },
    { key: "cores", column: "cpu_cores", kind: "number" },
    { key: "efficiencyCores", column: "cpu_efficiency_cores", kind: "number" },
    { key: "threads", column: "cpu_threads", kind: "number" },
    { key: "baseClock", column: "cpu_base_clock_ghz", kind: "number" },
    { key: "boostClock", column: "cpu_boost_clock_ghz", kind: "number" },
    { key: "l3Cache", column: "cpu_l3_cache_mb", kind: "number" },
    { key: "tdp", column: "cpu_tdp_w", kind: "number" },
    { key: "maxPower", column: "cpu_max_power_w", kind: "number" },
    { key: "lithography", column: "cpu_lithography_nm", kind: "number" },
    { key: "integratedGraphics", column: "cpu_integrated_graphics", kind: "text" },
    { key: "memorySupport", column: "cpu_memory_support", kind: "text" },
    { key: "pcieVersion", column: "cpu_pcie_version", kind: "text" },
    { key: "pcieLanes", column: "cpu_pcie_lanes", kind: "number" },
    { key: "unlocked", column: "cpu_unlocked", kind: "text" },
    { key: "coolerIncluded", column: "cpu_cooler_included", kind: "text" },
    { key: "benchmarkSingle", column: "cpu_benchmark_single", kind: "number" },
    { key: "benchmarkMulti", column: "cpu_benchmark_multi", kind: "number" },
  ],
  GPU: [
    { key: "brand", column: "gpu_brand", kind: "text" },
    { key: "model", column: "gpu_model", kind: "text" },
    { key: "chipset", column: "gpu_chipset", kind: "text" },
    { key: "vram", column: "gpu_vram_gb", kind: "number" },
    { key: "memoryType", column: "gpu_memory_type", kind: "text" },
    { key: "memoryBus", column: "gpu_memory_bus_bit", kind: "number" },
    { key: "memorySpeed", column: "gpu_memory_speed_gbps", kind: "number" },
    { key: "boostClock", column: "gpu_boost_clock_mhz", kind: "number" },
    { key: "shadingUnits", column: "gpu_shading_units", kind: "number" },
    { key: "benchmark3d", column: "gpu_benchmark_3d", kind: "number" },
    { key: "rayTracing", column: "gpu_ray_tracing", kind: "text" },
    { key: "upscaling", column: "gpu_upscaling", kind: "text" },
    { key: "tdp", column: "gpu_tdp_w", kind: "number" },
    { key: "recommendedPsu", column: "gpu_recommended_psu_w", kind: "number" },
    { key: "pcieVersion", column: "gpu_pcie_version", kind: "text" },
    { key: "slots", column: "gpu_slots", kind: "number" },
    { key: "length", column: "gpu_length_mm", kind: "number" },
    { key: "fanCount", column: "gpu_fan_count", kind: "number" },
    { key: "hdmiPorts", column: "gpu_hdmi_ports", kind: "number" },
    { key: "dpPorts", column: "gpu_dp_ports", kind: "number" },
  ],
  Alimentatore: [
    { key: "brand", column: "psu_brand", kind: "text" },
    { key: "model", column: "psu_model", kind: "text" },
    { key: "wattage", column: "psu_wattage_w", kind: "number" },
    { key: "efficiencyRating", column: "psu_efficiency_rating", kind: "text" },
    { key: "atxVersion", column: "psu_atx_version", kind: "text" },
    { key: "modular", column: "psu_modular", kind: "text" },
    { key: "formFactor", column: "psu_form_factor", kind: "text" },
    { key: "pcie5Connectors", column: "psu_pcie5_connectors", kind: "number" },
    { key: "pcieConnectors", column: "psu_pcie_connectors", kind: "number" },
    { key: "sataConnectors", column: "psu_sata_connectors", kind: "number" },
    { key: "fanSize", column: "psu_fan_size_mm", kind: "number" },
    { key: "fanBearing", column: "psu_fan_bearing", kind: "text" },
    { key: "zeroRpm", column: "psu_zero_rpm", kind: "text" },
    { key: "noise", column: "psu_noise_db", kind: "number" },
    { key: "protections", column: "psu_protections", kind: "text" },
    { key: "japaneseCapacitors", column: "psu_japanese_capacitors", kind: "text" },
    { key: "depth", column: "psu_depth_mm", kind: "number" },
    { key: "warranty", column: "psu_warranty_years", kind: "number" },
  ],
  Generico: [
    { key: "brand", column: "generic_brand", kind: "text" },
    { key: "model", column: "generic_model", kind: "text" },
    { key: "description", column: "generic_description", kind: "text" },
  ],
};

const BASE_PRODUCT_COLUMNS = [
  "id",
  "name",
  "category",
  "price",
  "url",
  "rating",
  "notes",
  "created_at",
  "updated_at",
];
const ALL_SPEC_DEFINITIONS = Object.values(SPEC_COLUMN_DEFINITIONS).flat();
const SPEC_COLUMNS = [...new Set(ALL_SPEC_DEFINITIONS.map((definition) => definition.column))];
const SPEC_COLUMN_TYPES = new Map(
  ALL_SPEC_DEFINITIONS.map((definition) => [definition.column, definition.kind === "number" ? "REAL" : "TEXT"])
);
const PRODUCT_COLUMNS = [...BASE_PRODUCT_COLUMNS, ...SPEC_COLUMNS];

fs.mkdirSync(APP_DIRECTORY, { recursive: true });

const db = new Database(DATABASE_PATH);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL,
    url TEXT,
    rating INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_use_cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    use_case TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, use_case)
  );

  CREATE TABLE IF NOT EXISTS product_reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    source TEXT NOT NULL,
    text TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 0,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  );
`);

// Spec columns are created from SPEC_COLUMN_DEFINITIONS, so adding a category
// (or a single field) never requires touching the schema by hand.
const existingColumns = new Set(db.prepare("PRAGMA table_info(products)").all().map((col) => col.name));
for (const column of SPEC_COLUMNS) {
  if (!existingColumns.has(column)) {
    db.exec(`ALTER TABLE products ADD COLUMN ${column} ${SPEC_COLUMN_TYPES.get(column)}`);
  }
}

const existingReviewColumns = new Set(db.prepare("PRAGMA table_info(product_reviews)").all().map((col) => col.name));
if (!existingReviewColumns.has("count")) {
  db.exec("ALTER TABLE product_reviews ADD COLUMN count INTEGER NOT NULL DEFAULT 0");
}

const upsertProductStatement = db.prepare(`
  INSERT INTO products (${PRODUCT_COLUMNS.join(", ")})
  VALUES (${PRODUCT_COLUMNS.map((column) => `@${column}`).join(", ")})
  ON CONFLICT(id) DO UPDATE SET
    ${PRODUCT_COLUMNS
      .filter((column) => column !== "id" && column !== "created_at")
      .map((column) => `${column} = excluded.${column}`)
      .join(", ")}
`);
const deleteProductStatement = db.prepare("DELETE FROM products WHERE id = ?");
const selectAllProductsStatement = db.prepare("SELECT * FROM products ORDER BY datetime(created_at) DESC, id DESC");
const selectProductStatement = db.prepare("SELECT * FROM products WHERE id = ?");
const selectAllUseCasesStatement = db.prepare("SELECT product_id, use_case FROM product_use_cases ORDER BY id ASC");
const selectAllReviewsStatement = db.prepare("SELECT id, product_id, source, text, rating, count, created_at FROM product_reviews ORDER BY id ASC");
const selectReviewsForProductStatement = db.prepare("SELECT id, created_at FROM product_reviews WHERE product_id = ?");
const deleteUseCasesForProductStatement = db.prepare("DELETE FROM product_use_cases WHERE product_id = ?");
const deleteReviewsForProductStatement = db.prepare("DELETE FROM product_reviews WHERE product_id = ?");
const insertUseCaseStatement = db.prepare("INSERT INTO product_use_cases (product_id, use_case) VALUES (?, ?)");
const insertReviewStatement = db.prepare(`
  INSERT INTO product_reviews (id, product_id, source, text, rating, count, created_at)
  VALUES (@id, @product_id, @source, @text, @rating, @count, @created_at)
`);

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const stringValue = String(value).trim();
  return stringValue === "" ? null : stringValue;
}

function normalizeRequiredText(value, fallback) {
  return normalizeText(value) || fallback;
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeRating(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  return Math.max(0, Math.min(5, Math.round(numberValue * 10) / 10));
}

function emptySpecColumns() {
  return SPEC_COLUMNS.reduce((accumulator, column) => {
    accumulator[column] = null;
    return accumulator;
  }, {});
}

function normalizeUseCases(useCases) {
  if (!Array.isArray(useCases)) {
    return [];
  }
  return [...new Set(useCases.map((entry) => normalizeText(entry)).filter(Boolean))];
}

function normalizeReviews(reviews, existingCreatedAtById) {
  if (!Array.isArray(reviews)) {
    return [];
  }

  return reviews
    .map((review) => {
      const id = normalizeText(review?.id);
      const source = normalizeText(review?.source);
      const text = normalizeText(review?.text);
      if (!id || !source || !text) {
        return null;
      }

      return {
        id,
        source,
        text,
        rating: normalizeRating(review?.rating),
        count: Math.max(0, Math.trunc(Number(review?.count) || 0)),
        created_at: existingCreatedAtById.get(id) || new Date().toISOString(),
      };
    })
    .filter(Boolean);
}

function mapProductToRow(product) {
  const row = {
    id: normalizeRequiredText(product?.id, `product-${Date.now()}`),
    name: normalizeRequiredText(product?.name, "Prodotto senza nome"),
    category: normalizeRequiredText(product?.category, "Generico"),
    price: normalizeNumber(product?.price),
    url: normalizeText(product?.url),
    rating: normalizeRating(product?.rating),
    notes: normalizeText(product?.notes),
    created_at: normalizeRequiredText(product?.createdAt, new Date().toISOString()),
    updated_at: new Date().toISOString(),
    ...emptySpecColumns(),
  };

  const definitions = SPEC_COLUMN_DEFINITIONS[row.category] || SPEC_COLUMN_DEFINITIONS.Generico;
  for (const definition of definitions) {
    row[definition.column] =
      definition.kind === "number"
        ? normalizeNumber(product?.specs?.[definition.key])
        : normalizeText(product?.specs?.[definition.key]);
  }

  return row;
}

function buildSpecsFromRow(row) {
  const definitions = SPEC_COLUMN_DEFINITIONS[row.category] || SPEC_COLUMN_DEFINITIONS.Generico;
  return definitions.reduce((specs, definition) => {
    const value = row[definition.column];
    if (value !== null && value !== undefined && value !== "") {
      specs[definition.key] = value;
    }
    return specs;
  }, {});
}

function hydrateProducts() {
  const products = selectAllProductsStatement.all();
  const useCasesByProductId = new Map();
  const reviewsByProductId = new Map();

  for (const row of selectAllUseCasesStatement.all()) {
    if (!useCasesByProductId.has(row.product_id)) {
      useCasesByProductId.set(row.product_id, []);
    }
    useCasesByProductId.get(row.product_id).push(row.use_case);
  }

  for (const row of selectAllReviewsStatement.all()) {
    if (!reviewsByProductId.has(row.product_id)) {
      reviewsByProductId.set(row.product_id, []);
    }
    reviewsByProductId.get(row.product_id).push({
      id: row.id,
      source: row.source,
      text: row.text,
      rating: row.rating,
      count: row.count || 0,
    });
  }

  return products.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price === null ? "" : row.price,
    url: row.url || "",
    rating: row.rating || 0,
    specs: buildSpecsFromRow(row),
    useCases: useCasesByProductId.get(row.id) || [],
    reviews: reviewsByProductId.get(row.id) || [],
    notes: row.notes || "",
    createdAt: row.created_at,
  }));
}

const saveProductTransaction = db.transaction((product) => {
  const existingReviewCreatedAtById = new Map(
    selectReviewsForProductStatement.all(product.id).map((row) => [row.id, row.created_at])
  );
  const row = mapProductToRow(product);
  const useCases = normalizeUseCases(product.useCases);
  const reviews = normalizeReviews(product.reviews, existingReviewCreatedAtById);

  upsertProductStatement.run(row);
  deleteUseCasesForProductStatement.run(row.id);
  deleteReviewsForProductStatement.run(row.id);

  for (const useCase of useCases) {
    insertUseCaseStatement.run(row.id, useCase);
  }

  for (const review of reviews) {
    insertReviewStatement.run({
      ...review,
      product_id: row.id,
    });
  }

  return selectProductStatement.get(row.id);
});

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, dbPath: DATABASE_PATH });
});

app.get("/api/products", (req, res) => {
  try {
    res.json(hydrateProducts());
  } catch (error) {
    console.error("Failed to read products:", error);
    res.status(500).json({ error: "Failed to read products." });
  }
});

app.post("/api/products", (req, res) => {
  try {
    const savedRow = saveProductTransaction(req.body || {});
    res.status(201).json(
      hydrateProducts().find((product) => product.id === savedRow.id)
    );
  } catch (error) {
    console.error("Failed to create product:", error);
    res.status(500).json({ error: "Failed to create product." });
  }
});

app.put("/api/products/:id", (req, res) => {
  try {
    const payload = { ...(req.body || {}), id: req.params.id };
    const existingRow = selectProductStatement.get(req.params.id);
    if (!existingRow) {
      res.status(404).json({ error: "Product not found." });
      return;
    }

    saveProductTransaction({
      ...payload,
      createdAt: payload.createdAt || existingRow.created_at,
    });
    res.json(hydrateProducts().find((product) => product.id === req.params.id));
  } catch (error) {
    console.error("Failed to update product:", error);
    res.status(500).json({ error: "Failed to update product." });
  }
});

app.delete("/api/products/:id", (req, res) => {
  try {
    const info = deleteProductStatement.run(req.params.id);
    if (info.changes === 0) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

if (fs.existsSync(FRONTEND_DIST_DIRECTORY)) {
  app.use(express.static(FRONTEND_DIST_DIRECTORY));
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST_DIRECTORY, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Product Comparator API listening on http://localhost:${PORT}`);
  console.log(`SQLite database: ${DATABASE_PATH}`);
  if (fs.existsSync(FRONTEND_DIST_DIRECTORY)) {
    console.log(`Frontend bundle: ${FRONTEND_DIST_DIRECTORY}`);
  } else {
    console.log("Frontend bundle not found. Build the frontend or run the Vite dev server.");
  }
});
