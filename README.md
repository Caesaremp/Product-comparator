# Product Comparator

Local-first product comparison app with a React/Vite frontend and an Express API backed by SQLite.

The project is built to track products you are evaluating, store structured specs by category, attach notes and review snippets, and compare items with a focus on quality/price. Monitors, blenders and PC components have dedicated scoring models tailored to their own dimensions.

## Features

- Create, edit, delete, and compare saved products
- Persistent local storage through SQLite
- Category-specific forms for `Monitor`, `Laptop`, `Tastiera`, `Frullatore`, `RAM`, `Scheda Madre`, `CPU`, `GPU`, `Alimentatore`, and `Generico`
- Use cases and review snippets attached to each product
- Quality/price index for all categories
- Dedicated scoring per category, each on its own dimensions plus:
  - an overall score weighted by the selected use cases
  - value indexes derived from price for every dimension
- Product table filters and sorting, including category-specific ranking modes

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Backend: Node.js, Express
- Database: SQLite via `better-sqlite3`
- Workspace tooling: npm workspaces, `concurrently`

## Repository Structure

```text
.
|-- frontend/                    # Vite + React application
|   |-- src/
|   |   |-- components/          # UI components
|   |   |-- data/                # category field definitions and use cases
|   |   |-- lib/                 # API client and scoring logic
|   |   `-- types/               # shared frontend types
|-- server/
|   `-- index.js                 # Express API + SQLite bootstrap/migrations
|-- docs/
|   |-- monitor-scoring-algorithm.md
|   `-- implementation-plans/
|-- package.json                 # root scripts
`-- README.md
```

## Requirements

- Node.js 20+ recommended
- npm 10+ recommended

## Installation

Install dependencies from the repository root:

```bash
npm install
```

The frontend is configured as an npm workspace, so the root install covers both backend and frontend dependencies.

## Running Locally

Start API and frontend dev server together:

```bash
npm run dev
```

This starts:

- API server on `http://localhost:3187`
- Vite frontend dev server on its default local port

Useful scripts:

```bash
npm run dev:api
npm run dev:frontend
npm run build
npm run typecheck
npm run start
```

### Runtime Modes

- `npm run dev`: runs the API and Vite in parallel for development
- `npm run build`: builds the frontend bundle into `frontend/dist`
- `npm run start`: runs only the Express server

When `frontend/dist` exists, the Express server also serves the built frontend. That means a production-like local flow is:

```bash
npm run build
npm run start
```

## Data Persistence

Products are stored in a local SQLite database created automatically on first run.

Default database location on Windows:

```text
%APPDATA%\ProductComparator\product-comparator.db
```

The API also performs lightweight schema migrations at startup to add missing columns when the database schema evolves.

## Product Model

Every product stores:

- basic metadata: name, category, price, URL, rating, notes, timestamps
- category-specific specs
- selected use cases
- saved review snippets with source, text, rating, and count

Supported categories:

- `Monitor`
- `Laptop`
- `Tastiera`
- `Frullatore`
- `RAM`
- `Scheda Madre`
- `CPU`
- `GPU`
- `Alimentatore`
- `Generico`

## Scoring

### General Quality/Price Index

Categories without a dedicated scoring system fall back to a generic quality/price heuristic based on:

- user rating
- number of selected use cases
- completeness of filled category specs
- number of attached reviews

### Category Scoring

Scored categories live in [`frontend/src/lib/scoring`], one module each, wired through `registry.ts`. Every one of them produces performance scores on its own dimensions, an overall score weighted by the product's use cases, and a price-normalized counterpart for each.

| Category | Dimensions |
|---|---|
| Monitor | coding, gaming, graphics |
| Frullatore | smoothie, ice, family, cleaning |
| RAM | gaming, productivity, overclock, compatibility |
| Scheda Madre | gaming, expandability, overclock, connectivity |
| CPU | gaming, productivity, efficiency, overclock |
| GPU | raster gaming, ray tracing, creation/AI, efficiency, compactness |
| Alimentatore | power, efficiency, noise, reliability, compactness |

Monitors are scored against fixed thresholds (resolution, panel type, refresh rate, response time, color gamut, HDR, ports, ergonomics, VESA, energy class), documented in [`docs/monitor-scoring-algorithm.md`].

Blenders and PC components are scored relative to the other products of the same category in the database, so no value threshold is hardcoded. See [`docs/pc-components-scoring-algorithm.md`].

Adding a category means adding a scoring module and one registry entry: the product table, the comparison view and the sort modes are generated from the registry.

## API Overview

The backend exposes a small REST API:

- `GET /api/health`
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

The API source lives in [`server/index.js`].

## Legacy Data Migration

The frontend still contains a fallback migration path from an older client-side storage key named `products-data`. If the API database is empty and legacy data is available through `window.storage`, products are imported into SQLite automatically on load.

See [`frontend/src/lib/api.ts`].

## Documentation

- Monitor scoring spec: [`docs/monitor-scoring-algorithm.md`]
- PC components scoring spec: [`docs/pc-components-scoring-algorithm.md`]
- Implementation plans: [`docs/implementation-plans`]

## Manual Verification

After cloning or after future changes, verify behavior with this checklist:

1. Run `npm run dev`.
2. Confirm the API responds at `http://localhost:3187/api/health`.
3. Open the frontend and create one product for at least two categories.
4. Edit an existing product and verify changes persist after refresh.
5. Delete a product and confirm it disappears from the list after reload.
6. Add two or more monitors and verify monitor-specific sort modes produce sensible rankings.
7. Run `npm run build` and then `npm run start` to confirm the built frontend is served by Express.

## Notes

- The repository currently includes a built frontend bundle in `frontend/dist`.
- The UI text and product taxonomy are currently Italian-oriented.
