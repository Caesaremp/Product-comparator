import { useState } from "react";
import { CATEGORY_FIELDS, USE_CASES } from "../data/catalog";
import { createEmptyProduct, genId, getDisplayName } from "../lib/products";
import { StarRating } from "./StarRating";
import type { Product, ProductCategory, ProductReview, ProductSpecValue, SpecKey } from "../types/product";

interface ProductModalProps {
  product: Product | null;
  categories: ProductCategory[];
  onSave: (product: Product) => void;
  onClose: () => void;
}

interface DraftReview {
  source: string;
  text: string;
  rating: number;
  count: number;
}

export function ProductModal({ product, categories, onSave, onClose }: ProductModalProps) {
  const [data, setData] = useState<Product>(product ?? createEmptyProduct());
  const [newReview, setNewReview] = useState<DraftReview>({ source: "", text: "", rating: 0, count: 0 });

  const fields = CATEGORY_FIELDS[data.category] ?? CATEGORY_FIELDS.Generico;
  const useCases = USE_CASES[data.category] ?? USE_CASES.Generico;

  function updateSpec(key: SpecKey, value: ProductSpecValue | "") {
    setData((current) => ({
      ...current,
      specs: {
        ...current.specs,
        [key]: value,
      },
    }));
  }

  function changeCategory(category: ProductCategory) {
    setData((current) => ({
      ...current,
      category,
      specs: {},
      useCases: [],
    }));
  }

  function toggleUseCase(useCase: string) {
    setData((current) => ({
      ...current,
      useCases: current.useCases.includes(useCase)
        ? current.useCases.filter((entry) => entry !== useCase)
        : [...current.useCases, useCase],
    }));
  }

  function addReview() {
    if (!newReview.source.trim() || !newReview.text.trim()) {
      return;
    }

    const review: ProductReview = {
      id: genId(),
      source: newReview.source,
      text: newReview.text,
      rating: newReview.rating,
      count: newReview.count,
    };

    setData((current) => ({
      ...current,
      reviews: [...current.reviews, review],
    }));
    setNewReview({ source: "", text: "", rating: 0, count: 0 });
  }

  function removeReview(id: string) {
    setData((current) => ({
      ...current,
      reviews: current.reviews.filter((review) => review.id !== id),
    }));
  }

  const displayName = getDisplayName(data);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="modal-title">
          <span>{product ? "Modifica Prodotto" : "Nuovo Prodotto"}</span>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label">Categoria</label>
            <select className="select" value={data.category} onChange={(event) => changeCategory(event.target.value as ProductCategory)}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Prezzo (€)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="299.99"
              value={data.price}
              onChange={(event) => {
                setData((current) => ({ ...current, price: event.target.value }));
              }}
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Nome prodotto</label>
          <input
            className="input"
            placeholder="es. Dell S2722QC"
            value={data.name}
            onChange={(event) => {
              setData((current) => ({ ...current, name: event.target.value }));
            }}
          />
        </div>

        <div className="field">
          <label className="label">Link prodotto</label>
          <input
            className="input"
            type="url"
            placeholder="https://amazon.it/..."
            value={data.url}
            onChange={(event) => {
              setData((current) => ({ ...current, url: event.target.value }));
            }}
          />
        </div>


        <div className="section-title">Caratteristiche</div>
        <div className="field-row">
          {fields.map((field) => (
            <div className="field" key={field.key}>
              <label className="label">
                {field.label} {field.unit ? <span className="label-unit">({field.unit})</span> : null}
              </label>
              {field.type === "select" ? (
                <select
                  className="select"
                  value={String(data.specs[field.key] ?? "")}
                  onChange={(event) => updateSpec(field.key, event.target.value)}
                >
                  <option value="">—</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  className="textarea"
                  placeholder={field.placeholder ?? ""}
                  value={String(data.specs[field.key] ?? "")}
                  onChange={(event) => updateSpec(field.key, event.target.value)}
                />
              ) : (
                <input
                  className="input"
                  type={field.type}
                  placeholder={field.placeholder ?? ""}
                  value={String(data.specs[field.key] ?? "")}
                  onChange={(event) => updateSpec(field.key, event.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="section-title">Casi d'uso</div>
        <div className="use-case-tags">
          {useCases.map((useCase) => (
            <button
              key={useCase}
              type="button"
              className={`uc-tag ${data.useCases.includes(useCase) ? "selected" : ""}`}
              onClick={() => toggleUseCase(useCase)}
            >
              {useCase}
            </button>
          ))}
        </div>

        <div className="section-title">Recensioni</div>
        {data.reviews.map((review) => (
          <div className="review-item" key={review.id}>
            <div className="review-header">
              <span className="review-source">{review.source}</span>
              <div className="review-actions">
                {review.rating > 0 ? <StarRating value={review.rating} size={12} /> : null}
                {review.count > 0 ? <span className="review-count">{review.count} rec.</span> : null}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeReview(review.id)}>
                  ×
                </button>
              </div>
            </div>
            <p className="review-text">{review.text}</p>
          </div>
        ))}
        <div className="review-form">
          <div className="field-row">
            <div className="field">
              <label className="label">Fonte</label>
              <input
                className="input"
                placeholder="es. TechRadar, YouTube, Amazon"
                value={newReview.source}
                onChange={(event) => {
                  setNewReview((current) => ({ ...current, source: event.target.value }));
                }}
              />
            </div>
            <div className="field">
              <label className="label">N° recensioni</label>
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                placeholder="es. 1250"
                value={newReview.count === 0 ? "" : newReview.count}
                onChange={(event) => {
                  const raw = parseInt(event.target.value, 10);
                  const count = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                  setNewReview((current) => ({ ...current, count }));
                }}
              />
            </div>
            <div className="field">
              <label className="label">Rating (0–5)</label>
              <div className="rating-input-row">
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="es. 4.5"
                  value={newReview.rating === 0 ? "" : newReview.rating}
                  onChange={(event) => {
                    const raw = parseFloat(event.target.value);
                    const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
                    setNewReview((current) => ({ ...current, rating }));
                  }}
                />
                <StarRating value={newReview.rating} size={16} />
              </div>
            </div>
          </div>
          <div className="field">
            <label className="label">Nota / estratto</label>
            <textarea
              className="textarea"
              placeholder="Punti chiave della recensione..."
              value={newReview.text}
              onChange={(event) => {
                setNewReview((current) => ({ ...current, text: event.target.value }));
              }}
            />
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addReview}>
            + Aggiungi recensione
          </button>
        </div>

        <div className="section-title">Note personali</div>
        <div className="field">
          <textarea
            className="textarea"
            placeholder="Le tue considerazioni..."
            value={data.notes}
            onChange={(event) => {
              setData((current) => ({ ...current, notes: event.target.value }));
            }}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onSave({
                ...data,
                name: displayName || data.name || "Prodotto senza nome",
              });
            }}
          >
            {product ? "Salva modifiche" : "Aggiungi prodotto"}
          </button>
        </div>
      </div>
    </div>
  );
}
