# 003 - Dynamic Blender Scoring

Created: 2026-05-17

## Problem

The current quality/price score for blender products uses the generic product algorithm. That score rewards filled fields, ratings, use cases, reviews, and price, but it does not evaluate blender-specific characteristics such as motor power, RPM, capacity, blades, programs, cleaning, or portability.

A fixed threshold approach would be brittle because a value such as 1200 W can be excellent in one dataset and average in another. The score should instead adapt to the products stored in the local database.

## Intended Behavior

Blender products should receive category-specific performance and quality/price scores calculated from the other blender products in the database.

Numeric characteristics should be scored dynamically against the blender dataset using relative rank/percentile behavior. Textual and boolean characteristics should be transformed into comparable feature counts and normalized against the maximum observed value in the database.

Only factor weights and use-case mappings should remain fixed. Product value thresholds, such as fixed wattage or RPM cutoffs, should not be hardcoded.

The UI should display blender-specific performance and quality/price breakdowns in product rows and comparison tables, while non-blender categories keep their existing behavior.

