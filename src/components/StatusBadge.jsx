import React from 'react';

/**
 * Reusable StatusBadge component for BloodConnect.
 * Standardizes status, urgency, and availability badges across all pages.
 */
export default function StatusBadge({ status, urgency, available, size = 'md' }) {
  const padding = size === 'sm' ? '3px 8px' : '5px 12px';
  const fontSize = size === 'sm' ? '0.75rem' : '0.82rem';

  if (urgency !== undefined && urgency !== null) {
    switch (urgency) {
      case 'CRITICAL':
        return (
          <span
            className="badge"
            style={{
              padding,
              fontSize,
              background: 'rgba(239, 68, 68, 0.25)',
              color: '#ff4d5a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              fontWeight: 700,
            }}
          >
            🚨 Critical
          </span>
        );
      case 'HIGH':
        return (
          <span
            className="badge"
            style={{
              padding,
              fontSize,
              background: 'rgba(249, 115, 22, 0.2)',
              color: '#fb923c',
              border: '1px solid rgba(249, 115, 22, 0.35)',
            }}
          >
            ⚡ High
          </span>
        );
      case 'MEDIUM':
        return (
          <span
            className="badge"
            style={{
              padding,
              fontSize,
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#facc15',
              border: '1px solid rgba(234, 179, 8, 0.3)',
            }}
          >
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span
            className="badge"
            style={{
              padding,
              fontSize,
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.3)',
            }}
          >
            Low
          </span>
        );
      default:
        return <span className="badge" style={{ padding, fontSize }}>{urgency}</span>;
    }
  }

  if (available !== undefined && available !== null) {
    return available ? (
      <span
        className="badge"
        style={{
          padding,
          fontSize,
          background: 'rgba(34, 197, 94, 0.15)',
          color: '#4ade80',
          border: '1px solid rgba(34, 197, 94, 0.3)',
        }}
      >
        ● Available
      </span>
    ) : (
      <span
        className="badge"
        style={{
          padding,
          fontSize,
          background: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.3)',
        }}
      >
        ○ Unavailable
      </span>
    );
  }

  switch (status) {
    case 'PENDING':
      return (
        <span
          className="badge"
          style={{
            padding,
            fontSize,
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#facc15',
            border: '1px solid rgba(234, 179, 8, 0.3)',
          }}
        >
          Pending Review
        </span>
      );
    case 'APPROVED':
      return (
        <span
          className="badge"
          style={{
            padding,
            fontSize,
            background: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}
        >
          Approved / Active
        </span>
      );
    case 'FULFILLED':
      return (
        <span
          className="badge"
          style={{
            padding,
            fontSize,
            background: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          Fulfilled ✓
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className="badge"
          style={{
            padding,
            fontSize,
            background: 'rgba(148, 163, 184, 0.15)',
            color: '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.3)',
          }}
        >
          Cancelled
        </span>
      );
    case 'REJECTED':
      return (
        <span
          className="badge"
          style={{
            padding,
            fontSize,
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          Rejected
        </span>
      );
    default:
      return <span className="badge" style={{ padding, fontSize }}>{status}</span>;
  }
}
