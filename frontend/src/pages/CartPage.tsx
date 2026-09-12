import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';
import { CartItem } from '../components/CartItem.js';
import { formatPrice } from '../utils/formatters.js';
import { getApiErrorMessage } from '../services/api.js';

export const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { cart, isLoading, updateQuantity, removeFromCart } = useCart();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Unauthenticated user state
  if (!isAuthenticated) {
    return (
      <div className="cart-page-container" data-testid="cart-page">
        <div className="cart-header">
          <h1 className="page-title">Your Shopping Cart</h1>
        </div>
        <div className="cart-auth-required-card" data-testid="cart-auth-required">
          <div className="cart-icon-circle" aria-hidden="true">🔒</div>
          <h2>Authentication Required</h2>
          <p>Please log in to view, manage, and save items in your shopping cart.</p>
          <div className="cart-auth-actions">
            <Link to="/login" className="btn btn-primary btn-large" data-testid="cart-login-btn">
              Sign In to Your Account
            </Link>
            <Link to="/products" className="btn btn-secondary btn-large">
              Browse Smartphones
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !cart) {
    return (
      <div className="cart-page-container" data-testid="cart-page">
        <div className="loading-container" data-testid="cart-loading" role="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading your shopping cart...</p>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const itemCount = cart?.itemCount || 0;
  const subtotal = cart?.subtotal || 0;

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    setActionError(null);
    setIsUpdating(true);
    try {
      await updateQuantity(itemId, newQty);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setActionError(null);
    setIsUpdating(true);
    try {
      await removeFromCart(itemId);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="cart-page-container" data-testid="cart-page">
        <div className="cart-header">
          <h1 className="page-title">Your Shopping Cart</h1>
        </div>
        <div className="empty-cart-card" data-testid="empty-cart-state">
          <div className="empty-cart-icon" aria-hidden="true">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any smartphones to your cart yet.</p>
          <Link to="/products" className="btn btn-primary btn-large" data-testid="start-shopping-btn">
            Explore Smartphones
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-container" data-testid="cart-page">
      <div className="cart-header">
        <h1 className="page-title">Your Shopping Cart</h1>
        <span className="cart-items-count-badge" data-testid="cart-total-badge">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {actionError && (
        <div className="alert-banner alert-error" role="alert" data-testid="cart-error-banner">
          <span>⚠️ {actionError}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      <div className="cart-layout-grid">
        {/* Left Column: Cart Items List */}
        <div className="cart-items-section">
          <div className="cart-table-wrapper">
            <table className="cart-table" aria-label="Shopping Cart Items">
              <thead>
                <tr>
                  <th scope="col" className="col-product">Product</th>
                  <th scope="col" className="col-price">Price</th>
                  <th scope="col" className="col-qty">Quantity</th>
                  <th scope="col" className="col-total">Total</th>
                  <th scope="col" className="col-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isUpdating={isUpdating}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="cart-table-footer">
            <Link to="/products" className="btn btn-outline continue-shopping-btn">
              &larr; Continue Shopping
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <aside className="cart-summary-section">
          <div className="order-summary-card" data-testid="order-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
              <strong className="summary-val" data-testid="cart-subtotal">{formatPrice(subtotal)}</strong>
            </div>

            <div className="summary-row">
              <span>Standard Shipping</span>
              <span className="text-success-badge">FREE</span>
            </div>

            <div className="summary-row">
              <span>GST & Taxes</span>
              <span className="text-muted">Included</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-row">
              <span>Grand Total</span>
              <span className="grand-total-val" data-testid="cart-grand-total">{formatPrice(subtotal)}</span>
            </div>

            <Link
              to="/checkout"
              className="btn btn-primary btn-block btn-checkout"
              data-testid="proceed-checkout-btn"
            >
              Proceed to Checkout &rarr;
            </Link>

            <div className="checkout-trust-badges">
              <span className="trust-badge-item">🔒 256-Bit SSL Encrypted</span>
              <span className="trust-badge-item">🛡️ 100% Genuine Mobile Devices</span>
              <span className="trust-badge-item">⚡ Instant Express Dispatch</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
