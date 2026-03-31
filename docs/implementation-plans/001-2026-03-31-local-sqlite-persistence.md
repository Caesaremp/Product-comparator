# 001 - Local SQLite Persistence

Date: 2026-03-31

## Problem
The application currently stores all products through a single `window.storage` JSON blob. That storage is tightly coupled to the runtime environment, is not a real local database file, and does not provide an inspectable on-disk database structure for products, use cases, and reviews.

## Expected behavior after implementation
- The application reads and writes product data through a local Node API backed by SQLite.
- The database is stored on disk in the Windows app-data directory at `%APPDATA%/ProductComparator/product-comparator.db`.
- Each product is persisted in a `products` table with explicit columns for every field currently collected by the UI.
- Selected use cases are persisted in `product_use_cases`.
- Reviews are persisted in `product_reviews`.
- Existing legacy data stored under `products-data` is migrated into SQLite the first time the new persistence layer loads an empty database.
- The frontend preserves its existing product shape and continues to support filtering, sorting, comparison, notes, ratings, and category-specific specs.
- The UI shows explicit errors when the local API or SQLite persistence layer is unavailable.
