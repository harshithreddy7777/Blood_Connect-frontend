import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AlertBox from '../components/AlertBox';

export default function RegisterPage() {
  const { isAuthenticated, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Client-side field validator
  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 3) return 'Full name must be at least 3 characters.';
        if (value.trim().length > 100) return 'Full name cannot exceed 100 characters.';
        return '';

      case 'email':
        if (!value.trim()) return 'Email address is required.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address.';
        if (value.trim().length > 150) return 'Email cannot exceed 150 characters.';
        return '';

      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Password must be at least 6 characters.';
        if (value.length > 50) return 'Password cannot exceed 50 characters.';
        return '';

      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== formData.password) return 'Passwords do not match.';
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation if the field was already touched
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }

    // Special case: if password changed, re-validate confirmPassword if touched
    if (name === 'password' && touched.confirmPassword) {
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    // Mark all fields as touched and validate
    const allTouched = {
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    const validationErrors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };

    setErrors(validationErrors);

    // Stop if any client-side validation errors exist
    if (Object.values(validationErrors).some((err) => err !== '')) {
      return;
    }

    setSubmitting(true);

    try {
      // Passwords are sent securely over HTTPS/REST to backend and NEVER saved to localStorage
      const response = await api.post('/auth/register', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.data?.success) {
        setSuccessMessage('Account created successfully! Redirecting to your dashboard...');
        const { token, user } = response.data.data;
        login(user, token);

        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      } else {
        setServerError(response.data?.message || 'Registration failed.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors ? err.response.data.errors.join(', ') : 'Registration failed. Please check your inputs.');
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 24px', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🩸</div>
          <h2>Create an Account</h2>
          <p>Join the BloodConnect emergency network to donate blood or request assistance.</p>
        </div>

        <AlertBox type="error" message={serverError} onClose={() => setServerError('')} />
        <AlertBox type="success" message={successMessage} />

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="form-control"
              placeholder="e.g. Varshith Reddy"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              style={{
                borderColor: errors.fullName && touched.fullName ? '#ef4444' : undefined,
              }}
              required
            />
            {errors.fullName && touched.fullName && (
              <span id="fullName-error" style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                {errors.fullName}
              </span>
            )}
          </div>

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
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              style={{
                borderColor: errors.email && touched.email ? '#ef4444' : undefined,
              }}
              required
            />
            {errors.email && touched.email && (
              <span id="email-error" style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
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
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              style={{
                borderColor: errors.password && touched.password ? '#ef4444' : undefined,
              }}
              required
            />
            {errors.password && touched.password ? (
              <span id="password-error" style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                {errors.password}
              </span>
            ) : (
              <span style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
                Must be at least 6 characters.
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
              style={{
                borderColor: errors.confirmPassword && touched.confirmPassword ? '#ef4444' : undefined,
              }}
              required
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <span id="confirmPassword-error" style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            id="btn-register-submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#94a3b8' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ef4444', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
