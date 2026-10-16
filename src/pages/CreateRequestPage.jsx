import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AlertBox from '../components/AlertBox';

export default function CreateRequestPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const [bloodGroup, setBloodGroup] = useState(searchParams.get('bloodGroup') || 'O+');
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [hospitalId, setHospitalId] = useState('');
  const [location, setLocation] = useState(searchParams.get('city') || 'Hyderabad');
  const [urgency, setUrgency] = useState('HIGH');
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadHospitals = () => {
    setLoadingHospitals(true);
    setError('');
    api.get('/hospitals')
      .then((res) => {
        const list = res.data?.data || [];
        setHospitals(list);
        if (list.length > 0 && !hospitalId) {
          setHospitalId(list[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load hospitals:', err);
        setError('Failed to load accredited partner hospitals from database. Please check connection.');
      })
      .finally(() => setLoadingHospitals(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/requests/new');
      return;
    }
    loadHospitals();
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!hospitalId) {
      setError('Please select an accredited hospital.');
      return;
    }
    if (unitsRequired < 1) {
      setError('Units required must be at least 1.');
      return;
    }
    if (!contactNumber.trim()) {
      setError('Contact phone number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bloodGroup,
        unitsRequired: parseInt(unitsRequired, 10),
        hospitalId: parseInt(hospitalId, 10),
        location: location.trim(),
        urgency,
        contactNumber: contactNumber.trim(),
        notes: notes.trim() || null,
      };

      const res = await api.post('/requests', payload);
      const newId = res.data?.data?.id;
      setSuccess(`Emergency blood request #${newId || ''} submitted successfully! Redirecting to requisition details...`);
      setTimeout(() => {
        if (newId) {
          navigate(`/requests/${newId}`);
        } else {
          navigate('/requests/my');
        }
      }, 1200);
    } catch (err) {
      console.error('Request submission error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to submit blood request. Please check your inputs.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <Link to="/dashboard" style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'inline-block', marginBottom: '12px' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Submit Blood Request</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>
          Create an emergency requisition for blood units at an accredited partner hospital.
        </p>
      </div>

      {/* Mandatory Disclaimer Alert */}
      <div
        className="glass-card"
        style={{
          borderLeft: '4px solid #f59e0b',
          background: 'rgba(245, 158, 11, 0.08)',
          padding: '16px 20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.4rem' }}>⚠️</span>
          <div style={{ fontSize: '0.9rem', color: '#fde68a', lineHeight: 1.5 }}>
            <strong>Important Policy Notice:</strong> Submitting a blood requisition alerts verified voluntary donors
            and hospital coordinators in your area. <em>Submission does not automatically guarantee instant blood availability.</em>{' '}
            For acute life-threatening emergencies, also contact the hospital blood bank directly.
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '24px' }}>
          <AlertBox type="error" message={error} onClose={() => setError('')} />
          {hospitals.length === 0 && (
            <button onClick={loadHospitals} className="btn btn-secondary btn-sm" style={{ marginTop: '6px' }}>
              ↻ Retry Loading Hospitals
            </button>
          )}
        </div>
      )}

      {success && (
        <div style={{ marginBottom: '24px' }}>
          <AlertBox type="success" message={success} />
        </div>
      )}

      <div className="glass-card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Blood Group */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Required Blood Group *</label>
              <select
                id="req-blood-group"
                className="form-control"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                required
              >
                <option value="A+">A+ (A Positive)</option>
                <option value="A-">A- (A Negative)</option>
                <option value="B+">B+ (B Positive)</option>
                <option value="B-">B- (B Negative)</option>
                <option value="AB+">AB+ (AB Positive)</option>
                <option value="AB-">AB- (AB Negative)</option>
                <option value="O+">O+ (O Positive)</option>
                <option value="O-">O- (O Negative)</option>
              </select>
            </div>

            {/* Units Required */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Units Required *</label>
              <input
                id="req-units"
                type="number"
                min="1"
                max="20"
                className="form-control"
                value={unitsRequired}
                onChange={(e) => setUnitsRequired(e.target.value)}
                required
              />
              <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Positive number of units (1–20)</small>
            </div>
          </div>

          {/* Hospital Selection */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Hospital Selection *</label>
            {loadingHospitals ? (
              <p style={{ color: '#94a3b8' }}>Loading accredited partner hospitals...</p>
            ) : (
              <select
                id="req-hospital"
                className="form-control"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                required
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.city} ({h.address})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Request Location / City */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Request Location / City *</label>
              <input
                id="req-location"
                type="text"
                className="form-control"
                placeholder="e.g. Hyderabad"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            {/* Urgency Level */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Clinical Urgency *</label>
              <select
                id="req-urgency"
                className="form-control"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                required
              >
                <option value="LOW">Low (Within 48 hours)</option>
                <option value="MEDIUM">Medium (Within 24 hours)</option>
                <option value="HIGH">High (Within 6 hours)</option>
                <option value="CRITICAL">Critical (Immediate Emergency)</option>
              </select>
            </div>
          </div>

          {/* Contact Number */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Attendant Contact Phone Number *</label>
            <input
              id="req-contact-phone"
              type="tel"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              required
            />
            <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Number will be reachable by potential donors and coordinators</small>
          </div>

          {/* Optional Notes */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Additional Clinical Notes (Optional)</label>
            <textarea
              id="req-notes"
              className="form-control"
              rows="3"
              placeholder="e.g. Patient ID, surgery schedule, ICU ward, specific requirements..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              id="btn-submit-request"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ minWidth: '180px' }}
            >
              {submitting ? 'Submitting...' : 'Post Blood Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
