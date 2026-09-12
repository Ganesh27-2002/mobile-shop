import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService.js';
import type { Product } from '../types/product.js';
import { formatPrice, getStockInfo } from '../utils/formatters.js';
import { getApiErrorMessage } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);
  const [cartErrorMessage, setCartErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);

      try {
        const data = await productService.getProductById(id);
        if (isMounted) {
          setProduct(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="loading-container" data-testid="product-loading" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-container">
        <div className="not-found-card" data-testid="product-error" role="alert">
          <div className="not-found-icon" aria-hidden="true">📱</div>
          <h2>Product Not Found</h2>
          <p>{error || 'The requested smartphone could not be found or is no longer available.'}</p>
          <Link to="/products" className="btn btn-primary">
            &larr; Back to Smartphone Catalog
          </Link>
        </div>
      </div>
    );
  }

  const stockInfo = getStockInfo(product.stock);
  const savings = product.originalPrice > product.price ? product.originalPrice - product.price : 0;

  return (
    <div className="product-details-container" data-testid="product-details-page">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumbs-nav" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-separator" aria-hidden="true">/</li>
          <li className="breadcrumb-item">
            <Link to="/products">Products</Link>
          </li>
          <li className="breadcrumb-separator" aria-hidden="true">/</li>
          {product.category && (
            <>
              <li className="breadcrumb-item">
                <Link to={`/products?category=${product.category.slug}`}>
                  {product.category.name}
                </Link>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">/</li>
            </>
          )}
          <li className="breadcrumb-item active" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Main Product Showcase Grid */}
      <article className="product-showcase-card">
        {/* Left: Product Image Display */}
        <div className="product-showcase-media">
          <div className="image-frame">
            <img
              src={product.image}
              alt={`${product.brand} ${product.name}`}
              className="showcase-img"
            />
            {product.discountPercentage > 0 && (
              <span className="showcase-discount-tag">
                {Math.round(product.discountPercentage)}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right: Product Details Info & Actions */}
        <div className="product-showcase-info">
          <div className="product-badges-row">
            <span className="product-brand-badge">{product.brand}</span>
            {product.category && (
              <span className="product-category-badge">{product.category.name}</span>
            )}
            <span className={`stock-badge ${stockInfo.labelClass}`}>
              {stockInfo.status}
            </span>
          </div>

          <h1 className="showcase-title" data-testid="showcase-name">
            {product.name}
          </h1>

          <p className="showcase-model-id">
            Model: <strong>{product.model}</strong>
          </p>

          {/* Pricing Block */}
          <div className="showcase-pricing-block">
            <div className="showcase-price-row">
              <span className="showcase-current-price" data-testid="showcase-price">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="showcase-original-price">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="showcase-savings-text">
                You save <strong>{formatPrice(savings)}</strong> ({Math.round(product.discountPercentage)}% discount)
              </p>
            )}
            <p className="inclusive-taxes-note">Inclusive of all taxes & free shipping across India</p>
          </div>

          {/* Description */}
          <div className="showcase-desc-section">
            <h2 className="section-subtitle">Description</h2>
            <p className="showcase-description">{product.description}</p>
          </div>

          {/* Stock & Availability Info */}
          <div className="stock-info-box">
            <span className="stock-info-icon">📦</span>
            <div className="stock-info-text">
              <strong>Availability: </strong>
              <span>{stockInfo.status} ({product.stock} units available in warehouse)</span>
            </div>
          </div>

          {/* Quantity Selector & Add to Cart */}
          {product.stock > 0 ? (
            <div className="product-purchase-box">
              <div className="qty-picker-row">
                <label htmlFor="product-qty-input" className="qty-picker-label">
                  Quantity:
                </label>
                <div className="quantity-selector" role="group" aria-label="Quantity selector">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isAdding}
                    data-testid="decrease-qty-btn"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span
                    id="product-qty-input"
                    className="qty-display"
                    data-testid="product-quantity-display"
                    aria-live="polite"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || isAdding}
                    data-testid="increase-qty-btn"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <span className="qty-limit-note">Max {product.stock} units</span>
              </div>

              {cartSuccessMessage && (
                <div className="alert-banner alert-success" role="alert" data-testid="cart-success-message">
                  <span>✅ {cartSuccessMessage}</span>
                  <Link to="/cart" className="alert-action-link" data-testid="view-cart-link">
                    View Cart &rarr;
                  </Link>
                </div>
              )}

              {cartErrorMessage && (
                <div className="alert-banner alert-error" role="alert" data-testid="cart-error-message">
                  <span>⚠️ {cartErrorMessage}</span>
                </div>
              )}

              <div className="showcase-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-large btn-add-cart"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setIsAdding(true);
                    setCartErrorMessage(null);
                    setCartSuccessMessage(null);
                    try {
                      await addToCart(product.id, quantity);
                      setCartSuccessMessage(`Added ${quantity} ${quantity === 1 ? 'unit' : 'units'} of ${product.name} to cart!`);
                    } catch (err) {
                      setCartErrorMessage(getApiErrorMessage(err));
                    } finally {
                      setIsAdding(false);
                    }
                  }}
                  disabled={isAdding}
                  data-testid="add-to-cart-button"
                  aria-label="Add to cart"
                >
                  {isAdding ? 'Adding to Cart...' : '🛒 Add to Cart'}
                </button>
                <Link to="/products" className="btn btn-secondary btn-large">
                  &larr; Continue Shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="out-of-stock-box">
              <div className="alert-banner alert-warning" role="alert">
                <span>⚠️ This smartphone is currently out of stock. Please check back later!</span>
              </div>
              <div className="showcase-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-large btn-add-cart"
                  disabled
                  data-testid="add-to-cart-button"
                >
                  Out of Stock
                </button>
                <Link to="/products" className="btn btn-secondary btn-large">
                  &larr; Browse Available Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Specifications Table */}
      <section className="product-specs-section">
        <h2 className="specs-section-title">Technical Specifications</h2>
        <div className="specs-table-wrapper">
          <table className="specs-table">
            <tbody>
              <tr>
                <th scope="row">Brand</th>
                <td>{product.brand}</td>
              </tr>
              <tr>
                <th scope="row">Model Name</th>
                <td>{product.model}</td>
              </tr>
              <tr>
                <th scope="row">Category</th>
                <td>{product.category?.name || 'Smartphones'}</td>
              </tr>
              <tr>
                <th scope="row">Stock Availability</th>
                <td>{stockInfo.status}</td>
              </tr>
              <tr>
                <th scope="row">Connectivity</th>
                <td>5G, Wi-Fi 6E/7, Bluetooth 5.3, NFC, GPS</td>
              </tr>
              <tr>
                <th scope="row">Warranty</th>
                <td>1 Year Comprehensive Manufacturer Warranty</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
