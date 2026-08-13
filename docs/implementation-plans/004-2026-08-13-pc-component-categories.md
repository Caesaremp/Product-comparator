# 004 - PC Component Categories

Created: 2026-08-13

## Problem

The catalog only covers Monitor, Laptop, Tastiera and Frullatore. Building a PC
requires comparing RAM kits, motherboards, CPUs, GPUs and power supplies, and
those categories have no fields and no scoring at all: they fall back to the
generic quality/price index, which rewards filled fields rather than hardware
quality.

Adding them the way Monitor and Frullatore were added does not scale. Each
category carried its own score type, its own UI branch in the product row and in
the comparison table, and two sort cases per dimension in `App`. Five more
categories would mean roughly fifty new sort cases and five more rendering
branches for behaviour that is identical in every category.

## Intended Behavior

Categories that have a scoring system are described by a single registry entry:
the dimensions they are scored on and the function that computes them. The
product row, the comparison table and the sort dropdown read that registry, so a
new category becomes one entry plus one scoring module, with no UI changes.

The database schema follows the same rule: spec columns are derived from the
existing spec definitions, so adding a category or a field never requires hand
written SQL.

RAM, motherboards, CPUs, GPUs and power supplies each receive performance scores
on their own dimensions plus a quality/price counterpart, using the dataset
driven approach adopted for blenders in plan 003: numeric characteristics are
scored against the other products of the same category rather than against
hardcoded thresholds, so scores stay meaningful as hardware evolves. Only weights,
use-case mappings and intrinsically tiered specs (80 Plus levels, PCIe
generations, chipset families, DDR generations) remain fixed.

Monitor and Frullatore keep their existing algorithms and results unchanged.

## Open Point

These five categories are meant to live under a shared "Componenti PC" parent
category. The registry already carries a `group` field marking them, currently
used to group the sort options; the parent category itself (filtering, a build
view, compatibility between components) is deliberately left out of this plan.
