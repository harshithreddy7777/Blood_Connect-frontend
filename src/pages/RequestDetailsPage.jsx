import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBox from '../components/AlertBox';
import ConfirmDialog from '../components/ConfirmDialog';

export default function RequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchRequestDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/requests/${id}`);
      if (res.data?.success && res.data.data) {
        setRequest(res.data.data);
      } else {
        setError('Blood request record not found or inaccessible.');
      }
    } catch (err) {
      console.error('Failed to load blood request details:', err);
      if (err.response?.status === 403) {
        setError('Access Denied: You do not have permission to view this requisition record.');
      } else if (err.response?.status === 404) {
        setError(`Requisition #${id} was not found in the database.`);
      } else {
        setError(err.response?.data?.message || 'Failed to load blood request details from the server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate(`/login?redirect=/requests/${id}`);
      return;
    }
    fetchRequestDetails();
  }, [id, isAuthenticated, authLoading]);

  const handleCancelConfirm = async () => {
    setCancelling(true);
    setError('');
    setActionSuccess('');
    try {
      const res = await api.put(`/requests/${id}/cancel`);
      if (res.data?.success) {
        setRequest(res.data.data);
        setActionSuccess(`Requisition #${id} has been successfully cancelled.`);
        setShowCancelDialog(false);
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(err.response?.data?.message || 'Failed to cancel the blood request.');
      setShowCancelDialog(false);
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const canCancel = request && (request.status === 'PENDING' || request.status === 'APPROVED');

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '1000px' }}>
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/requests/my"
            id="link-back-my-requests"
            style={{
              color: '#94a3b8',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Back to My Requests
          </Link>
          <span style={{ color: '#475569' }}>|</span>
          <Link
            to="/dashboard"
            style={{ color: '#94a3b8', fontSize: '0.9rem' }}
          >
            Dashboard
          </Link>
          {isAdmin && (
            <>
              <span style={{ color: '#475569' }}>|</span>
              <Link
                to="/admin/requests"
                style={{ color: '#f87171', fontSize: '0.9rem' }}
              >
                Admin Queue
              </Link>
            </>
          )}
        </div>

        {request && (
          <button
            onClick={handlePrint}
            id="btn-print-requisition"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            🖨️ Print Requisition
          </button>
        )}
      </div>

      <AlertBox type="error" message={error} onClose={() => setError('')} />
      <AlertBox type="success" message={actionSuccess} onClose={() => setActionSuccess('')} />

      {loading ? (
        <LoadingSpinner message="Retrieving requisition details from database..." />
      ) : !request ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
          <h2>Requisition Unavailable</h2>
          <p style={{ maxWidth: '480px', margin: '12px auto 24px', color: '#94a3b8' }}>
            We could not retrieve details for blood requisition #{id}. It may have been removed or you may lack authorized access.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={fetchRequestDetails} className="btn btn-primary">
              ↻ Retry Loading
            </button>
            <Link to="/requests/my" className="btn btn-secondary">
              Return to My Requests
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Requisition Header Card */}
          <div
            className="glass-card"
            style={{
              padding: '28px',
              borderLeft: request.status === 'PENDING'
                ? '5px solid #facc15'
                : request.status === 'APPROVED'
                ? '5px solid #38bdf8'
                : request.status === 'FULFILLED'
                ? '5px solid #4ade80'
                : request.status === 'CANCELLED'
                ? '5px solid #94a3b8'
                : '5px solid #f87171',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.75rem',
                    padding: '12px 22px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)',
                    minWidth: '70px',
                    textAlign: 'center',
                  }}
                >
                  {request.bloodGroup}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Requisition ID: #{request.id}
                    </span>
                  </div>
                  <h1 style={{ fontSize: '1.75rem', margin: 0 }}>
                    Emergency Blood Request
                  </h1>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>
                    Submitted on {new Date(request.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} at{' '}
                    {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <StatusBadge urgency={request.urgency} />
                <StatusBadge status={request.status} />
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginTop: '28px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>UNITS REQUIRED</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                  {request.unitsRequired} {request.unitsRequired === 1 ? 'Unit (450ml)' : 'Units'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>CONTACT PHONE</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                  📞 {request.contactNumber}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>REQUISITION CITY</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                  📍 {request.location}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>LAST UPDATED</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#cbd5e1', marginTop: '4px' }}>
                  {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Details 2-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
            {/* Requester & Clinical Information */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <span style={{ fontSize: '1.4rem' }}>👤</span>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Requester & Patient Details</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Requester Name</span>
                  <strong style={{ color: '#f8fafc' }}>{request.requesterName || user?.fullName || 'Requester'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Requester User ID</span>
                  <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>#{request.requesterId}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Verified Phone</span>
                  <strong style={{ color: '#f8fafc' }}>{request.contactNumber}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Blood Group / Compatibility</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{request.bloodGroup}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Urgency Level</span>
                  <StatusBadge urgency={request.urgency} size="sm" />
                </div>

                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                    Clinical Notes & Requirements:
                  </span>
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      color: request.notes ? '#e2e8f0' : '#64748b',
                      fontSize: '0.92rem',
                      fontStyle: request.notes ? 'normal' : 'italic',
                      lineHeight: 1.5,
                    }}
                  >
                    {request.notes || 'No special clinical instructions specified by requester.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital & Facility Destination */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <span style={{ fontSize: '1.4rem' }}>🏥</span>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Designated Partner Hospital</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Hospital Name</span>
                  <strong style={{ color: '#f8fafc', textAlign: 'right' }}>{request.hospitalName || 'Accredited Medical Center'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Hospital System ID</span>
                  <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>#{request.hospitalId}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>City</span>
                  <span style={{ color: '#f8fafc' }}>{request.hospitalCity || request.location}</span>
                </div>

                {request.hospitalAddress && (
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>Hospital Address:</span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.92rem' }}>{request.hospitalAddress}</span>
                  </div>
                )}

                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 16px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    color: '#93c5fd',
                    lineHeight: 1.5,
                  }}
                >
                  ℹ️ This requisition is registered with BloodConnect partner network. Voluntary donors presenting at this facility should quote <strong>Requisition #{request.id}</strong> at the blood bank reception.
                </div>
              </div>
            </div>
          </div>

          {/* Action Center Card */}
          <div
            className="glass-card"
            style={{
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                Requisition Status: <span style={{ textTransform: 'capitalize' }}>{request.status.toLowerCase()}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>
                {canCancel
                  ? 'You may withdraw this emergency requisition if blood supplies have been secured elsewhere.'
                  : `This requisition is currently ${request.status} and cannot be altered.`}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/requests/my" className="btn btn-secondary btn-sm">
                View All My Requests
              </Link>

              {canCancel && (
                <button
                  type="button"
                  id="btn-cancel-requisition"
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    boxShadow: 'none',
                  }}
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Requisition
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Blood Requisition?"
        message={`Are you sure you want to cancel Requisition #${id} (${request?.unitsRequired} units of ${request?.bloodGroup})? This will mark the request as CANCELLED and notify medical coordinators.`}
        confirmLabel="Yes, Cancel Request"
        cancelLabel="Keep Requisition Active"
        isDanger={true}
        loading={cancelling}
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
}
