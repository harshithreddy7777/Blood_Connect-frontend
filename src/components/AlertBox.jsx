import React from 'react';

/**
 * Reusable AlertBox component for errors, success notifications, and warnings.
 */
export default function AlertBox({ type = 'error', message, onClose }) {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.35)',
      color: '#fca5a5',
      icon: '❌',
    },
    success: {
      bg: 'rgba(34, 197, 94, 0.12)',
      border: 'rgba(34, 197, 94, 0.35)',
      color: '#86efac',
      icon: '✓',
    },
    warning: {
      bg: 'rgba(234, 179, 8, 0.12)',
      border: 'rgba(234, 179, 8, 0.35)',
      color: '#fde047',
      icon: '⚠️',
    },
    info: {
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.35)',
      color: '#7dd3fc',
      icon: 'ℹ️',
    },
  }[type] || {
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.35)',
    color: '#cbd5e1',
    icon: 'ℹ️',
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.color,
        padding: '12px 18px',
        borderRadius: '10px',
        marginBottom: '20px',
        fontSize: '0.92rem',
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{styles.icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          style={{
            color: 'inherit',
            opacity: 0.7,
            padding: '2px 8px',
            fontSize: '1rem',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
