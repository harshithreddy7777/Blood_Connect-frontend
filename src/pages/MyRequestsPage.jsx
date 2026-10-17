import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBox from '../components/AlertBox';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MyRequestsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [requestToCancel, setRequestToCancel] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/requests/me');
      setRequests(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load blood requests:', err);
      setError('Failed to load your blood request history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/requests/my');
      return;
    }
    loadRequests();
  }, [isAuthenticated, authLoading, navigate]);

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return;
    const requestId = requestToCancel.id;
    setCancellingId(requestId);
    setActionMessage('');
    setActionError('');
    try {
      await api.put(`/requests/${requestId}/cancel`);
      setActionMessage(`Blood request #${requestId} has been cancelled successfully.`);
      setRequestToCancel(null);
      loadRequests();
    } catch (err) {
      console.error('Failed to cancel request:', err);
      const msg = err.response?.data?.message || 'Failed to cancel the blood request.';
      setActionError(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' }}>Pending Review</span>;
      case 'APPROVED':
        return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>Approved / Active</span>;
      case 'FULFILLED':
        return <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>Fulfilled ✓</span>;
      case 'CANCELLED':
        return <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' }}>Cancelled</span>;
      case 'REJECTED':
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Rejected</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'CRITICAL':
        return <span className="badge" style={{ background: 'rgba(230, 57, 70, 0.25)', color: '#ff4d5a', fontWeight: 700 }}>🚨 Critical</span>;
      case 'HIGH':
        return <span className="badge" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>High</span>;
      case 'MEDIUM':
        return <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>Medium</span>;
      case 'LOW':
        return <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>Low</span>;
      default:
        return <span className="badge">{urgency}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Link to="/dashboard" style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'inline-block', marginBottom: '8px' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '2.2rem', margin: 0 }}>My Blood Requests</h1>
          <p style={{ color: '#94a3b8', marginTop: '6px' }}>
            Real-time tracking of all emergency requisitions submitted from your account.
          </p>
        </div>
        <Link to="/requests/new" id="btn-new-blood-request" className="btn btn-primary" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>+</span> New Blood Request
        </Link>
      </div>

      {actionMessage && (
        <AlertBox type="success" message={actionMessage} onClose={() => setActionMessage('')} />
      )}

      {actionError && (
        <AlertBox type="error" message={actionError} onClose={() => setActionError('')} />
      )}

      {error && (
        <div style={{ marginBottom: '24px' }}>
          <AlertBox type="error" message={error} onClose={() => setError('')} />
          <button onClick={loadRequests} className="btn btn-secondary btn-sm" style={{ marginTop: '6px' }}>
            ↻ Retry Loading Requests
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <LoadingSpinner message="Loading your emergency blood requisitions..." />
        </div>
      ) : requests.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No Blood Requests Found</h3>
          <p style={{ color: '#94a3b8', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            You have not submitted any blood requests yet. If you or someone you know requires blood, you can submit an urgent requisition now.
          </p>
          <Link to="/requests/new" className="btn btn-primary">
            Create Your First Blood Request
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {requests.map((req) => (
            <div
              key={req.id}
              className="glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: req.status === 'PENDING' ? '4px solid #facc15' : req.status === 'APPROVED' ? '4px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #e63946 0%, #b5179e 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(230, 57, 70, 0.35)',
                    }}
                  >
                    {req.bloodGroup}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                      Request #{req.id} — {req.unitsRequired} {req.unitsRequired === 1 ? 'Unit' : 'Units'} Required
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                      Submitted on {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getUrgencyBadge(req.urgency)}
                  {getStatusBadge(req.status)}
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hospital</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>{req.hospitalName}</div>
                  {req.hospitalAddress && <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{req.hospitalAddress}</div>}
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>📍 {req.location}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Number</div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>📞 {req.contactNumber}</div>
                </div>
              </div>

              {/* Notes */}
              {req.notes && (
                <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '6px' }}>
                  "{req.notes}"
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                <Link
                  to={`/requests/${req.id}`}
                  id={`btn-details-${req.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  View Details →
                </Link>
                {(req.status === 'PENDING' || req.status === 'APPROVED') && (
                  <button
                    onClick={() => setRequestToCancel(req)}
                    disabled={cancellingId === req.id}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#ff8a8a', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    {cancellingId === req.id ? 'Cancelling...' : 'Cancel Request'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accessible Confirmation Modal for Request Cancellation */}
      <ConfirmDialog
        isOpen={Boolean(requestToCancel)}
        title="Cancel Blood Requisition"
        message={`Are you sure you want to cancel Requisition #${requestToCancel?.id} (${requestToCancel?.unitsRequired} Units of ${requestToCancel?.bloodGroup})?

Once cancelled, voluntary donors will no longer be mobilized for this request.`}
        confirmLabel="Yes, Cancel Request"
        cancelLabel="Keep Request"
        isDanger={true}
        loading={Boolean(cancellingId)}
        onConfirm={confirmCancelRequest}
        onCancel={() => setRequestToCancel(null)}
      />
    </div>
  );
}
