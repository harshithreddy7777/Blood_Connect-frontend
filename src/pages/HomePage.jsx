import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    api.get('/health')
      .then(res => {
        if (res.data?.status === 'UP') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      })
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '80px 0 60px',
        background: 'radial-gradient(ellipse at top, rgba(220, 38, 38, 0.15) 0%, rgba(11, 15, 25, 0) 70%)',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span className="badge badge-primary">Emergency Blood Donation Network</span>
            <span className="status-pill" style={{
              fontSize: '0.8rem',
              color: backendStatus === 'connected' ? '#4ade80' : '#f87171',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '4px 10px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span className="status-dot" style={{
                backgroundColor: backendStatus === 'connected' ? '#22c55e' : '#ef4444',
                boxShadow: backendStatus === 'connected' ? '0 0 8px #22c55e' : '0 0 8px #ef4444'
              }}></span>
              Backend API: {backendStatus.toUpperCase()}
            </span>
          </div>

          <h1 style={{ maxWidth: '800px', margin: '0 auto 20px', fontSize: '3.2rem', fontWeight: 800 }}>
            Every Drop Counts. <br />
            <span style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Save a Life Today.
            </span>
          </h1>

          <p style={{ maxWidth: '640px', margin: '0 auto 36px', fontSize: '1.15rem' }}>
            BloodConnect bridges voluntary blood donors directly with recipients and healthcare centers in real-time, eliminating critical delays in emergency situations.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/search" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              🔍 Find Blood Donors
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1.05rem' }}>
              ❤️ Register as Donor
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section style={{ padding: '60px 0 80px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2>Built for Speed, Safety & Accuracy</h2>
            <p style={{ marginTop: '8px' }}>Essential features designed to streamline emergency blood mobilization.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}>
            <div className="glass-card">
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚡</div>
              <h3>Instant Donor Discovery</h3>
              <p style={{ marginTop: '10px' }}>
                Search available donors instantly by ABO/Rh blood group and city proximity with live contact verification.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🏥</div>
              <h3>Emergency Requests</h3>
              <p style={{ marginTop: '10px' }}>
                Submit verified requisitions with urgency categorization, required units, and partner hospital routing.
              </p>
            </div>

            <div className="glass-card">
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🛡️</div>
              <h3>Verified Coordination</h3>
              <p style={{ marginTop: '10px' }}>
                Administrative workflow with status updates, hospital records oversight, and live operational statistics.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
