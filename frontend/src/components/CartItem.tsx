import React from 'react';
import { Link } from 'react-router-dom';
import type { CartItem as CartItemType } from '../types/cart.js';
import { formatPrice } from '../utils/formatters.js';

export interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  isUpdating: boolean;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}) => {
  const { product, quantity, unitPrice, itemTotal } = item;
  const isMaxStock = quantity >= product.stock;
  const isMinQty = quantity <= 1;

  const handleIncrement = () => {
    if (!isMaxStock && !isUpdating) {
      onUpdateQuantity(item.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (!isMinQty && !isUpdating) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  return (
    <tr className="cart-item-row" data-testid="cart-item-row" data-item-id={item.id}>
      {/* Product Image & Details */}
      <td className="cart-item-product-col">
        <div className="cart-product-info">
          <Link to={`/products/${product.id}`} className="cart-product-thumb-link">
            <img
              src={product.image}
              alt={product.name}
              className="cart-product-thumb"
              loading="lazy"
            />
          </Link>
          <div className="cart-product-meta">
            <span className="cart-product-brand">{product.brand}</span>
            <h3 className="cart-product-title">
              <Link to={`/products/${product.id}`} className="cart-product-link" data-testid="cart-product-name">
                {product.name}
              </Link>
            </h3>
            <span className="cart-product-model">Model: {product.model}</span>
            {product.stock <= 5 && (
              <span className="cart-stock-warning">Only {product.stock} left in stock!</span>
            )}
          </div>
        </div>
      </td>

      {/* Unit Price */}
      <td className="cart-item-price-col" data-testid="cart-item-unit-price">
        <span className="mobile-col-label">Price: </span>
        <span className="price-value">{formatPrice(unitPrice)}</span>
      </td>

      {/* Quantity Selector */}
      <td className="cart-item-quantity-col">
        <span className="mobile-col-label">Quantity: </span>
        <div className="cart-qty-control" role="group" aria-label={`Quantity for ${product.name}`}>
          <button
            type="button"
            className="qty-btn qty-btn-dec"
            onClick={handleDecrement}
            disabled={isMinQty || isUpdating}
            data-testid="decrease-qty-btn"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="qty-value-display" data-testid="cart-item-qty" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="qty-btn qty-btn-inc"
            onClick={handleIncrement}
            disabled={isMaxStock || isUpdating}
            data-testid="increase-qty-btn"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </td>

      {/* Total Price */}
      <td className="cart-item-total-col" data-testid="cart-item-total">
        <span className="mobile-col-label">Total: </span>
        <span className="total-value">{formatPrice(itemTotal)}</span>
      </td>

      {/* Remove Action */}
      <td className="cart-item-actions-col">
        <button
          type="button"
          className="btn-remove-item"
          onClick={() => onRemove(item.id)}
          disabled={isUpdating}
          data-testid="remove-cart-item-btn"
          aria-label={`Remove ${product.name} from cart`}
          title="Remove item"
        >
          🗑️ <span className="remove-text">Remove</span>
        </button>
      </td>
    </tr>
  );
};
