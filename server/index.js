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
    { key: "brand", column: "monitor_brand", kind: "text" },
    { key: "model", column: "monitor_model", kind: "text" },
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
const SPEC_COLUMNS = Object.values(SPEC_COLUMN_DEFINITIONS)
  .flat()
  .map((definition) => definition.column);
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
    updated_at TEXT NOT NULL,
    monitor_brand TEXT,
    monitor_model TEXT,
    monitor_size_inches REAL,
    monitor_resolution TEXT,
    monitor_panel_type TEXT,
    monitor_refresh_rate_hz REAL,
    monitor_response_time_ms REAL,
    monitor_hdr TEXT,
    monitor_ports TEXT,
    monitor_speakers TEXT,
    monitor_adjustable TEXT,
    monitor_vesa TEXT,
    monitor_color_gamut TEXT,
    monitor_energy_class TEXT,
    monitor_hdmi_ports REAL,
    monitor_dp_ports REAL,
    monitor_usb_c_ports REAL,
    monitor_usb_a_ports REAL,
    monitor_thunderbolt_ports REAL,
    monitor_contrast TEXT,
    monitor_weight_kg REAL,
    monitor_curved TEXT,
    laptop_brand TEXT,
    laptop_model TEXT,
    laptop_cpu TEXT,
    laptop_ram_gb REAL,
    laptop_storage TEXT,
    laptop_gpu TEXT,
    laptop_screen_size_inches REAL,
    laptop_screen_resolution TEXT,
    laptop_battery TEXT,
    laptop_weight_kg REAL,
    laptop_os TEXT,
    laptop_panel_type TEXT,
    laptop_refresh_rate_hz REAL,
    laptop_webcam TEXT,
    laptop_microphone TEXT,
    laptop_hdmi_ports REAL,
    laptop_usb_a_ports REAL,
    laptop_usb_c_ports REAL,
    laptop_thunderbolt_ports REAL,
    keyboard_brand TEXT,
    keyboard_model TEXT,
    keyboard_layout TEXT,
    keyboard_switch_type TEXT,
    keyboard_connection TEXT,
    keyboard_backlight TEXT,
    keyboard_hotswap TEXT,
    keyboard_size TEXT,
    generic_brand TEXT,
    generic_model TEXT,
    generic_description TEXT
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

// Migrate existing databases by adding any missing columns
const existingColumns = new Set(db.prepare("PRAGMA table_info(products)").all().map((col) => col.name));
const migrateColumns = [
  { name: "monitor_hdmi_ports", type: "REAL" },
  { name: "monitor_dp_ports", type: "REAL" },
  { name: "monitor_usb_c_ports", type: "REAL" },
  { name: "monitor_usb_a_ports", type: "REAL" },
  { name: "monitor_thunderbolt_ports", type: "REAL" },
  { name: "monitor_contrast", type: "TEXT" },
  { name: "monitor_weight_kg", type: "REAL" },
  { name: "monitor_curved", type: "TEXT" },
  { name: "laptop_panel_type", type: "TEXT" },
  { name: "laptop_refresh_rate_hz", type: "REAL" },
  { name: "laptop_webcam", type: "TEXT" },
  { name: "laptop_microphone", type: "TEXT" },
  { name: "laptop_hdmi_ports", type: "REAL" },
  { name: "laptop_usb_a_ports", type: "REAL" },
  { name: "laptop_usb_c_ports", type: "REAL" },
  { name: "laptop_thunderbolt_ports", type: "REAL" },
];
for (const col of migrateColumns) {
  if (!existingColumns.has(col.name)) {
    db.exec(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
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
