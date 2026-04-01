import type { ReactNode } from "react";
import { CATEGORY_FIELDS } from "../data/catalog";
import { calcQualityPriceIndex, getQualityPriceLabel } from "../lib/scoring";
import type { Product } from "../types/product";

interface CompareViewProps {
  products: Product[];
}

interface CompareRow {
  key: string;
  label: string;
  render: (product: Product) => ReactNode;
}

export function CompareView({ products }: CompareViewProps) {
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
  const rows: CompareRow[] = [
    {
      label: "Prezzo",
      key: "_price",
      render: (product) => (product.price ? `€${Number.parseFloat(String(product.price)).toFixed(2)}` : "—"),
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
    {
      label: "Q/P Index",
      key: "_qp",
      render: (product) => {
        const index = calcQualityPriceIndex(product);
        return index !== null ? `${index} — ${getQualityPriceLabel(index)}` : "—";
      },
    },
    ...fields.map((field) => ({
      label: field.label,
      key: field.key,
      render: (product: Product) => {
        const value = product.specs[field.key];
        if (!value) {
          return "—";
        }
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

  const prices = products.map((product) => Number.parseFloat(String(product.price))).filter((value) => !Number.isNaN(value) && value > 0);
  const bestPrice = prices.length ? Math.min(...prices) : null;
  const qpIndices = products.map((product) => calcQualityPriceIndex(product)).filter((value): value is number => value !== null);
  const bestQualityPrice = qpIndices.length ? Math.max(...qpIndices) : null;

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
          {rows.map((row) => (
            <tr key={row.key}>
              <th>{row.label}</th>
              {products.map((product) => {
                let className = "";
                if (row.key === "_price" && bestPrice !== null && Number.parseFloat(String(product.price)) === bestPrice) {
                  className = "highlight-best";
                }
                if (row.key === "_qp" && bestQualityPrice !== null && calcQualityPriceIndex(product) === bestQualityPrice) {
                  className = "highlight-best";
                }
                return (
                  <td key={`${product.id}-${row.key}`} className={className}>
                    {row.render(product)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
