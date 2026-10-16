import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AlertBox from '../components/AlertBox';

export default function LoginPage() {
  const { isAuthenticated, isAdmin, login, sessionMessage, setSessionMessage, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectUrl = searchParams.get('redirect');
  const isSessionExpiredParam = searchParams.get('sessionExpired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect appropriately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (redirectUrl) {
        navigate(redirectUrl, { replace: true });
      } else if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, redirectUrl, navigate]);

  // Client validation
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email address is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address.';
        return '';

      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Password must be at least 6 characters.';
        return '';

      default:
        return '';
    }
  };

  const handleChangeEmail = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateField('email', val) }));
    }
  };

  const handleChangePassword = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validateField('password', val) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'email' ? email : password;
    setErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);
    setTouched({ email: true, password: true });
    setErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      return;
    }

    setLoading(true);

    try {
      // Credentials sent strictly over POST body; never stored or logged
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data?.success) {
        const { token, user } = response.data.data;
        login(user, token);

        if (redirectUrl) {
          navigate(redirectUrl, { replace: true });
        } else if (user.role === 'ROLE_ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setServerError(response.data?.message || 'Login failed.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Invalid email or password.'
          : 'Unable to connect to authentication server.');
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const displayNotice = sessionMessage || (isSessionExpiredParam ? 'Your session has expired. Please log in again.' : '');

  return (
    <div className="container" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔐</div>
          <h2>Welcome Back</h2>
          <p>Sign in to access your donor profile or emergency blood requests.</p>
        </div>

        {displayNotice && (
          <AlertBox
            type="warning"
            message={displayNotice}
            onClose={() => setSessionMessage('')}
          />
        )}

        <AlertBox type="error" message={serverError} onClose={() => setServerError('')} />

        <form onSubmit={handleSubmit} noValidate>
          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={handleChangeEmail}
              onBlur={() => handleBlur('email')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              style={{
                borderColor: errors.email && touched.email ? '#ef4444' : undefined,
              }}
              required
            />
            {errors.email && touched.email && (
              <span id="login-email-error" style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={handleChangePassword}
              onBlur={() => handleBlur('password')}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              style={{
                borderColor: errors.password && touched.password ? '#ef4444' : undefined,
              }}
              required
            />
            {errors.password && touched.password && (
              <span id="login-password-error" style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#94a3b8' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: '#ef4444', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
