import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBox from '../components/AlertBox';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bloodGroup, setBloodGroup] = useState(searchParams.get('bloodGroup') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const [donors, setDonors] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchDonors = async (
    pageToFetch = page,
    bg = bloodGroup,
    c = city,
    a = area
  ) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageToFetch,
        size: pageSize,
        sortBy: 'id',
        sortDir: 'ASC',
      };
      if (bg) params.bloodGroup = bg;
      if (c && c.trim()) params.city = c.trim();
      if (a && a.trim()) params.area = a.trim();

      const res = await api.get('/donors', { params });
      if (res.data && res.data.data) {
        setDonors(res.data.data.content || []);
        setTotalElements(res.data.data.totalElements || 0);
        setTotalPages(res.data.data.totalPages || 0);
        setPage(pageToFetch);
      }
    } catch (err) {
      console.error('Failed to fetch donors:', err);
      setError('Unable to load donors. Please verify database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlBg = searchParams.get('bloodGroup') || '';
    const urlCity = searchParams.get('city') || '';
    const urlArea = searchParams.get('area') || '';
    setBloodGroup(urlBg);
    setCity(urlCity);
    setArea(urlArea);
    fetchDonors(0, urlBg, urlCity, urlArea);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const newParams = {};
    if (bloodGroup) newParams.bloodGroup = bloodGroup;
    if (city.trim()) newParams.city = city.trim();
    if (area.trim()) newParams.area = area.trim();
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setBloodGroup('');
    setCity('');
    setArea('');
    setSearchParams({});
  };

  const handleCopyContact = (id, phone) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="container" style={{ padding: '40px 24px', maxWidth: '1180px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Find Voluntary Blood Donors</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
          Search real-time registered donors filtered by ABO/Rh blood group and geographic location.
        </p>
      </div>

      {/* Filter Form Card */}
      <div className="glass-card" style={{ marginBottom: '32px', padding: '28px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Blood Group</label>
              <select
                id="search-blood-group"
                className="form-control"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">All Blood Groups</option>
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

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>City</label>
              <input
                id="search-city"
                type="text"
                className="form-control"
                placeholder="e.g. Hyderabad, Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Area / Locality (Optional)</label>
              <input
                id="search-area"
                type="text"
                className="form-control"
                placeholder="e.g. Banjara Hills, Andheri"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                id="btn-search-donors"
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <span>🔍</span> Search Donors
              </button>
              {(bloodGroup || city || area) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-secondary"
                  style={{ padding: '12px 16px' }}
                  title="Clear all filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Results Header / Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
            {loading ? 'Searching donors...' : `Found ${totalElements} Available Donor${totalElements === 1 ? '' : 's'}`}
          </h2>
          {(bloodGroup || city || area) && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {bloodGroup && (
                <span className="badge" style={{ background: 'rgba(230, 57, 70, 0.2)', color: '#ff6b6b', border: '1px solid rgba(230, 57, 70, 0.4)' }}>
                  Group: {bloodGroup}
                </span>
              )}
              {city && (
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  City: {city}
                </span>
              )}
              {area && (
                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  Area: {area}
                </span>
              )}
            </div>
          )}
        </div>

        {totalElements > 0 && (
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            Page {page + 1} of {Math.max(1, totalPages)}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div style={{ marginBottom: '24px' }}>
          <AlertBox type="error" message={error} onClose={() => setError('')} />
          <button
            onClick={() => fetchDonors(page)}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '4px' }}
          >
            ↻ Retry Search
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <LoadingSpinner message="Searching registered voluntary donors..." />
        </div>
      ) : donors.length === 0 ? (
        /* Empty results state */
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🩸</div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No Available Donors Found</h3>
          <p style={{ maxWidth: '520px', margin: '0 auto 24px', color: '#94a3b8', lineHeight: 1.6 }}>
            We couldn't find any available donors matching the selected criteria. Try selecting "All Blood Groups" or broadening your city search.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={handleResetFilters} className="btn btn-secondary">
              Reset Filters
            </button>
            <Link to="/requests/new" className="btn btn-primary">
              Post an Emergency Blood Request
            </Link>
          </div>
        </div>
      ) : (
        /* Donors Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {donors.map((donor) => (
            <div
              key={donor.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div>
                {/* Top Row: Blood Group Pill + Availability Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #e63946 0%, #b5179e 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(230, 57, 70, 0.4)',
                    }}
                  >
                    {donor.bloodGroup}
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></span>
                    Available
                  </span>
                </div>

                {/* Donor Name & Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}
                  >
                    👤
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#f8fafc' }}>
                      {donor.fullName}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      Verified Donor #{donor.id}
                    </span>
                  </div>
                </div>

                {/* Location Details */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '4px' }}>
                    <span>📍</span>
                    <strong>{donor.city}</strong>
                  </div>
                  {donor.area && (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginLeft: '24px' }}>
                      {donor.area}
                    </div>
                  )}
                </div>

                {/* Last Donation Date */}
                {donor.lastDonationDate && (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
                    <span>🕒 Last donation: </span>
                    <strong style={{ color: '#cbd5e1' }}>{donor.lastDonationDate}</strong>
                  </div>
                )}
              </div>

              {/* Bottom Action: Phone Number & Copy */}
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', display: 'flex', gap: '10px' }}>
                <a
                  href={`tel:${donor.contactNumber}`}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                >
                  <span>📞</span> Call Donor
                </a>
                <button
                  type="button"
                  onClick={() => handleCopyContact(donor.id, donor.contactNumber)}
                  className="btn btn-secondary btn-sm"
                  title="Copy Contact Number"
                >
                  {copiedId === donor.id ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '40px' }}>
          <button
            onClick={() => fetchDonors(page - 1)}
            disabled={page === 0 || loading}
            className="btn btn-secondary btn-sm"
            style={{ opacity: page === 0 ? 0.5 : 1 }}
          >
            ← Previous
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => fetchDonors(page + 1)}
            disabled={page >= totalPages - 1 || loading}
            className="btn btn-secondary btn-sm"
            style={{ opacity: page >= totalPages - 1 ? 0.5 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
