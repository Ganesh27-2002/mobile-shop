import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { orderService } from '../services/orderService.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { getApiErrorMessage } from '../services/api.js';
import type { Order } from '../types/order.js';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();

  const [order, setOrder] = useState<Order | null>(
    (location.state as { order?: Order } | null)?.order || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!order);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order && orderId) {
      const fetchOrder = async () => {
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
      };

      fetchOrder();
    }
  }, [order, orderId]);

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

  const addr = order.shippingAddress;
  const payment = order.payment;
  const isCod = payment?.providerOrderId === 'COD';

  return (
    <div className="order-confirmation-container" data-testid="order-confirmation-page">
      {/* Celebration Banner */}
      <div className="confirmation-hero" data-testid="confirmation-hero">
        <div className="success-checkmark-circle" aria-hidden="true">✓</div>
        <h1 className="confirmation-title">Thank You for Your Order!</h1>
        <p className="confirmation-subtitle">
          Your order has been received and confirmed. A dispatch notification will be sent shortly.
        </p>
        <div className="order-number-banner">
          <span>Order Reference:</span>
          <strong className="order-number-val" data-testid="order-number">{order.orderNumber}</strong>
        </div>
      </div>

      <div className="confirmation-grid">
        {/* Left Column: Order Items & Delivery Details */}
        <div className="confirmation-main">
          {/* Order Status & Metadata Card */}
          <div className="confirmation-card" data-testid="order-meta-card">
            <div className="card-header-row">
              <h2>Order Details</h2>
              <span className={`status-badge status-${order.status.toLowerCase()}`} data-testid="order-status">
                {order.status}
              </span>
            </div>
            <div className="meta-grid">
              <div className="meta-item">
                <span className="meta-label">Order Date</span>
                <strong className="meta-value" data-testid="order-date">{formatDate(order.createdAt)}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Payment Mode</span>
                <strong className="meta-value" data-testid="order-payment-method">
                  {isCod ? 'Cash on Delivery (COD)' : 'Credit / Debit Card'}
                </strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Payment Status</span>
                <strong
                  className={`meta-value ${payment?.status === 'SUCCESS' ? 'text-success' : 'text-warning'}`}
                  data-testid="payment-status"
                >
                  {payment?.status || 'PENDING'}
                </strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Transaction ID</span>
                <strong className="meta-value mono-text" data-testid="transaction-id">
                  {payment?.providerPaymentId || 'N/A'}
                </strong>
              </div>
            </div>
          </div>

          {/* Ordered Products Itemized List */}
          <div className="confirmation-card" data-testid="order-items-card">
            <h2>Ordered Items ({order.items.length})</h2>
            <div className="order-items-list" data-testid="order-items-list">
              {order.items.map((item) => (
                <div key={item.id} className="order-item-row" data-testid="order-item">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="order-item-thumb"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/products/iphone-15-pro-max.png';
                    }}
                  />
                  <div className="order-item-info">
                    <div className="order-item-brand">{item.productBrand}</div>
                    <div className="order-item-title">{item.productName}</div>
                    <div className="order-item-price-qty">
                      {formatPrice(item.unitPrice)} &times; {item.quantity}
                    </div>
                  </div>
                  <div className="order-item-total" data-testid="order-item-total">
                    {formatPrice(item.totalPrice)}
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
              <Link to="/orders" className="btn btn-primary btn-block" data-testid="view-orders-btn">
                View All Orders
              </Link>
              <Link to="/products" className="btn btn-outline btn-block" data-testid="continue-shopping-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
