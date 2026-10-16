import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>🩸</span>
            <strong style={{ color: '#fff', fontSize: '1.1rem' }}>BloodConnect</strong>
          </div>
          <p className="footer-text">
            Connecting voluntary donors with urgent recipients across cities & partner hospitals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Home</Link>
          <Link to="/search" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Find Donors</Link>
          <Link to="/login" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Login</Link>
          <Link to="/register" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Register</Link>
        </div>

        <div className="footer-text">
          &copy; {new Date().getFullYear()} BloodConnect System. College Project.
        </div>
      </div>
    </footer>
  );
}
