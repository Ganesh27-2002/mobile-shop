import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout.js';
import { getAdminDashboardStats } from '../../services/adminDashboardService.js';
import type { DashboardStats } from '../../types/admin.js';
import { formatINR, formatDate } from '../../utils/formatters.js';
import { getApiErrorMessage } from '../../services/api.js';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <AdminLayout activeSection="Dashboard Overview">
      <div className="admin-dashboard-page" data-testid="admin-dashboard">
        {/* Header with Refresh */}
        <div className="admin-page-header">
          <div>
            <h1 className="admin-heading">Store Analytics & Overview</h1>
            <p className="admin-subheading">Live system metrics, catalog health, order streams, and customer metrics.</p>
          </div>
          <button
            type="button"
            className="btn-refresh"
            onClick={fetchStats}
            disabled={isLoading}
            data-testid="refresh-stats-btn"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>

        {error && (
          <div className="alert-error" role="alert" data-testid="dashboard-error">
            <span>⚠️ {error}</span>
            <button type="button" onClick={fetchStats} className="btn-retry">Retry</button>
          </div>
        )}

        {isLoading && !stats ? (
          <div className="loading-container" role="status" aria-live="polite">
            <div className="spinner" aria-hidden="true"></div>
            <p>Loading real-time store metrics...</p>
          </div>
        ) : stats ? (
          <>
            {/* KPI Summary Cards Grid */}
            <div className="admin-stats-grid" data-testid="admin-stats-grid">
              {/* Card 1: Products */}
              <div className="stat-card" data-testid="stat-products">
                <div className="stat-card-header">
                  <span className="stat-card-title">Total Products</span>
                  <span className="stat-icon">📱</span>
                </div>
                <div className="stat-card-value">{stats.products.total}</div>
                <div className="stat-breakdown">
                  <span className="badge-success">{stats.products.active} Active</span>
                  <span className="badge-warning">{stats.products.lowStock} Low Stock</span>
                  {stats.products.outOfStock > 0 && (
                    <span className="badge-danger">{stats.products.outOfStock} Out of Stock</span>
                  )}
                </div>
              </div>

              {/* Card 2: Orders */}
              <div className="stat-card" data-testid="stat-orders">
                <div className="stat-card-header">
                  <span className="stat-card-title">Total Orders</span>
                  <span className="stat-icon">🛍️</span>
                </div>
                <div className="stat-card-value">{stats.orders.total}</div>
                <div className="stat-breakdown">
                  <span className="badge-info">{stats.orders.completed} Confirmed/Shipped</span>
                  {stats.orders.pending > 0 && (
                    <span className="badge-warning">{stats.orders.pending} Pending</span>
                  )}
                  {stats.orders.cancelled > 0 && (
                    <span className="badge-danger">{stats.orders.cancelled} Cancelled</span>
                  )}
                </div>
              </div>

              {/* Card 3: Customers */}
              <div className="stat-card" data-testid="stat-customers">
                <div className="stat-card-header">
                  <span className="stat-card-title">Total Customers</span>
                  <span className="stat-icon">👥</span>
                </div>
                <div className="stat-card-value">{stats.customers.total}</div>
                <div className="stat-breakdown">
                  <span className="stat-subtext">Registered shopping accounts</span>
                </div>
              </div>

              {/* Card 4: Revenue */}
              <div className="stat-card revenue-card" data-testid="stat-revenue">
                <div className="stat-card-header">
                  <span className="stat-card-title">Total Revenue</span>
                  <span className="stat-icon">💰</span>
                </div>
                <div className="stat-card-value">{formatINR(stats.revenue.total)}</div>
                <div className="stat-breakdown">
                  <span className="stat-subtext">From valid, non-cancelled orders</span>
                </div>
              </div>
            </div>

            {/* Middle Grid: Recent Orders & Low Stock */}
            <div className="admin-two-col-grid">
              {/* Recent Orders Section */}
              <div className="admin-card" data-testid="recent-orders-section">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Recent Orders</h2>
                  <Link to="/admin/orders" className="admin-card-link">
                    View All Orders →
                  </Link>
                </div>

                {stats.recentOrders.length === 0 ? (
                  <div className="admin-empty-state">
                    <p>No orders placed yet.</p>
                  </div>
                ) : (
                  <div className="admin-table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td className="font-mono">
                              <Link to={`/admin/orders?search=${encodeURIComponent(order.orderNumber)}`} className="table-link">
                                {order.orderNumber}
                              </Link>
                            </td>
                            <td>
                              <div className="customer-cell-name">{order.customer.name}</div>
                              <div className="customer-cell-email">{order.customer.email}</div>
                            </td>
                            <td>{formatDate(order.date)}</td>
                            <td className="font-bold">{formatINR(order.amount)}</td>
                            <td>
                              <span className={`status-pill status-${order.orderStatus.toLowerCase()}`}>
                                {order.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Low Stock Alerts Section */}
              <div className="admin-card" data-testid="low-stock-section">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Inventory Alerts</h2>
                  <Link to="/admin/inventory" className="admin-card-link">
                    Manage Inventory →
                  </Link>
                </div>

                {stats.lowStockProducts.length === 0 ? (
                  <div className="admin-empty-state text-success">
                    <p>✅ All products have healthy inventory levels!</p>
                  </div>
                ) : (
                  <div className="admin-table-responsive">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.lowStockProducts.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="product-cell-name">{p.name}</div>
                              <div className="product-cell-brand">{p.brand} • {p.model}</div>
                            </td>
                            <td>{p.category}</td>
                            <td className="font-bold">{p.currentStock}</td>
                            <td>
                              <span className={`status-pill ${p.status === 'OUT OF STOCK' ? 'status-cancelled' : 'status-pending'}`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Top Selling Products */}
            {stats.topProducts && stats.topProducts.length > 0 && (
              <div className="admin-card" data-testid="top-products-section">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Top Selling Smartphones</h2>
                </div>
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Brand</th>
                        <th>Units Sold</th>
                        <th>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topProducts.map((prod, idx) => (
                        <tr key={idx}>
                          <td className="font-bold">{prod.name}</td>
                          <td>{prod.brand}</td>
                          <td>{prod.unitsSold} units</td>
                          <td className="font-bold text-success">{formatINR(prod.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};
