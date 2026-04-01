import { CATEGORY_FIELDS } from "../data/catalog";
import { calcMonitorScores, calcQualityPriceIndex, getMonitorScoreColor, getMonitorScoreLabel, getQualityPriceColor, getQualityPriceLabel } from "../lib/scoring";
import { StarRating } from "./StarRating";
import type { Product } from "../types/product";

interface ProductCardProps {
  product: Product;
  allProducts: Product[];
  compareSelected: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

function ScoreBar({ label, score, qp }: { label: string; score: number; qp: number }) {
  const color = getMonitorScoreColor(score);
  const qpColor = getMonitorScoreColor(qp);
  return (
    <div className="ms-row">
      <span className="ms-label">{label}</span>
      <div className="ms-bar-wrap">
        <div className="ms-bar" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="ms-val" style={{ color }}>{score}</span>
      <span className="ms-sep">|</span>
      <span className="ms-qp-val" style={{ color: qpColor }}>{qp}</span>
    </div>
  );
}

export function ProductCard({ product, allProducts, compareSelected, onEdit, onDelete, onToggleCompare }: ProductCardProps) {
  const fields = CATEGORY_FIELDS[product.category] ?? CATEGORY_FIELDS.Generico;
  const monitorScores = product.category === "Monitor" ? calcMonitorScores(product, allProducts) : null;
  const qpIndex = monitorScores === null ? calcQualityPriceIndex(product) : null;

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
        {monitorScores ? (
          <div className="monitor-scores">
            <ScoreBar label="Coding"  score={monitorScores.coding}  qp={monitorScores.codingQP} />
            <ScoreBar label="Gaming"  score={monitorScores.gaming}  qp={monitorScores.gamingQP} />
            <ScoreBar label="Grafica" score={monitorScores.grafica} qp={monitorScores.graficaQP} />
            <ScoreBar label="Overall" score={monitorScores.overall} qp={monitorScores.overallQP} />
            <div className="ms-legend">Perf &nbsp;|&nbsp; Q/P</div>
          </div>
        ) : (
          <div className="qp-badge">
            <span className="qp-dot" style={{ background: getQualityPriceColor(qpIndex) }} />
            <span style={{ color: getQualityPriceColor(qpIndex) }}>{qpIndex ?? "—"}</span>
            <span className="qp-label">{getQualityPriceLabel(qpIndex)}</span>
          </div>
        )}
      </td>
      <td className="pc-td-rating">
        {(() => {
          const rated = product.reviews.filter((r) => r.rating > 0);
          if (rated.length === 0) return <span className="pc-no-rating">—</span>;
          const avg = rated.reduce((sum, r) => sum + r.rating, 0) / rated.length;
          return <StarRating value={avg} size={13} />;
        })()}
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
