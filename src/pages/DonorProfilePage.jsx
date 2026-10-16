import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AlertBox from '../components/AlertBox';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DonorProfilePage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    city: '',
    area: '',
    contactNumber: '',
    lastDonationDate: '',
    available: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Maximum allowed date is today
  const todayStr = new Date().toISOString().split('T')[0];

  const loadProfile = () => {
    setLoading(true);
    setLoadError('');
    api.get('/donors/me')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const p = res.data.data;
          setFormData({
            bloodGroup: p.bloodGroup || 'O+',
            city: p.city || '',
            area: p.area || '',
            contactNumber: p.contactNumber || '',
            lastDonationDate: p.lastDonationDate || '',
            available: p.available ?? true,
          });
          setIsEditing(true);
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          // Absent in DB: switch to creation mode
          setIsEditing(false);
        } else {
          console.error('Failed to fetch donor profile:', err);
          setLoadError(
            err.response?.data?.message || 'Unable to load your donor profile from MySQL. Please check connectivity.'
          );
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated, authLoading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setFieldErrors({});

    // Client preliminary checks
    if (!formData.city.trim()) {
      setFieldErrors((prev) => ({ ...prev, city: 'City is required.' }));
      return;
    }
    if (!formData.contactNumber.trim()) {
      setFieldErrors((prev) => ({ ...prev, contactNumber: 'Contact phone number is required.' }));
      return;
    }

    setSubmitting(true);

    const payload = {
      bloodGroup: formData.bloodGroup,
      city: formData.city.trim(),
      area: formData.area.trim() || null,
      contactNumber: formData.contactNumber.trim(),
      lastDonationDate: formData.lastDonationDate ? formData.lastDonationDate : null,
      available: formData.available,
    };

    try {
      if (isEditing) {
        const res = await api.put('/donors/me', payload);
        if (res.data?.success) {
          setSuccessMsg('Your voluntary donor profile has been updated successfully!');
        }
      } else {
        const res = await api.post('/donors/me', payload);
        if (res.data?.success) {
          setIsEditing(true);
          setSuccessMsg('Congratulations! Your voluntary donor profile is now registered and active.');
        }
      }
    } catch (err) {
      console.error('Donor profile submission error:', err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Backend returns array of validation errors: ["city: City cannot be blank", ...]
        const mappedErrors = {};
        err.response.data.errors.forEach((errStr) => {
          const colonIdx = errStr.indexOf(':');
          if (colonIdx > -1) {
            const field = errStr.substring(0, colonIdx).trim();
            const msg = errStr.substring(colonIdx + 1).trim();
            mappedErrors[field] = msg;
          }
        });
        setFieldErrors(mappedErrors);
        setErrorMsg('Validation failed: Please correct the highlighted errors.');
      } else {
        const msg = err.response?.data?.message || 'Failed to save donor profile to the database.';
        setErrorMsg(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="container" style={{ padding: '80px 24px' }}>
        <LoadingSpinner message="Retrieving donor profile from database..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container" style={{ padding: '60px 24px', maxWidth: '640px' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
          <h3>Failed to Load Profile</h3>
          <p style={{ color: '#94a3b8', margin: '12px auto 24px' }}>{loadError}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button onClick={loadProfile} className="btn btn-primary btn-sm">
              ↻ Retry Loading
            </button>
            <Link to="/dashboard" className="btn btn-secondary btn-sm">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '680px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <Link
          to="/dashboard"
          style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'inline-block', marginBottom: '12px' }}
        >
          ← Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span className="badge badge-primary">Voluntary Donor Network</span>
          {isEditing && (
            <span className={`badge ${formData.available ? 'badge-success' : 'badge-warning'}`}>
              {formData.available ? '● Available for Donation' : '○ Currently Unavailable'}
            </span>
          )}
        </div>
        <h2>{isEditing ? 'Manage Donor Profile' : 'Register as a Voluntary Blood Donor'}</h2>
        <p>
          {isEditing
            ? 'Keep your location and availability updated so emergency recipients and hospitals can reach you.'
            : 'Register your ABO/Rh blood group and city to join our emergency volunteer donor registry.'}
        </p>
      </div>

      <AlertBox type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
      <AlertBox type="error" message={errorMsg} onClose={() => setErrorMsg('')} />

      <div className="glass-card">
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            {/* Blood Group */}
            <div className="form-group">
              <label className="form-label" htmlFor="bloodGroup">
                Blood Group <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                className="form-control"
                value={formData.bloodGroup}
                onChange={handleChange}
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
              {fieldErrors.bloodGroup && (
                <span style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                  {fieldErrors.bloodGroup}
                </span>
              )}
            </div>

            {/* Contact Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="contactNumber">
                Contact Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                className="form-control"
                placeholder="+91 9876543210"
                value={formData.contactNumber}
                onChange={handleChange}
                style={{
                  borderColor: fieldErrors.contactNumber ? '#ef4444' : undefined,
                }}
                required
              />
              {fieldErrors.contactNumber && (
                <span style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                  {fieldErrors.contactNumber}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            {/* City */}
            <div className="form-group">
              <label className="form-label" htmlFor="city">
                City / Town <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="form-control"
                placeholder="e.g. Hyderabad"
                value={formData.city}
                onChange={handleChange}
                style={{
                  borderColor: fieldErrors.city ? '#ef4444' : undefined,
                }}
                required
              />
              {fieldErrors.city && (
                <span style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                  {fieldErrors.city}
                </span>
              )}
            </div>

            {/* Area */}
            <div className="form-group">
              <label className="form-label" htmlFor="area">
                Area / Locality
              </label>
              <input
                type="text"
                id="area"
                name="area"
                className="form-control"
                placeholder="e.g. Madhapur, Hitech City"
                value={formData.area}
                onChange={handleChange}
                style={{
                  borderColor: fieldErrors.area ? '#ef4444' : undefined,
                }}
              />
              {fieldErrors.area && (
                <span style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                  {fieldErrors.area}
                </span>
              )}
            </div>
          </div>

          {/* Last Donation Date */}
          <div className="form-group">
            <label className="form-label" htmlFor="lastDonationDate">
              Last Donation Date (Leave blank if first-time donor)
            </label>
            <input
              type="date"
              id="lastDonationDate"
              name="lastDonationDate"
              className="form-control"
              value={formData.lastDonationDate}
              max={todayStr}
              onChange={handleChange}
              style={{
                borderColor: fieldErrors.lastDonationDate ? '#ef4444' : undefined,
              }}
            />
            {fieldErrors.lastDonationDate ? (
              <span style={{ color: '#f87171', fontSize: '0.82rem', marginTop: '4px' }}>
                {fieldErrors.lastDonationDate}
              </span>
            ) : (
              <small style={{ color: '#64748b', marginTop: '4px', fontSize: '0.8rem' }}>
                * Cannot be in the future. Clinical guidelines recommend at least 90 days between donations.
              </small>
            )}
          </div>

          {/* Availability Toggle */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '16px',
              borderRadius: '8px',
              margin: '20px 0',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="donor-available-checkbox"
                name="available"
                checked={formData.available}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
              />
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Available for Emergency Blood Donations</strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                  When checked, recipients searching for matching blood in your area will be able to discover and contact you.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              id="btn-save-donor-profile"
              className="btn btn-primary"
              style={{ flex: 1, padding: '12px' }}
              disabled={submitting}
            >
              {submitting ? 'Saving to Database...' : isEditing ? 'Save Profile Changes' : 'Complete Donor Registration'}
            </button>
            <Link to="/search" className="btn btn-secondary" style={{ padding: '12px 18px' }}>
              Search Donors Directory →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
