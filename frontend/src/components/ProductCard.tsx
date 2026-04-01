import { CATEGORY_FIELDS } from "../data/catalog";
import { calcQualityPriceIndex, getQualityPriceColor, getQualityPriceLabel } from "../lib/scoring";
import { StarRating } from "./StarRating";
import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
  compareSelected: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

export function ProductCard({ product, compareSelected, onEdit, onDelete, onToggleCompare }: ProductCardProps) {
  const fields = CATEGORY_FIELDS[product.category] ?? CATEGORY_FIELDS.Generico;
  const qpIndex = calcQualityPriceIndex(product);
  const topSpecs = fields
    .filter((field) => product.specs[field.key])
    .slice(0, 5)
    .map((field) => {
      const value = product.specs[field.key];
      return field.unit ? `${value}${field.unit}` : String(value);
    });

  return (
    <tr className="product-row" onClick={() => onEdit(product)}>
      <td className="pc-td-name">
        <div className="pc-category">{product.category}</div>
        <div className="pc-name">{product.name || "—"}</div>
      </td>
      <td className="pc-td-price">
        <span className="pc-price">{product.price ? `€${Number.parseFloat(String(product.price)).toFixed(2)}` : "—"}</span>
      </td>
      <td className="pc-td-specs">
        <div className="pc-specs">
          {topSpecs.map((spec, index) => (
            <span className="spec-chip" key={`${product.id}-spec-${index}`}>
              {spec}
            </span>
          ))}
        </div>
      </td>
      <td className="pc-td-uses">
        <div className="pc-specs">
          {product.useCases.map((useCase) => (
            <span className="spec-chip spec-chip-use-case" key={useCase}>
              {useCase}
            </span>
          ))}
        </div>
      </td>
      <td className="pc-td-qp">
        <div className="qp-badge">
          <span className="qp-dot" style={{ background: getQualityPriceColor(qpIndex) }} />
          <span style={{ color: getQualityPriceColor(qpIndex) }}>{qpIndex ?? "—"}</span>
          <span className="qp-label">{getQualityPriceLabel(qpIndex)}</span>
        </div>
      </td>
      <td className="pc-td-rating">
        {product.rating > 0 ? <StarRating value={product.rating} size={13} /> : <span className="pc-no-rating">—</span>}
      </td>
      <td
        className="pc-td-actions"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {product.url ? (
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Apri link">
            ↗
          </a>
        ) : null}
        <label className="compare-toggle" title="Confronta">
          <input
            type="checkbox"
            className="compare-check"
            checked={compareSelected}
            onChange={() => onToggleCompare(product.id)}
          />
        </label>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDelete(product.id)} title="Elimina">
          🗑
        </button>
      </td>
    </tr>
  );
}
