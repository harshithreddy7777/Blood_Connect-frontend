import React from 'react';
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProtectedRoute component for route-level access control.
 * Handles:
 * - Session restoration loading states
 * - Unauthenticated redirect to /login with redirect query preservation
 * - Role-based authorization guard (requireAdmin) with clear 403 Access Denied view
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <LoadingSpinner message="Verifying authentication session..." />
      </div>
    );
  }

  // 1. Unauthenticated check
  if (!isAuthenticated) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
  }

  // 2. Admin authorization check
  if (requireAdmin && !isAdmin) {
    return (
      <div className="container" style={{ padding: '60px 24px', maxWidth: '640px' }}>
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '40px 28px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.05)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            403 Forbidden
          </span>
          <h2 style={{ color: '#fff', marginTop: '12px', fontSize: '1.75rem' }}>
            Administrative Privilege Required
          </h2>
          <p style={{ color: '#94a3b8', margin: '16px auto 20px', lineHeight: 1.6, fontSize: '0.95rem' }}>
            You are logged in as <strong>{user?.fullName || 'User'}</strong> ({user?.email}) with role{' '}
            <code style={{ color: '#f87171' }}>{user?.role || 'ROLE_USER'}</code>. The requested administrative page is restricted to system administrators with{' '}
            <code style={{ color: '#4ade80' }}>ROLE_ADMIN</code>.
          </p>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.85rem',
              color: '#cbd5e1',
              textAlign: 'left',
              marginBottom: '28px',
            }}
          >
            🔒 <strong>Security Policy:</strong> Frontend role checks optimize user experience and navigation. Real administrative authorization is enforced independently by Spring Boot Security on every API endpoint.
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/dashboard" id="btn-return-dashboard" className="btn btn-primary">
              ← Return to Dashboard
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              id="btn-switch-account"
              className="btn btn-secondary"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
