import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getApiErrorMessage } from '../services/api.js';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Invalid email address';
    }

    if (formData.phone && !/^[+]?[0-9\s-]{7,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Invalid phone number format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one letter and one number';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
      });

      setSuccessMessage('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: unknown) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon" aria-hidden="true">📝</div>
          <h2 className="auth-title">Create an Account</h2>
          <p className="auth-subtitle">Join Mobile Shop for the best smartphone deals</p>
        </div>

        {apiError && (
          <div
            className="alert alert-error"
            data-testid="signup-error"
            role="alert"
          >
            <span className="alert-icon">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="alert alert-success"
            data-testid="signup-success"
            role="status"
          >
            <span className="alert-icon">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* First Name & Last Name */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                className={`form-input ${clientErrors.firstName ? 'input-error' : ''}`}
                data-testid="signup-first-name"
                disabled={isSubmitting}
              />
              {clientErrors.firstName && (
                <span className="field-error" role="alert">{clientErrors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                className={`form-input ${clientErrors.lastName ? 'input-error' : ''}`}
                data-testid="signup-last-name"
                disabled={isSubmitting}
              />
              {clientErrors.lastName && (
                <span className="field-error" role="alert">{clientErrors.lastName}</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className={`form-input ${clientErrors.email ? 'input-error' : ''}`}
              data-testid="signup-email"
              autoComplete="email"
              disabled={isSubmitting}
            />
            {clientErrors.email && (
              <span className="field-error" role="alert">{clientErrors.email}</span>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className={`form-input ${clientErrors.phone ? 'input-error' : ''}`}
              data-testid="signup-phone"
              disabled={isSubmitting}
            />
            {clientErrors.phone && (
              <span className="field-error" role="alert">{clientErrors.phone}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 6 characters (letter & number)"
              className={`form-input ${clientErrors.password ? 'input-error' : ''}`}
              data-testid="signup-password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            {clientErrors.password && (
              <span className="field-error" role="alert">{clientErrors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className={`form-input ${clientErrors.confirmPassword ? 'input-error' : ''}`}
              data-testid="signup-confirm-password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            {clientErrors.confirmPassword && (
              <span className="field-error" role="alert">{clientErrors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            data-testid="signup-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-sm" aria-hidden="true"></span>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
