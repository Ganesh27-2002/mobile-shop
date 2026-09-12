import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true"></div>
        <p>Verifying authentication session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={redirectUrl} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
