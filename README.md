# Product Comparator

Local-first product comparison app with a React/Vite frontend and an Express API backed by SQLite.

The project is built to track products you are evaluating, store structured specs by category, attach notes and review snippets, and compare items with a focus on quality/price. Monitors currently have a dedicated scoring model for coding, gaming, graphics, and overall value.

## Features

- Create, edit, delete, and compare saved products
- Persistent local storage through SQLite
- Category-specific forms for `Monitor`, `Laptop`, `Tastiera`, and `Generico`
- Use cases and review snippets attached to each product
- Quality/price index for all categories
- Advanced monitor scoring for:
  - coding performance
  - gaming performance
  - graphics/video performance
  - overall performance
  - value indexes derived from price
- Product table filters and sorting, including monitor-specific ranking modes

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
- `Generico`

## Scoring

### General Quality/Price Index

All categories use a general quality/price heuristic based on:

- user rating
- number of selected use cases
- completeness of filled category specs
- number of attached reviews

### Monitor Scoring

Monitors have an additional dedicated scoring system implemented in [`frontend/src/lib/scoring.ts`] and documented in [`docs/monitor-scoring-algorithm.md`].

It calculates:

- performance scores for coding, gaming, graphics, and overall
- value scores for the same dimensions using price normalization

Factors currently considered include resolution, size, panel type, refresh rate, response time, color gamut, HDR, ports, ergonomics, VESA support, and energy class.

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
