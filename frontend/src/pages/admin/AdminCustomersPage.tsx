import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.js';
import { getAdminCustomers, getAdminCustomerById } from '../../services/adminCustomerService.js';
import type { AdminCustomer, AdminCustomerDetail, AdminPagination } from '../../types/admin.js';
import { formatINR, formatDate } from '../../utils/formatters.js';
import { getApiErrorMessage } from '../../services/api.js';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
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

  // Search
  const [search, setSearch] = useState<string>('');

  // Selected Customer Modal
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  const fetchCustomers = async (page = pagination.page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAdminCustomers({
        search,
        page,
        limit: 10,
      });
      setCustomers(res.customers);
      setPagination(res.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const openCustomerDetail = async (customerId: string) => {
    try {
      setIsLoadingDetail(true);
      setIsDetailModalOpen(true);
      const detail = await getAdminCustomerById(customerId);
      setSelectedCustomer(detail);
    } catch (err) {
      alert(getApiErrorMessage(err));
      setIsDetailModalOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <AdminLayout activeSection="Customer Accounts & Lifetime Value">
      <div className="admin-customers-page" data-testid="admin-customers-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-heading">Registered Customers</h1>
            <p className="admin-subheading">View user accounts, aggregate lifetime spend, and purchase records.</p>
          </div>
        </div>

        {error && (
          <div className="alert-error" role="alert" data-testid="customers-error-banner">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError(null)} className="alert-close">✕</button>
          </div>
        )}

        {/* Toolbar */}
        <div className="admin-toolbar">
          <form onSubmit={handleSearchSubmit} className="admin-search-form">
            <input
              type="text"
              placeholder="Search customer by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
              data-testid="search-customer-input"
            />
            <button type="submit" className="btn-secondary" data-testid="search-customer-btn">
              Search
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="admin-card">
          {isLoading && customers.length === 0 ? (
            <div className="loading-container" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <p>Loading customer list...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="admin-empty-state" data-testid="no-customers-state">
              <p>No customers found.</p>
            </div>
          ) : (
            <div className="admin-table-responsive">
              <table className="admin-table" data-testid="admin-customers-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Orders</th>
                    <th>Lifetime Spent</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} data-testid={`customer-row-${c.id}`}>
                      <td>
                        <div className="font-bold">{c.fullName}</div>
                      </td>
                      <td className="font-mono text-sm">{c.email}</td>
                      <td>{c.phone || '—'}</td>
                      <td>
                        <span className="badge-info">{c.orderCount} orders</span>
                      </td>
                      <td className="font-bold text-success" data-testid={`customer-spent-${c.id}`}>
                        {formatINR(c.totalSpent)}
                      </td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => openCustomerDetail(c.id)}
                          data-testid={`view-customer-btn-${c.id}`}
                        >
                          👤 View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                type="button"
                className="btn-pagination"
                disabled={!pagination.hasPreviousPage}
                onClick={() => fetchCustomers(pagination.page - 1)}
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
                onClick={() => fetchCustomers(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Customer Detail Modal */}
        {isDetailModalOpen && (
          <div className="modal-backdrop" data-testid="customer-detail-modal">
            <div className="modal-card modal-card-lg">
              <div className="modal-header">
                <h2>Customer Profile: {selectedCustomer?.fullName || 'Loading...'}</h2>
                <button type="button" className="modal-close" onClick={() => setIsDetailModalOpen(false)}>✕</button>
              </div>

              {isLoadingDetail || !selectedCustomer ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Fetching customer records...</p>
                </div>
              ) : (
                <div className="customer-modal-body">
                  <div className="admin-two-col-grid mb-4">
                    {/* Basic Info */}
                    <div className="admin-receipt-box">
                      <h3 className="section-title">👤 Account Overview</h3>
                      <p><strong>Full Name:</strong> {selectedCustomer.fullName}</p>
                      <p><strong>Email:</strong> {selectedCustomer.email}</p>
                      <p><strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}</p>
                      <p><strong>Joined Date:</strong> {formatDate(selectedCustomer.createdAt)}</p>
                      <p><strong>Lifetime Spend:</strong> <span className="font-bold text-success">{formatINR(selectedCustomer.totalSpent)}</span></p>
                      <p><strong>Total Orders Placed:</strong> {selectedCustomer.orderCount}</p>
                    </div>

                    {/* Saved Addresses */}
                    <div className="admin-receipt-box">
                      <h3 className="section-title">📍 Saved Addresses</h3>
                      {selectedCustomer.addresses.length === 0 ? (
                        <p className="text-muted text-sm">No saved delivery addresses.</p>
                      ) : (
                        <div className="customer-addresses-list">
                          {selectedCustomer.addresses.map((addr) => (
                            <div key={addr.id} className="customer-address-item text-xs mb-2">
                              <strong>{addr.fullName}</strong> {addr.isDefault && <span className="badge-default">Default</span>}<br />
                              {addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Orders History */}
                  <h3 className="section-title">🛍️ Order History ({selectedCustomer.orders.length})</h3>
                  {selectedCustomer.orders.length === 0 ? (
                    <div className="admin-empty-state">
                      <p>Customer has not placed any orders yet.</p>
                    </div>
                  ) : (
                    <div className="admin-table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomer.orders.map((o) => (
                            <tr key={o.id}>
                              <td className="font-mono font-bold">{o.orderNumber}</td>
                              <td>{formatDate(o.createdAt)}</td>
                              <td>{o.itemCount} items</td>
                              <td className="font-bold">{formatINR(o.totalAmount)}</td>
                              <td>
                                <span className={`status-pill status-${o.paymentStatus.toLowerCase()}`}>
                                  {o.paymentStatus}
                                </span>
                              </td>
                              <td>
                                <span className={`status-pill status-${o.status.toLowerCase()}`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="modal-actions mt-4">
                    <button type="button" className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
