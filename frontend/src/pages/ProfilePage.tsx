import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="profile-container" data-testid="profile-page">
      <div className="profile-card">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-titles">
            <h2 className="profile-name" data-testid="profile-name">
              {user.firstName} {user.lastName}
            </h2>
            <p className="profile-email" data-testid="profile-email">
              {user.email}
            </p>
          </div>
          <span
            className={`role-badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-customer'}`}
            data-testid="profile-role"
          >
            {user.role}
          </span>
        </div>

        {/* Profile Info Grid */}
        <div className="profile-details-grid">
          <div className="detail-item">
            <span className="detail-label">First Name</span>
            <span className="detail-value">{user.firstName}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Last Name</span>
            <span className="detail-value">{user.lastName}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Email Address</span>
            <span className="detail-value">{user.email}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Phone Number</span>
            <span className="detail-value">{user.phone || 'Not provided'}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Account Role</span>
            <span className="detail-value">{user.role}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Account Status</span>
            <span className="detail-value status-active">
              <span className="badge-dot" aria-hidden="true"></span>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Quick Links & Actions */}
        <div className="profile-actions">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="btn btn-primary"
            data-testid="profile-orders-btn"
          >
            📦 My Orders
          </button>
          <button
            type="button"
            onClick={() => navigate('/addresses')}
            className="btn btn-secondary"
            data-testid="profile-addresses-btn"
          >
            📍 Saved Addresses
          </button>
          {user.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="btn btn-warning"
              data-testid="profile-admin-btn"
            >
              🛡️ Admin Management Portal
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-danger"
            data-testid="profile-logout-button"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
