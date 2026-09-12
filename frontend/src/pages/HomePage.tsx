import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { api, getApiErrorMessage } from '../services/api.js';
import { productService } from '../services/productService.js';
import { ProductCard } from '../components/ProductCard.js';
import type { Product } from '../types/product.js';

interface HealthStatus {
  checked: boolean;
  loading: boolean;
  success?: boolean;
  message?: string;
  database?: string;
  error?: string;
}

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState<boolean>(true);
  const [health, setHealth] = useState<HealthStatus>({
    checked: false,
    loading: false,
  });

  const checkBackendHealth = async () => {
    setHealth({ checked: true, loading: true });
    try {
      const response = await api.get('/health');
      setHealth({
        checked: true,
        loading: false,
        success: response.data.success,
        message: response.data.message,
        database: response.data.database,
      });
    } catch (err: unknown) {
      setHealth({
        checked: true,
        loading: false,
        success: false,
        error: getApiErrorMessage(err),
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();

    let isMounted = true;
    const loadFeatured = async () => {
      try {
        const data = await productService.getProducts({ sort: 'newest', limit: 4 });
        if (isMounted) {
          setFeaturedProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        if (isMounted) {
          setLoadingFeatured(false);
        }
      }
    };

    loadFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-container">
      {/* Hero Card */}
      <section className="hero-card">
        <div className="badge">
          <span className="badge-dot" aria-hidden="true"></span>
          Step 5 Product Catalog & APIs Active
        </div>
        <h2 className="hero-title">
          {isAuthenticated
            ? `Welcome back, ${user?.firstName}!`
            : 'Welcome to Mobile Shop'}
        </h2>
        <p className="hero-subtitle">
          Next-generation mobile e-commerce platform built with React, Vite, Node.js, Express, Sequelize, PostgreSQL, and JWT Authentication.
        </p>

        <div className="hero-cta-group">
          <Link to="/products" className="btn btn-primary">
            Explore Smartphone Catalog &rarr;
          </Link>
          {!isAuthenticated ? (
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          ) : (
            <Link to="/profile" className="btn btn-secondary">
              My Profile
            </Link>
          )}
        </div>

        {/* Backend & DB Health Monitor */}
        <div className="health-box">
          <div className="health-header">
            <span className="health-title">Backend API & Database Health</span>
            <button
              type="button"
              className="check-btn"
              onClick={checkBackendHealth}
              disabled={health.loading}
            >
              {health.loading ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>
          <div className={`health-status ${health.success ? 'status-online' : ''}`}>
            {health.loading ? (
              'Connecting to http://localhost:5000/api/health...'
            ) : health.checked ? (
              health.success ? (
                `🟢 ${health.message} (HTTP 200 OK) | DB: ${health.database || 'connected'}`
              ) : (
                `🔴 Backend offline: ${health.error} (Ensure backend server is running on port 5000)`
              )
            ) : (
              'Click refresh to test backend connection'
            )}
          </div>
        </div>
      </section>

      {/* Featured Smartphones Section */}
      <section className="featured-section">
        <div className="featured-header-row">
          <div>
            <h2 className="featured-heading">Featured Smartphones</h2>
            <p className="featured-subheading">Hand-picked flagship smartphones with the latest AI and camera innovations</p>
          </div>
          <Link to="/products" className="view-all-link">
            View All Mobiles &rarr;
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="loading-container">
            <div className="spinner" aria-hidden="true"></div>
            <p>Loading featured smartphones...</p>
          </div>
        ) : (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Feature Architecture Grid */}
      <section className="grid-cards">
        <div className="card">
          <div className="card-icon">📱</div>
          <h3 className="card-title">Dynamic Product Catalog</h3>
          <p className="card-desc">
            Sequelize-powered REST APIs with case-insensitive search, multi-brand filtering, sorting allowlist, and database-level pagination.
          </p>
        </div>
        <div className="card">
          <div className="card-icon">🔐</div>
          <h3 className="card-title">JWT Client Authentication</h3>
          <p className="card-desc">
            Client-side JWT handling, AuthContext state management, automatic profile initialization, and logout capabilities.
          </p>
        </div>
        <div className="card">
          <div className="card-icon">⚡</div>
          <h3 className="card-title">Automated Playwright Suite</h3>
          <p className="card-desc">
            End-to-end automated UI and backend API test suites validating functionality across smoke, auth, and catalog flows.
          </p>
        </div>
      </section>
    </div>
  );
};
