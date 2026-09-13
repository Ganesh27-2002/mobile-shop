import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout.js';
import { getAdminOrderById, updateAdminOrderStatus } from '../../services/adminOrderService.js';
import type { AdminOrder } from '../../types/admin.js';
import { formatINR, formatDate } from '../../utils/formatters.js';
import { ORDER_STATUS_TRANSITIONS } from '../../config/constants.js';
import { getApiErrorMessage } from '../../services/api.js';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status Update state
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAdminOrderById(id);
      setOrder(data);
      setTargetStatus(data.status);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setIsUpdatingStatus(true);
      setStatusUpdateError(null);
      const updated = await updateAdminOrderStatus(
        order.id,
        targetStatus,
        targetStatus === 'CANCELLED' ? cancellationReason : undefined
      );
      setOrder(updated);
      setSuccessMessage(`Order ${updated.orderNumber} status updated to ${updated.status}.`);
    } catch (err) {
      setStatusUpdateError(getApiErrorMessage(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout activeSection="Customer Order Processing">
        <div className="admin-loading-container" role="status">
          <div className="spinner" aria-hidden="true"></div>
          <p>Loading order details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout activeSection="Customer Order Processing">
        <div className="alert-error" data-testid="admin-order-error">
          <span>⚠️ {error || 'Order not found.'}</span>
        </div>
        <div className="mt-4">
          <Link to="/admin/orders" className="btn-secondary">
            &larr; Back to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const availableNextStatuses = [
    order.status,
    ...(ORDER_STATUS_TRANSITIONS[order.status] || []),
  ];

  return (
    <AdminLayout activeSection="Customer Order Processing">
      <div className="admin-order-detail-page" data-testid="admin-order-detail-page">
        <div className="admin-page-header flex-between mb-4">
          <div>
            <div className="breadcrumbs text-xs text-muted mb-1">
              <Link to="/admin/orders">Orders</Link> &gt; <span>{order.orderNumber}</span>
            </div>
            <h1 className="admin-heading">Order: {order.orderNumber}</h1>
            <span className="text-xs text-muted">Placed on {formatDate(order.createdAt)}</span>
          </div>
          <Link to="/admin/orders" className="btn-secondary" data-testid="back-to-admin-orders-btn">
            &larr; Back to Orders
          </Link>
        </div>

        {successMessage && (
          <div className="alert-success mb-4" role="status" data-testid="admin-order-success-banner">
            <span>✅ {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="alert-close">✕</button>
          </div>
        )}

        {/* Status Lifecycle Transition Manager */}
        <div className="admin-card mb-4" data-testid="status-manager-card">
          <h2 className="section-title mb-2">Order Lifecycle Management</h2>
          <form onSubmit={handleStatusUpdate} className="flex-row-wrap items-center gap-3">
            <span className="text-sm font-bold">Transition State:</span>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="admin-select"
              data-testid="admin-select-order-status"
            >
              {availableNextStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {targetStatus === 'CANCELLED' && order.status !== 'CANCELLED' && (
              <input
                type="text"
                placeholder="Reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="admin-input"
                data-testid="admin-cancel-reason-input"
              />
            )}

            <button
              type="submit"
              className="btn-primary btn-sm"
              disabled={isUpdatingStatus || targetStatus === order.status}
              data-testid="admin-update-status-btn"
            >
              {isUpdatingStatus ? 'Updating...' : 'Update Status'}
            </button>
          </form>

          {statusUpdateError && (
            <div className="alert-error mt-2" data-testid="admin-status-update-error">
              ⚠️ {statusUpdateError}
            </div>
          )}
        </div>

        {/* Cancelled Notice */}
        {order.status === 'CANCELLED' && (
          <div className="alert-error mb-4" data-testid="admin-cancelled-banner">
            <strong>🚫 Order Cancelled</strong>
            {order.cancelledAt && <div>Cancelled at: {formatDate(order.cancelledAt)}</div>}
            {order.cancellationReason && <div>Reason: "{order.cancellationReason}"</div>}
          </div>
        )}

        {/* Milestone Timeline */}
        {order.tracking && (
          <div className="admin-card mb-4" data-testid="admin-timeline-card">
            <h2 className="section-title mb-3">Milestone Progress</h2>
            <div className="flex-row-wrap gap-4">
              {order.tracking.timeline.map((step) => (
                <div key={step.status} className="meta-box p-2" data-testid={`admin-timeline-${step.status.toLowerCase()}`}>
                  <div className="text-xs font-bold text-muted">{step.title}</div>
                  <div className="text-sm font-bold mt-1">
                    {step.completed ? (
                      <span className="text-success">✓ Completed</span>
                    ) : (
                      <span className="text-muted">○ Pending</span>
                    )}
                  </div>
                  {step.timestamp && (
                    <div className="text-xs text-muted mt-1">{formatDate(step.timestamp)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer, Shipping and Payment Grid */}
        <div className="admin-two-col-grid mb-4">
          <div className="admin-receipt-box">
            <h3 className="section-title">👤 Customer & Delivery</h3>
            <p><strong>Name:</strong> {order.customer.name}</p>
            <p><strong>Email:</strong> {order.customer.email}</p>
            {order.customer.phone && <p><strong>Phone:</strong> {order.customer.phone}</p>}
            {order.shippingAddress ? (
              <div className="mt-2 text-sm text-muted">
                <strong>Delivery Address:</strong><br />
                {order.shippingAddress.fullName} ({order.shippingAddress.phone})<br />
                {order.shippingAddress.addressLine1}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </div>
            ) : (
              <p className="text-muted text-sm mt-2">No address snapshot attached.</p>
            )}
          </div>

          <div className="admin-receipt-box">
            <h3 className="section-title">💳 Payment & Accounting</h3>
            <p><strong>Method:</strong> {order.payment?.provider || 'COD'}</p>
            <p><strong>Payment Status:</strong> <span className={`status-pill status-${(order.payment?.status || 'PENDING').toLowerCase()}`}>{order.payment?.status || 'PENDING'}</span></p>
            {order.payment?.providerOrderId && <p><strong>Ref ID:</strong> <span className="font-mono text-xs">{order.payment.providerOrderId}</span></p>}
            <hr className="my-2" />
            <div className="price-breakdown-rows text-sm">
              <div className="flex-between"><span>Subtotal:</span><span>{formatINR(order.subtotal)}</span></div>
              <div className="flex-between"><span>Shipping Fee:</span><span>{order.shippingAmount === 0 ? 'FREE' : formatINR(order.shippingAmount)}</span></div>
              <div className="flex-between"><span>GST (18%):</span><span>{formatINR(order.taxAmount)}</span></div>
              <div className="flex-between font-bold text-base mt-1"><span>Grand Total:</span><span>{formatINR(order.totalAmount)}</span></div>
            </div>
          </div>
        </div>

        {/* Order Item Snapshots */}
        <div className="admin-card">
          <h2 className="section-title mb-3">📱 Purchased Items ({order.items.length})</h2>
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img src={item.productImage} alt={item.productName} className="admin-table-thumbnail" />
                    </td>
                    <td>
                      <div className="font-bold">{item.productName}</div>
                      <div className="text-muted text-xs">{item.productBrand}</div>
                    </td>
                    <td>{formatINR(item.unitPrice)}</td>
                    <td>{item.quantity}</td>
                    <td className="font-bold">{formatINR(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
