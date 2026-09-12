import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../types/product.js';
import { formatPrice, getStockInfo } from '../utils/formatters.js';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const stockInfo = getStockInfo(product.stock);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (product.stock <= 0) return;
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // Handled silently
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article className="product-card" data-testid="product-card">
      {/* Product Image Link */}
      <Link to={`/products/${product.id}`} className="product-image-wrap" tabIndex={-1} aria-hidden="true">
        <img
          src={product.image}
          alt={`${product.brand} ${product.name}`}
          className="product-image"
          loading="lazy"
        />
        {product.discountPercentage > 0 && (
          <span className="discount-tag">
            {Math.round(product.discountPercentage)}% OFF
          </span>
        )}
      </Link>

      {/* Product Info */}
      <div className="product-card-body">
        <div className="product-brand-row">
          <span className="product-brand-badge">{product.brand}</span>
          <span className={`stock-badge ${stockInfo.labelClass}`}>
            {stockInfo.status}
          </span>
        </div>

        <h3 className="product-card-title">
          <Link to={`/products/${product.id}`} data-testid="product-name" className="product-title-link">
            {product.name}
          </Link>
        </h3>

        <p className="product-model-text">{product.model}</p>

        {/* Pricing */}
        <div className="product-price-row">
          <span className="current-price" data-testid="product-price">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="original-price">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="product-card-actions">
          <Link
            to={`/products/${product.id}`}
            className="btn btn-outline view-details-btn"
            data-testid="product-details-button"
            aria-label={`View details for ${product.name}`}
          >
            View Details
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-quick-cart"
            onClick={handleQuickAdd}
            disabled={product.stock <= 0 || isAdding}
            data-testid="add-to-cart-quick-btn"
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? '✓ Added' : isAdding ? '...' : '🛒 Add'}
          </button>
        </div>
      </div>
    </article>
  );
};

