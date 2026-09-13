import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { getApiErrorMessage } from '../services/api.js';
import { CancelOrderModal } from '../components/CancelOrderModal.js';
import type { Order } from '../types/order.js';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cancellation Modal state
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openCancelModal = (order: Order) => {
    setSelectedOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!selectedOrderToCancel) return;
    try {
      setIsCancelling(true);
      await orderService.cancelOrder(selectedOrderToCancel.id, reason);
      setSuccessMessage(`Order ${selectedOrderToCancel.orderNumber} cancelled successfully. Inventory has been restored.`);
      setIsCancelModalOpen(false);
      setSelectedOrderToCancel(null);
      await fetchOrders();
    } catch (err) {
      throw err;
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="orders-container" data-testid="orders-page">
        <div className="loading-container" role="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading your order history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-container" data-testid="orders-page">
      <div className="orders-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-subtitle">Track fulfillment progress, view receipts, and manage order lifecycles.</p>
        </div>
        <Link to="/products" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>

      {successMessage && (
        <div className="alert-banner alert-success mb-4" role="status" data-testid="orders-success-banner">
          <span>✅ {successMessage}</span>
          <button type="button" className="alert-close-btn" onClick={() => setSuccessMessage(null)}>
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error" role="alert" data-testid="orders-error-banner">
          <span>⚠️ {error}</span>
          <button type="button" className="alert-close-btn" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="empty-orders-card" data-testid="empty-orders-state">
          <div className="empty-icon" aria-hidden="true">📦</div>
          <h2>No Orders Placed Yet</h2>
          <p>You haven't placed any smartphone orders. Browse our latest flagship collection now!</p>
          <Link to="/products" className="btn btn-primary btn-large" data-testid="shop-now-btn">
            Explore Smartphones
          </Link>
        </div>
      ) : (
        <div className="orders-list" data-testid="orders-list">
          {orders.map((order) => {
            const isCod = order.payment?.providerOrderId === 'COD';
            const isCancellable = ['PLACED', 'PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status);

            return (
              <div key={order.id} className="order-history-card" data-testid="order-card">
                <div className="order-card-header">
                  <div className="order-header-left">
                    <div className="order-number-group">
                      <span className="label">Order Number:</span>
                      <strong className="order-number-text" data-testid="order-number">{order.orderNumber}</strong>
                    </div>
                    <div className="order-date-text" data-testid="order-date">
                      Placed on {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="order-header-right">
                    <span
                      className={`status-badge status-${order.status.toLowerCase()}`}
                      data-testid="order-status"
                    >
                      {order.status}
                    </span>
                    <div className="order-total-group">
                      <span className="label">Total:</span>
                      <strong className="order-total-amount" data-testid="order-total">
                        {formatPrice(order.totalAmount)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-card-items">
                    {order.items.map((item) => (
                      <div key={item.id} className="order-item-mini-row" data-testid="order-item">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="item-mini-thumb"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>';
                          }}
                        />
                        <div className="item-mini-info">
                          <strong className="item-mini-name">{item.productName}</strong>
                          <span className="item-mini-qty">
                            Qty: {item.quantity} &times; {formatPrice(item.unitPrice)}
                          </span>
                        </div>
                        <div className="item-mini-total">{formatPrice(item.totalPrice)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-meta-sidebar">
                    <div className="meta-box">
                      <span className="meta-box-label">Delivery Address</span>
                      {order.shippingAddress ? (
                        <p className="meta-box-val">
                          <strong>{order.shippingAddress.fullName}</strong>
                          <br />
                          {order.shippingAddress.city}, {order.shippingAddress.state}
                        </p>
                      ) : (
                        <p className="meta-box-val text-muted">Standard Address</p>
                      )}
                    </div>

                    <div className="meta-box">
                      <span className="meta-box-label">Payment Mode</span>
                      <p className="meta-box-val">
                        {isCod ? 'Cash on Delivery (COD)' : 'Credit / Debit Card'}
                        <br />
                        <span className={`payment-pill ${order.payment?.status === 'SUCCESS' ? 'pill-success' : 'pill-pending'}`}>
                          {order.payment?.status || 'PENDING'}
                        </span>
                      </p>
                    </div>

                    <div className="order-card-actions">
                      <Link
                        to={`/orders/${order.id}/tracking`}
                        className="btn btn-sm btn-primary"
                        data-testid="track-order-btn"
                      >
                        Track Order 📍
                      </Link>
                      <Link
                        to={`/order-confirmation/${order.id}`}
                        className="btn btn-sm btn-outline"
                        data-testid="view-order-details-btn"
                      >
                        View Receipt &rarr;
                      </Link>
                      {isCancellable && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => openCancelModal(order)}
                          data-testid="cancel-order-btn"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Order Modal */}
      {selectedOrderToCancel && (
        <CancelOrderModal
          isOpen={isCancelModalOpen}
          orderNumber={selectedOrderToCancel.orderNumber}
          onClose={() => {
            setIsCancelModalOpen(false);
            setSelectedOrderToCancel(null);
          }}
          onConfirm={handleConfirmCancel}
          isSubmitting={isCancelling}
        />
      )}
    </div>
  );
};
