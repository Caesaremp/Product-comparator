// Imports products from a JSON file into a running Product Comparator API.
// Usage: npm run import -- data/<file>.json   (API must be running, e.g. `npm run start`)
// Products with a fixed `id` are upserted, so re-running the import does not create duplicates.
const fs = require("fs");
const path = require("path");

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3187}`;

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run import -- <path/to/products.json>");
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  if (!Array.isArray(products)) {
    throw new Error("The JSON file must contain an array of products.");
  }

  const existingIds = new Set(
    (await (await fetch(`${API_URL}/api/products`)).json()).map((product) => product.id)
  );

  for (const product of products) {
    const exists = existingIds.has(product.id);
    const response = await fetch(
      exists ? `${API_URL}/api/products/${encodeURIComponent(product.id)}` : `${API_URL}/api/products`,
      {
        method: exists ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      }
    );
    if (!response.ok) {
      throw new Error(`${product.name}: HTTP ${response.status} ${await response.text()}`);
    }
    console.log(`${exists ? "Updated" : "Added"}: ${product.name}`);
  }
}

main().catch((error) => {
  console.error(`Import failed: ${error.message}`);
  console.error(`Is the API running at ${API_URL}? Start it with \`npm run start\`.`);
  process.exit(1);
});
