import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useCart } from '../hooks/useCart.js';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand Link */}
        <Link to="/" className="brand-section" aria-label="Mobile Shop Home">
          <div className="brand-icon" aria-hidden="true">📱</div>
          <h1 className="brand-title">Mobile Shop</h1>
        </Link>

        {/* Dynamic Navigation */}
        <nav className="main-nav" aria-label="Main Navigation">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            Home
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Products
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            data-testid="nav-cart"
          >
            Cart{itemCount > 0 ? ` (${itemCount})` : ''}
          </NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Login
              </NavLink>

              <NavLink
                to="/signup"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Signup
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Profile
              </NavLink>

              <NavLink
                to="/orders"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Orders
              </NavLink>

              <NavLink
                to="/addresses"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                data-testid="nav-addresses"
              >
                Addresses
              </NavLink>

              {user?.role === 'ADMIN' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `nav-link admin-link ${isActive ? 'active' : ''}`}
                >
                  Admin
                </NavLink>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="nav-link logout-btn"
                data-testid="logout-button"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
