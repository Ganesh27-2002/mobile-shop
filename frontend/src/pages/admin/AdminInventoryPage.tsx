import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout.js';
import { getAdminInventory } from '../../services/adminInventoryService.js';
import { updateAdminProductStock } from '../../services/adminProductService.js';
import type { AdminInventoryItem, AdminPagination } from '../../types/admin.js';
import { formatDate } from '../../utils/formatters.js';
import { getApiErrorMessage } from '../../services/api.js';

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = useState<AdminInventoryItem[]>([]);
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
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Stock update modal
  const [selectedItem, setSelectedItem] = useState<AdminInventoryItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchInventory = async (page = pagination.page) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getAdminInventory({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory(1);
  };

  const openStockModal = (item: AdminInventoryItem) => {
    setSelectedItem(item);
    setNewStock(item.currentStock);
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setIsSubmitting(true);
      const res = await updateAdminProductStock(selectedItem.id, newStock);
      setSuccessMessage(
        `Updated stock for "${selectedItem.name}" from ${res.previousStock} to ${res.newStock} (Diff: ${res.stockDifference >= 0 ? '+' : ''}${res.stockDifference}).`
      );
      setSelectedItem(null);
      fetchInventory(pagination.page);
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout activeSection="Inventory Control & Stock Levels">
      <div className="admin-inventory-page" data-testid="admin-inventory-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-heading">Live Inventory Management</h1>
            <p className="admin-subheading">Track stock depletion, monitor safety thresholds, and replenish quantities.</p>
          </div>
        </div>

        {successMessage && (
          <div className="alert-success" role="status" data-testid="inventory-success-banner">
            <span>✅ {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="alert-close">✕</button>
          </div>
        )}

        {error && (
          <div className="alert-error" role="alert" data-testid="inventory-error-banner">
            <span>⚠️ {error}</span>
            <button type="button" onClick={() => setError(null)} className="alert-close">✕</button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="admin-toolbar">
          <form onSubmit={handleSearchSubmit} className="admin-search-form">
            <input
              type="text"
              placeholder="Search product or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
              data-testid="search-inventory-input"
            />
            <button type="submit" className="btn-secondary" data-testid="search-inventory-btn">
              Search
            </button>
          </form>

          <div className="admin-filters-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select"
              data-testid="status-inventory-select"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock (Normal)</option>
              <option value="LOW_STOCK">Low Stock (≤ 5 units)</option>
              <option value="OUT_OF_STOCK">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="admin-card">
          {isLoading && items.length === 0 ? (
            <div className="loading-container" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <p>Loading inventory data...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="admin-empty-state" data-testid="empty-inventory-state">
              <p>No inventory items found matching filters.</p>
            </div>
          ) : (
            <div className="admin-table-responsive">
              <table className="admin-table" data-testid="admin-inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Model / SKU</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Stock Status</th>
                    <th>Last Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} data-testid={`inventory-row-${item.id}`}>
                      <td>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-muted text-xs">{item.brand}</div>
                      </td>
                      <td className="font-mono text-sm">{item.model}</td>
                      <td>{item.category?.name || 'Uncategorized'}</td>
                      <td className="font-bold text-lg">{item.currentStock}</td>
                      <td className="text-muted">{item.lowStockThreshold} units</td>
                      <td>
                        <span
                          className={`status-pill ${
                            (item.status as string) === 'OUT_OF_STOCK' || (item.status as string) === 'OUT OF STOCK'
                              ? 'status-cancelled'
                              : (item.status as string) === 'LOW_STOCK' || (item.status as string) === 'LOW STOCK'
                              ? 'status-pending'
                              : 'status-confirmed'
                          }`}
                          data-testid={`stock-status-${item.id}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>{formatDate(item.lastUpdated)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => openStockModal(item)}
                          data-testid={`update-stock-btn-${item.id}`}
                        >
                          📦 Adjust Stock
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
                onClick={() => fetchInventory(pagination.page - 1)}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total items)
              </span>
              <button
                type="button"
                className="btn-pagination"
                disabled={!pagination.hasNextPage}
                onClick={() => fetchInventory(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Stock Update Modal */}
        {selectedItem && (
          <div className="modal-backdrop" data-testid="inventory-modal">
            <div className="modal-card modal-card-sm">
              <div className="modal-header">
                <h2>Adjust Inventory Stock</h2>
                <button type="button" className="modal-close" onClick={() => setSelectedItem(null)}>✕</button>
              </div>
              <form onSubmit={handleStockUpdate}>
                <div className="product-summary-box mb-4">
                  <div className="font-bold">{selectedItem.name}</div>
                  <div className="text-muted text-sm">{selectedItem.brand} • {selectedItem.model}</div>
                  <div className="mt-2 text-sm">
                    Current Units: <strong>{selectedItem.currentStock}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="inv-stock-input">New Stock Quantity *</label>
                  <input
                    id="inv-stock-input"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
                    data-testid="input-inventory-stock"
                  />
                  <span className="text-xs text-muted">
                    Setting stock $\le 5$ triggers Low Stock alert; setting to 0 marks Out of Stock.
                  </span>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setSelectedItem(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                    data-testid="save-inventory-stock-btn"
                  >
                    {isSubmitting ? 'Updating...' : 'Save Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
