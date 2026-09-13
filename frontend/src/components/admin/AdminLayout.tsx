import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeSection }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="admin-layout" data-testid="admin-layout">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Admin Sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <span className="brand-badge">ADMIN</span>
            <span className="brand-name">Mobile Portal</span>
          </div>
          <button
            type="button"
            className="admin-mobile-close-btn"
            onClick={closeMobileMenu}
            aria-label="Close admin menu"
          >
            ✕
          </button>
        </div>

        <div className="admin-sidebar-user">
          <div className="user-avatar" aria-hidden="true">
            {user?.firstName?.charAt(0) || 'A'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.firstName} {user?.lastName}</div>
            <div className="user-role-badge">Super Admin</div>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin Navigation">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
            data-testid="admin-nav-dashboard"
          >
            <span className="nav-icon" aria-hidden="true">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/products"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
            data-testid="admin-nav-products"
          >
            <span className="nav-icon" aria-hidden="true">📱</span>
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
            data-testid="admin-nav-categories"
          >
            <span className="nav-icon" aria-hidden="true">🏷️</span>
            <span>Categories</span>
          </NavLink>

          <NavLink
            to="/admin/inventory"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
            data-testid="admin-nav-inventory"
          >
            <span className="nav-icon" aria-hidden="true">📦</span>
            <span>Inventory</span>
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
            data-testid="admin-nav-orders"
          >
            <span className="nav-icon" aria-hidden="true">🛍️</span>
            <span>Orders</span>
          </NavLink>

          <NavLink
            to="/admin/customers"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
            data-testid="admin-nav-customers"
          >
            <span className="nav-icon" aria-hidden="true">👥</span>
            <span>Customers</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item return-store-btn" onClick={closeMobileMenu}>
            <span className="nav-icon" aria-hidden="true">🏪</span>
            <span>Storefront</span>
          </Link>

          <button
            type="button"
            className="admin-nav-item admin-logout-btn"
            onClick={handleLogout}
            data-testid="admin-logout-btn"
          >
            <span className="nav-icon" aria-hidden="true">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="admin-main">
        {/* Top Header Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-hamburger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle admin sidebar"
              data-testid="admin-hamburger-btn"
            >
              ☰
            </button>
            <h2 className="admin-page-title">{activeSection || 'Admin Console'}</h2>
          </div>

          <div className="admin-topbar-right">
            <Link to="/" className="topbar-store-link">
              View Storefront ↗
            </Link>
            <div className="admin-badge-pill">
              🛡️ {user?.firstName || 'Admin'}
            </div>
          </div>
        </header>

        {/* Dynamic Admin Body */}
        <main className="admin-content-body">
          {children}
        </main>
      </div>
    </div>
  );
};
