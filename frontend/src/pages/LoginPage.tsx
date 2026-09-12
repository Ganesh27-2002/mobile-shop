import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getApiErrorMessage } from '../services/api.js';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email address format';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      // Redirect to intended target
      navigate(redirectUrl, { replace: true });
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
          <div className="auth-icon" aria-hidden="true">🔐</div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your Mobile Shop account</p>
        </div>

        {apiError && (
          <div
            className="alert alert-error"
            data-testid="login-error"
            role="alert"
          >
            <span className="alert-icon">⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (clientErrors.email) {
                  setClientErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="name@example.com"
              className={`form-input ${clientErrors.email ? 'input-error' : ''}`}
              data-testid="login-email"
              autoComplete="email"
              disabled={isSubmitting}
            />
            {clientErrors.email && (
              <span className="field-error" role="alert">{clientErrors.email}</span>
            )}
          </div>

          {/* Password Input */}
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (clientErrors.password) {
                  setClientErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="••••••••"
              className={`form-input ${clientErrors.password ? 'input-error' : ''}`}
              data-testid="login-password"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            {clientErrors.password && (
              <span className="field-error" role="alert">{clientErrors.password}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            data-testid="login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-sm" aria-hidden="true"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
