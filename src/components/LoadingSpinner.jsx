import React from 'react';

/**
 * Reusable LoadingSpinner component with accessible ARIA status.
 */
export default function LoadingSpinner({ message = 'Loading data...', size = 32 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: '3px solid rgba(220, 38, 38, 0.2)',
          borderTopColor: '#ef4444',
          borderRadius: '50%',
          animation: 'bc-spin 0.8s linear infinite',
        }}
      />
      {message && (
        <span style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 500 }}>
          {message}
        </span>
      )}
      <style>{`
        @keyframes bc-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
