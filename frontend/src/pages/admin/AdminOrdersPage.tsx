import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout.js';
import { getAdminOrders, getAdminOrderById, updateAdminOrderStatus } from '../../services/adminOrderService.js';
import type { AdminOrder, AdminPagination } from '../../types/admin.js';
import { formatINR, formatDate } from '../../utils/formatters.js';
import { ORDER_STATUS_TRANSITIONS } from '../../config/constants.js';
import { getApiErrorMessage } from '../../services/api.js';

export const AdminOrdersPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');

  // Selected Order Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  const fetchOrders = async (page = pagination.page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAdminOrders({
        search,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        page,
        limit: 10,
      });
      setOrders(res.orders);
      setPagination(res.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, paymentStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1);
  };

  const openOrderDetail = async (orderId: string) => {
    try {
      setStatusUpdateError(null);
      setCancellationReason('');
      const order = await getAdminOrderById(orderId);
      setSelectedOrder(order);
      setTargetStatus(order.status);
      setIsDetailModalOpen(true);
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setIsUpdatingStatus(true);
      setStatusUpdateError(null);
      const updated = await updateAdminOrderStatus(
        selectedOrder.id,
        targetStatus,
        targetStatus === 'CANCELLED' ? cancellationReason : undefined
      );
      setSelectedOrder(updated);
      setSuccessMessage(`Order ${updated.orderNumber} status updated to ${updated.status}.`);
      fetchOrders(pagination.page);
    } catch (err) {
      setStatusUpdateError(getApiErrorMessage(err));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const availableNextStatuses = selectedOrder
    ? [selectedOrder.status, ...(ORDER_STATUS_TRANSITIONS[selectedOrder.status] || [])]
    : [];

  return (
    <AdminLayout activeSection="Customer Order Processing">
      <div className="admin-orders-page" data-testid="admin-orders-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-heading">Orders Management</h1>
            <p className="admin-subheading">Review transactions, process fulfillment lifecycles, and view order receipts.</p>
          </div>
        </div>

        {successMessage && (
          <div className="alert-success" role="status" data-testid="order-success-banner">
            <span>✅ {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="alert-close">✕</button>
          </div>
        )}

        {error && (
          <div className="alert-error" role="alert" data-testid="order-error-banner">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError(null)} className="alert-close">✕</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="admin-toolbar">
          <form onSubmit={handleSearchSubmit} className="admin-search-form">
            <input
              type="text"
              placeholder="Search by Order #, customer name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
              data-testid="search-order-input"
            />
            <button type="submit" className="btn-secondary" data-testid="search-order-btn">
              Search
            </button>
          </form>

          <div className="admin-filter-group">
            {/* Order Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
              data-testid="status-order-select"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="admin-select"
              data-testid="payment-status-select"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="SUCCESS">Success / Paid</option>
              <option value="PENDING">Pending (COD)</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="admin-card">
          <div className="admin-table-responsive">
            <table className="admin-table" data-testid="admin-orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4">Loading orders...</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4 text-muted">No orders found matching your search.</td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} data-testid={`order-row-${ord.id}`}>
                      <td>
                        <button
                          type="button"
                          className="link-button font-mono font-bold"
                          onClick={() => openOrderDetail(ord.id)}
                          data-testid={`order-number-link-${ord.id}`}
                        >
                          {ord.orderNumber}
                        </button>
                      </td>
                      <td>
                        <div className="font-bold">{ord.customer.name}</div>
                        <div className="text-muted text-xs">{ord.customer.email}</div>
                      </td>
                      <td>{formatDate(ord.createdAt)}</td>
                      <td className="font-bold">{formatINR(ord.totalAmount)}</td>
                      <td>
                        <span className="badge-payment-method">{ord.payment?.provider || 'COD'}</span>
                      </td>
                      <td>
                        <span className={`status-pill status-${(ord.payment?.status || 'PENDING').toLowerCase()}`}>
                          {ord.payment?.status || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${ord.status.toLowerCase()}`} data-testid={`order-status-badge-${ord.id}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="btn-action-primary btn-sm"
                            onClick={() => openOrderDetail(ord.id)}
                            data-testid={`view-order-btn-${ord.id}`}
                          >
                            View / Process
                          </button>
                          <Link
                            to={`/admin/orders/${ord.id}`}
                            className="btn-action-view btn-sm"
                            data-testid={`full-detail-link-${ord.id}`}
                          >
                            Details &rarr;
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="admin-pagination" data-testid="admin-orders-pagination">
              <button
                type="button"
                className="btn-pagination"
                disabled={!pagination.hasPreviousPage}
                onClick={() => fetchOrders(pagination.page - 1)}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
              </span>
              <button
                type="button"
                className="btn-pagination"
                disabled={!pagination.hasNextPage}
                onClick={() => fetchOrders(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {isDetailModalOpen && selectedOrder && (
          <div className="modal-backdrop" data-testid="order-details-modal">
            <div className="modal-card modal-card-lg">
              <div className="modal-header">
                <div>
                  <h2>Order Receipt: {selectedOrder.orderNumber}</h2>
                  <span className="text-xs text-muted">Placed on {formatDate(selectedOrder.createdAt)}</span>
                </div>
                <button type="button" className="modal-close" onClick={() => setIsDetailModalOpen(false)}>✕</button>
              </div>

              {/* Status Update Form */}
              <div className="order-status-manager-box mb-4">
                <form onSubmit={handleStatusUpdate} className="flex-row-wrap items-center gap-3">
                  <div className="font-bold text-sm">Order Lifecycle Status:</div>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="admin-select"
                    data-testid="select-order-status"
                  >
                    {availableNextStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  {targetStatus === 'CANCELLED' && selectedOrder.status !== 'CANCELLED' && (
                    <input
                      type="text"
                      placeholder="Cancellation reason..."
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="admin-input"
                      data-testid="admin-modal-cancel-reason"
                    />
                  )}

                  <button
                    type="submit"
                    className="btn-primary btn-sm"
                    disabled={isUpdatingStatus || targetStatus === selectedOrder.status}
                    data-testid="update-status-submit-btn"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </form>
                {statusUpdateError && (
                  <div className="alert-error mt-2" data-testid="status-update-error">
                    ⚠️ {statusUpdateError}
                  </div>
                )}
              </div>

              {/* Cancelled Notice */}
              {selectedOrder.status === 'CANCELLED' && (
                <div className="alert-error mb-4" data-testid="modal-cancelled-banner">
                  <strong>🚫 Order is Cancelled</strong>
                  {selectedOrder.cancelledAt && <div>Cancelled at: {formatDate(selectedOrder.cancelledAt)}</div>}
                  {selectedOrder.cancellationReason && <div>Reason: "{selectedOrder.cancellationReason}"</div>}
                </div>
              )}

              {/* Milestone Timeline */}
              {selectedOrder.tracking && (
                <div className="admin-card mb-4" data-testid="modal-timeline-box">
                  <h3 className="section-title mb-2">Milestone Progress</h3>
                  <div className="flex-row-wrap gap-3">
                    {selectedOrder.tracking.timeline.map((step) => (
                      <div key={step.status} className="meta-box p-2 flex-1" data-testid={`modal-timeline-${step.status.toLowerCase()}`}>
                        <div className="text-xs font-bold text-muted">{step.title}</div>
                        <div className="text-xs font-bold mt-1">
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

              {/* Order Info Columns */}
              <div className="admin-two-col-grid mb-4">
                {/* Customer & Shipping */}
                <div className="admin-receipt-box">
                  <h3 className="section-title">👤 Customer & Delivery</h3>
                  <p><strong>Name:</strong> {selectedOrder.customer.name}</p>
                  <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                  {selectedOrder.customer.phone && <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>}
                  {selectedOrder.shippingAddress ? (
                    <div className="mt-2 text-sm text-muted">
                      <strong>Delivery Address:</strong><br />
                      {selectedOrder.shippingAddress.fullName} ({selectedOrder.shippingAddress.phone})<br />
                      {selectedOrder.shippingAddress.addressLine1}<br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}<br />
                      {selectedOrder.shippingAddress.country}
                    </div>
                  ) : (
                    <p className="text-muted text-sm mt-2">No address snapshot attached.</p>
                  )}
                </div>

                {/* Payment Breakdown */}
                <div className="admin-receipt-box">
                  <h3 className="section-title">💳 Payment Details</h3>
                  <p><strong>Method:</strong> {selectedOrder.payment?.provider || 'COD'}</p>
                  <p><strong>Payment Status:</strong> <span className={`status-pill status-${(selectedOrder.payment?.status || 'PENDING').toLowerCase()}`}>{selectedOrder.payment?.status || 'PENDING'}</span></p>
                  {selectedOrder.payment?.providerOrderId && <p><strong>Ref / Trx ID:</strong> <span className="font-mono text-xs">{selectedOrder.payment.providerOrderId}</span></p>}
                  <hr className="my-2" />
                  <div className="price-breakdown-rows text-sm">
                    <div className="flex-between"><span>Subtotal:</span><span>{formatINR(selectedOrder.subtotal)}</span></div>
                    <div className="flex-between"><span>Shipping Fee:</span><span>{selectedOrder.shippingAmount === 0 ? 'FREE' : formatINR(selectedOrder.shippingAmount)}</span></div>
                    <div className="flex-between"><span>GST (18%):</span><span>{formatINR(selectedOrder.taxAmount)}</span></div>
                    <div className="flex-between font-bold text-base mt-1"><span>Grand Total:</span><span>{formatINR(selectedOrder.totalAmount)}</span></div>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <h3 className="section-title">📱 Order Item Snapshots</h3>
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
                    {selectedOrder.items.map((item) => (
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

              <div className="modal-actions mt-4 flex-between">
                <Link to={`/admin/orders/${selectedOrder.id}`} className="btn-secondary btn-sm" data-testid="open-full-page-btn">
                  Open Dedicated Page &rarr;
                </Link>
                <button type="button" className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
