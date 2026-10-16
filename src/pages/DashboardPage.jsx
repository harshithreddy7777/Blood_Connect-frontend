import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [donorData, setDonorData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/dashboard');
      return;
    }

    Promise.allSettled([
      api.get('/auth/me'),
      api.get('/donors/me'),
      api.get('/requests/me')
    ]).then(([authRes, donorRes, reqRes]) => {
      if (authRes.status === 'fulfilled' && authRes.value.data?.success) {
        setProfile(authRes.value.data.data);
      }
      if (donorRes.status === 'fulfilled' && donorRes.value.data?.success) {
        setDonorData(donorRes.value.data.data);
      }
      if (reqRes.status === 'fulfilled' && reqRes.value.data?.success) {
        setRequests(reqRes.value.data.data || []);
      }
    }).finally(() => setLoading(false));
  }, [isAuthenticated, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="container" style={{ padding: '80px 24px' }}>
        <LoadingSpinner message="Loading your personal dashboard from MySQL..." />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-primary">{profile?.role || user?.role || 'ROLE_USER'}</span>
          {donorData && (
            <span className={`badge ${donorData.available ? 'badge-success' : 'badge-warning'}`}>
              Blood Group: {donorData.bloodGroup} ({donorData.available ? 'Available' : 'Unavailable'})
            </span>
          )}
        </div>
        <h2>Welcome, {profile?.fullName || user?.fullName || 'User'}!</h2>
        <p>Member email: <strong>{profile?.email || user?.email}</strong> | Account Active</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="glass-card">
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🩸</div>
          <h3>Donor Profile</h3>
          {donorData ? (
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '4px 0' }}>Blood Group: <strong style={{ color: '#ef4444' }}>{donorData.bloodGroup}</strong></p>
              <p style={{ margin: '4px 0' }}>Location: <strong>{donorData.city}</strong> {donorData.area && `(${donorData.area})`}</p>
              <p style={{ margin: '4px 0' }}>Contact: <strong>{donorData.contactNumber}</strong></p>
              <p style={{ margin: '4px 0' }}>Status: <strong style={{ color: donorData.available ? '#4ade80' : '#fbbf24' }}>
                {donorData.available ? '● Available for emergencies' : '○ Temporarily unavailable'}
              </strong></p>
            </div>
          ) : (
            <p style={{ marginTop: '8px' }}>
              You have not registered as a voluntary blood donor yet. Register now to save lives in emergencies.
            </p>
          )}
          <div style={{ marginTop: '20px' }}>
            <Link to="/donor/profile" className="btn btn-primary btn-sm">
              {donorData ? 'Update Donor Profile' : 'Become a Donor'}
            </Link>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>📋</div>
          <h3>My Blood Requests</h3>
          {requests.length > 0 ? (
            <div style={{ marginTop: '10px' }}>
              <p style={{ margin: '4px 0' }}>
                Total Requisitions: <strong>{requests.length}</strong>
              </p>
              <p style={{ margin: '4px 0' }}>
                Active / Pending:{' '}
                <strong style={{ color: '#facc15' }}>
                  {requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED').length}
                </strong>
              </p>
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                Latest:{' '}
                <Link
                  to={`/requests/${requests[0].id}`}
                  style={{ color: '#38bdf8', textDecoration: 'none' }}
                >
                  <strong>{requests[0].bloodGroup} ({requests[0].unitsRequired} units)</strong> at {requests[0].hospitalName}
                </Link>{' '}
                — <span style={{ color: requests[0].status === 'PENDING' ? '#facc15' : '#4ade80' }}>{requests[0].status}</span>
              </div>
            </div>
          ) : (
            <p style={{ marginTop: '8px' }}>
              Submit urgent requisitions, specify hospital locations, and track approval status.
            </p>
          )}
          <div style={{ marginTop: '20px' }}>
            <Link to="/requests/new" className="btn btn-primary btn-sm" style={{ marginRight: '8px' }}>
              + Request Blood
            </Link>
            <Link to="/requests/my" className="btn btn-secondary btn-sm">
              View All ({requests.length})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
