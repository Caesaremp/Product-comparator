import { useCallback, useEffect, useMemo, useState } from "react";
import { CompareView } from "./components/CompareView";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { CATEGORIES } from "./data/catalog";
import { createProduct, deleteProductById, getErrorMessage, loadProducts, updateProduct } from "./lib/api";
import { calcQualityPriceIndex } from "./lib/scoring";
import type { Product, ProductCategory } from "./types/product";

type ViewMode = "products" | "compare";
type SortMode = "date" | "price" | "qp" | "rating";
type FilterCategory = "Tutti" | ProductCategory;

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [persistenceError, setPersistenceError] = useState("");
  const [view, setView] = useState<ViewMode>("products");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("Tutti");
  const [sortBy, setSortBy] = useState<SortMode>("date");

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadProducts();
      setProducts(data);
      setPersistenceError("");
    } catch (error) {
      setPersistenceError(getErrorMessage(error, "Impossibile connettersi al database locale."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  async function handleSave(product: Product) {
    const existing = products.find((entry) => entry.id === product.id);

    try {
      const savedProduct = existing ? await updateProduct(product) : await createProduct(product);
      setProducts((current) =>
        existing ? current.map((entry) => (entry.id === savedProduct.id ? savedProduct : entry)) : [...current, savedProduct]
      );
      setPersistenceError("");
      setShowModal(false);
      setEditProduct(null);
    } catch (error) {
      setPersistenceError(getErrorMessage(error, "Impossibile salvare il prodotto."));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProductById(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      setCompareIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setPersistenceError("");
    } catch (error) {
      setPersistenceError(getErrorMessage(error, "Impossibile eliminare il prodotto."));
    }
  }

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const filteredProducts = useMemo(() => {
    const list = filterCategory === "Tutti" ? [...products] : products.filter((product) => product.category === filterCategory);

    switch (sortBy) {
      case "price":
        return list.sort((left, right) => (Number.parseFloat(String(left.price)) || 9999) - (Number.parseFloat(String(right.price)) || 9999));
      case "qp":
        return list.sort((left, right) => (calcQualityPriceIndex(right) ?? -1) - (calcQualityPriceIndex(left) ?? -1));
      case "rating":
        return list.sort((left, right) => right.rating - left.rating);
      default:
        return list.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    }
  }, [filterCategory, products, sortBy]);

  const compareProducts = products.filter((product) => compareIds.has(product.id));

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app">
          <div className="empty-state">
            <p>Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <div className="app">
        <header className="header">
          <div className="logo">
            <div className="logo-icon">⚡</div>
            <h1>
              Product<span>Lab</span>
            </h1>
          </div>
          <nav className="nav">
            <button type="button" className={`nav-btn ${view === "products" ? "active" : ""}`} onClick={() => setView("products")}>
              Prodotti {products.length > 0 ? `(${products.length})` : ""}
            </button>
            <button type="button" className={`nav-btn ${view === "compare" ? "active" : ""}`} onClick={() => setView("compare")}>
              Confronta {compareIds.size > 0 ? `(${compareIds.size})` : ""}
            </button>
          </nav>
        </header>

        {persistenceError ? (
          <div className="status-banner">
            <p>{persistenceError}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshProducts()}>
              Riprova
            </button>
          </div>
        ) : null}

        {view === "products" ? (
          <>
            <div className="toolbar">
              <div className="filter-group">
                <select className="select" value={filterCategory} onChange={(event) => setFilterCategory(event.target.value as FilterCategory)}>
                  <option value="Tutti">Tutte le categorie</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortMode)}>
                  <option value="date">Più recenti</option>
                  <option value="price">Prezzo ↑</option>
                  <option value="qp">Qualità/Prezzo ↓</option>
                  <option value="rating">Rating ↓</option>
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setEditProduct(null);
                  setShowModal(true);
                }}
              >
                + Nuovo prodotto
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <h3>Nessun prodotto ancora</h3>
                <p>Aggiungi il tuo primo prodotto per iniziare a confrontare e trovare il miglior rapporto qualità/prezzo.</p>
              </div>
            ) : (
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Prezzo</th>
                    <th>Specifiche</th>
                    <th>Usi</th>
                    <th>Q/P</th>
                    <th>Rating</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      compareSelected={compareIds.has(product.id)}
                      onEdit={(nextProduct) => {
                        setEditProduct(nextProduct);
                        setShowModal(true);
                      }}
                      onDelete={(id) => void handleDelete(id)}
                      onToggleCompare={toggleCompare}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <CompareView products={compareProducts} />
        )}

        {showModal ? (
          <ProductModal
            product={editProduct}
            categories={CATEGORIES}
            onSave={(product) => void handleSave(product)}
            onClose={() => {
              setShowModal(false);
              setEditProduct(null);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
