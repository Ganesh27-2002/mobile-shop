import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true"></div>
        <p>Verifying administrative privileges...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectUrl} replace state={{ from: location }} />;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="admin-access-denied-container" data-testid="admin-access-denied">
        <div className="access-denied-card">
          <div className="denied-icon" aria-hidden="true">🚫</div>
          <h2>403 - Access Denied</h2>
          <p>
            Administrator privileges are required to access the management portal. Your current role (
            <strong>{user?.role || 'CUSTOMER'}</strong>) does not permit access to this area.
          </p>
          <div className="denied-actions">
            <Link to="/" className="btn-primary">
              Return to Store
            </Link>
            <Link to="/profile" className="btn-secondary">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
