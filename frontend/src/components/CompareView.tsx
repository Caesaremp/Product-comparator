import type { ReactNode } from "react";
import { CATEGORY_FIELDS } from "../data/catalog";
import { type MonitorScores, calcMonitorScores, calcQualityPriceIndex, getMonitorScoreColor, getMonitorScoreLabel, getQualityPriceLabel } from "../lib/scoring";
import type { Product } from "../types/product";

interface CompareViewProps {
  products: Product[];
  allProducts: Product[];
}

interface CompareRow {
  key: string;
  label: string;
  render: (product: Product) => ReactNode;
  getBestValue?: (products: Product[]) => number | null;
  getValue?: (product: Product) => number | null;
}

export function CompareView({ products, allProducts }: CompareViewProps) {
  if (products.length < 2) {
    return (
      <div className="empty-state">
        <h3>Seleziona almeno 2 prodotti</h3>
        <p>Usa le checkbox nelle card prodotto per selezionare quelli da confrontare.</p>
      </div>
    );
  }

  const category = products[0].category;
  const fields = CATEGORY_FIELDS[category] ?? CATEGORY_FIELDS.Generico;
  const isMonitor = category === "Monitor";

  function monitorScoreRow(
    label: string,
    key: string,
    getScore: (s: MonitorScores) => number,
  ): CompareRow {
    return {
      label,
      key,
      render: (product) => {
        const ms = calcMonitorScores(product, allProducts);
        const val = ms ? getScore(ms) : undefined;
        if (val === undefined || val === null) return "—";
        return (
          <span style={{ color: getMonitorScoreColor(val), fontWeight: 600 }}>
            {val} <span style={{ fontWeight: 400, color: "var(--c-text-secondary)", fontSize: "0.75rem" }}>— {getMonitorScoreLabel(val)}</span>
          </span>
        );
      },
      getValue: (product) => {
        const ms = calcMonitorScores(product, allProducts);
        return ms ? (getScore(ms) ?? null) : null;
      },
      getBestValue: (prods) => {
        const vals = prods.map((p) => {
          const ms = calcMonitorScores(p, allProducts);
          return ms ? (getScore(ms) ?? null) : null;
        }).filter((v): v is number => v !== null);
        return vals.length ? Math.max(...vals) : null;
      },
    };
  }

  const monitorScoreRows: CompareRow[] = isMonitor
    ? [
        monitorScoreRow("Perf. Coding",   "_ms_coding",    (s) => s.coding),
        monitorScoreRow("Perf. Gaming",   "_ms_gaming",    (s) => s.gaming),
        monitorScoreRow("Perf. Grafica",  "_ms_grafica",   (s) => s.grafica),
        monitorScoreRow("Perf. Overall",  "_ms_overall",   (s) => s.overall),
        monitorScoreRow("Q/P Coding",     "_ms_qp_coding", (s) => s.codingQP),
        monitorScoreRow("Q/P Gaming",     "_ms_qp_gaming", (s) => s.gamingQP),
        monitorScoreRow("Q/P Grafica",    "_ms_qp_grafica",(s) => s.graficaQP),
        monitorScoreRow("Q/P Overall",    "_ms_qp_overall",(s) => s.overallQP),
      ]
    : [];

  const rows: CompareRow[] = [
    {
      label: "Prezzo",
      key: "_price",
      render: (product) => (product.price ? `€${Number.parseFloat(String(product.price)).toFixed(2)}` : "—"),
      getValue: (product) => Number.parseFloat(String(product.price)) || null,
      getBestValue: (prods) => {
        const prices = prods.map((p) => Number.parseFloat(String(p.price))).filter((v) => !Number.isNaN(v) && v > 0);
        return prices.length ? Math.min(...prices) : null;
      },
    },
    {
      label: "Rating medio",
      key: "_rating",
      render: (product) => {
        const rated = product.reviews.filter((r) => r.rating > 0);
        if (rated.length === 0) return "—";
        const avg = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
        return `${avg.toFixed(1)} / 5`;
      },
    },
    ...(!isMonitor
      ? [
          {
            label: "Q/P Index",
            key: "_qp",
            render: (product: Product) => {
              const index = calcQualityPriceIndex(product);
              return index !== null ? `${index} — ${getQualityPriceLabel(index)}` : "—";
            },
            getValue: (product: Product) => calcQualityPriceIndex(product),
            getBestValue: (prods: Product[]) => {
              const vals = prods.map(calcQualityPriceIndex).filter((v): v is number => v !== null);
              return vals.length ? Math.max(...vals) : null;
            },
          },
        ]
      : []),
    ...monitorScoreRows,
    ...fields.map((field) => ({
      label: field.label,
      key: field.key,
      render: (product: Product) => {
        const value = product.specs[field.key];
        if (!value) return "—";
        return field.unit ? `${value} ${field.unit}` : value;
      },
    })),
    {
      label: "Casi d'uso",
      key: "_uc",
      render: (product) => product.useCases.join(", ") || "—",
    },
    {
      label: "Recensioni",
      key: "_reviews",
      render: (product) => (product.reviews.length ? `${product.reviews.length} fonte/i` : "—"),
    },
    {
      label: "Link",
      key: "_url",
      render: (product) =>
        product.url ? (
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="link-chip">
            Apri ↗
          </a>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="compare-table">
      <table>
        <thead>
          <tr>
            <th />
            {products.map((product) => (
              <td key={product.id} className="compare-product-name">
                {product.name || "—"}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const bestValue = row.getBestValue?.(products) ?? null;
            return (
              <tr key={row.key}>
                <th>{row.label}</th>
                {products.map((product) => {
                  let className = "";
                  if (bestValue !== null && row.getValue) {
                    const val = row.getValue(product);
                    // For price: lowest is best; for scores: highest is best
                    const isBest = row.key === "_price"
                      ? val === bestValue
                      : val !== null && val === bestValue;
                    if (isBest) className = "highlight-best";
                  }
                  return (
                    <td key={`${product.id}-${row.key}`} className={className}>
                      {row.render(product)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
