import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { orderService } from '../services/orderService.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { getApiErrorMessage } from '../services/api.js';
import { CancelOrderModal } from '../components/CancelOrderModal.js';
import type { Order } from '../types/order.js';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();

  const [order, setOrder] = useState<Order | null>(
    (location.state as { order?: Order } | null)?.order || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!order);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cancellation Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!order && orderId) {
      fetchOrder();
    }
  }, [order, orderId, fetchOrder]);

  const handleCancelOrder = async (reason: string) => {
    if (!order) return;
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(order.id, reason);
      setSuccessMessage('Order cancelled successfully. Inventory has been restored.');
      setIsCancelModalOpen(false);
      await fetchOrder();
    } catch (err) {
      throw err;
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="order-confirmation-container" data-testid="order-confirmation-page">
        <div className="loading-container" role="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Retrieving order confirmation details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-container" data-testid="order-confirmation-page">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Find Order</h2>
          <p>{error || 'The requested order details could not be found.'}</p>
          <Link to="/orders" className="btn btn-primary" data-testid="view-orders-btn">
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  const isCod = order.payment?.providerOrderId === 'COD';
  const addr = order.shippingAddress;
  const isCancellable = ['PLACED', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);

  return (
    <div className="order-confirmation-container" data-testid="order-confirmation-page">
      {/* Hero Success Banner */}
      <div className="confirmation-hero" data-testid="confirmation-hero">
        <div className="success-checkmark-circle" aria-hidden="true">
          ✓
        </div>
        <h1 className="confirmation-title">Thank You for Your Order!</h1>
        <p className="confirmation-subtitle">
          Your order has been received and is being processed by our fulfillment center.
        </p>

        {successMessage && (
          <div className="alert-banner alert-success mt-3 mb-2" role="status" data-testid="cancellation-success-banner">
            <span>✅ {successMessage}</span>
            <button type="button" className="alert-close-btn" onClick={() => setSuccessMessage(null)}>
              &times;
            </button>
          </div>
        )}

        <div className="order-meta-pill-bar">
          <div className="meta-pill">
            <span className="pill-label">Order Number</span>
            <strong className="pill-value font-mono" data-testid="order-number">{order.orderNumber}</strong>
          </div>
          <div className="meta-pill">
            <span className="pill-label">Order Date</span>
            <strong className="pill-value" data-testid="order-date">{formatDate(order.createdAt)}</strong>
          </div>
          <div className="meta-pill">
            <span className="pill-label">Order Status</span>
            <span className={`status-badge status-${order.status.toLowerCase()}`} data-testid="order-status">
              {order.status}
            </span>
          </div>
          <div className="meta-pill">
            <span className="pill-label">Payment Mode</span>
            <span className="pill-value" data-testid="payment-method">
              {isCod ? 'Cash on Delivery (COD)' : 'Credit / Debit Card'}
            </span>
          </div>
          <div className="meta-pill">
            <span className="pill-label">Payment Status</span>
            <span className={`payment-pill ${order.payment?.status === 'SUCCESS' ? 'pill-success' : 'pill-pending'}`} data-testid="payment-status">
              {order.payment?.status || 'PENDING'}
            </span>
          </div>
          {order.payment?.providerPaymentId && (
            <div className="meta-pill">
              <span className="pill-label">Transaction ID</span>
              <span className="pill-value font-mono" data-testid="transaction-id">
                {order.payment.providerPaymentId}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="confirmation-grid">
        {/* Left Column: Items and Shipping Details */}
        <div className="confirmation-main-column">
          {/* Items Card */}
          <div className="confirmation-card" data-testid="order-items-card">
            <h2>Purchased Items ({order.items.length})</h2>
            <div className="order-items-list" data-testid="order-items-list">
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row" data-testid="order-item">
                  <div className="item-thumbnail-container">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="item-thumbnail-img"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
                      }}
                    />
                  </div>
                  <div className="item-details-body">
                    <div className="item-brand-tag">{item.productBrand}</div>
                    <strong className="item-name-title">{item.productName}</strong>
                    <div className="item-unit-calc">
                      Qty: {item.quantity} &times; {formatPrice(item.unitPrice)}
                    </div>
                  </div>
                  <div className="item-total-col">
                    <strong className="item-total-price">{formatPrice(item.totalPrice)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address Card */}
          {addr && (
            <div className="confirmation-card" data-testid="shipping-address-card">
              <h2>Shipping Address</h2>
              <div className="address-display">
                <strong className="address-recipient-name">{addr.fullName}</strong>
                <p className="address-phone-line">📞 {addr.phone}</p>
                <p className="address-full-line">
                  {addr.addressLine1}
                  {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  <br />
                  {addr.city}, {addr.state} - <strong>{addr.postalCode}</strong>
                  <br />
                  {addr.country}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Financial Summary & Next Actions */}
        <aside className="confirmation-sidebar">
          <div className="order-summary-card" data-testid="order-summary-card">
            <h2 className="summary-title">Payment Summary</h2>

            <div className="summary-row">
              <span>Items Subtotal</span>
              <strong data-testid="order-subtotal">{formatPrice(order.subtotal)}</strong>
            </div>

            <div className="summary-row">
              <span>Shipping & Delivery</span>
              {order.shippingAmount === 0 ? (
                <span className="text-success-badge" data-testid="order-shipping">FREE</span>
              ) : (
                <span data-testid="order-shipping">{formatPrice(order.shippingAmount)}</span>
              )}
            </div>

            <div className="summary-row">
              <span>GST (18%)</span>
              <span data-testid="order-tax">{formatPrice(order.taxAmount)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-row">
              <span>Total Paid / Payable</span>
              <span className="grand-total-val" data-testid="order-total">{formatPrice(order.totalAmount)}</span>
            </div>

            <div className="confirmation-actions">
              <Link
                to={`/orders/${order.id}/tracking`}
                className="btn btn-primary btn-block"
                data-testid="track-order-btn"
              >
                Track Order Progress 📍
              </Link>
              <Link to="/orders" className="btn btn-secondary btn-block" data-testid="view-orders-btn">
                View All Orders
              </Link>
              <Link to="/products" className="btn btn-outline btn-block" data-testid="continue-shopping-btn">
                Continue Shopping
              </Link>
              {isCancellable && (
                <button
                  type="button"
                  className="btn btn-danger btn-block mt-2"
                  onClick={() => setIsCancelModalOpen(true)}
                  data-testid="cancel-order-btn"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        orderNumber={order.orderNumber}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        isSubmitting={isCancelling}
      />
    </div>
  );
};
