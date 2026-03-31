# 002 - Frontend Setup with Vite + React + TypeScript

Date: 2026-03-31

## Problem
The project currently contains a standalone React component file (`product-comparator.jsx`) but no real frontend application scaffold, no frontend build pipeline, no TypeScript typing around the product model, and no production path for Express to serve the UI together with the local SQLite API.

## Expected behavior after implementation
- The repository includes a dedicated frontend app under `frontend/` built with Vite, React, and TypeScript.
- Development can run both the Express API and the frontend dev server from the repo root.
- Production can serve the built frontend directly from the Express server while keeping `/api/*` routes unchanged.
- The existing product-comparison behavior is preserved: CRUD, filters, sorting, compare view, notes, reviews, ratings, and category-specific specs.
- The frontend uses shared TypeScript types for products, categories, reviews, and field metadata.
- Legacy `products-data` storage can still be migrated into SQLite when the API returns an empty product list.
- The loose root-level JSX file is replaced by a structured frontend codebase with real stylesheet files and module boundaries.
