import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBox from '../components/AlertBox';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminDashboardPage({ initialTab }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from route or prop
  const getTabFromPath = () => {
    if (initialTab) return initialTab;
    const path = location.pathname;
    if (path.includes('/admin/donors')) return 'donors';
    if (path.includes('/admin/requests')) return 'requests';
    if (path.includes('/admin/hospitals')) return 'hospitals';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname, initialTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      navigate('/admin');
    } else {
      navigate(`/admin/${tab}`);
    }
  };

  // Global action feedback
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Auto-dismiss success alert after 6 seconds
  useEffect(() => {
    if (actionMsg) {
      const timer = setTimeout(() => setActionMsg(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [actionMsg]);

  // ==============================================================
  // 1. DASHBOARD SUMMARY STATE (GET /api/admin/dashboard)
  // ==============================================================
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const loadDashboardSummary = () => {
    setLoadingSummary(true);
    setSummaryError('');
    api.get('/admin/dashboard')
      .then(res => {
        if (res.data?.success) {
          setDashboardSummary(res.data.data);
        } else {
          setSummaryError(res.data?.message || 'Failed to retrieve dashboard metrics.');
        }
      })
      .catch(err => {
        setSummaryError(err.response?.data?.message || err.message || 'Unable to connect to admin dashboard service.');
      })
      .finally(() => setLoadingSummary(false));
  };

  // ==============================================================
  // 2. DONOR MANAGEMENT STATE (GET /api/admin/donors)
  // ==============================================================
  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [donorsError, setDonorsError] = useState('');
  const [donorSearch, setDonorSearch] = useState('');
  const [donorBloodGroupFilter, setDonorBloodGroupFilter] = useState('');
  const [donorAvailabilityFilter, setDonorAvailabilityFilter] = useState(''); // '' | 'true' | 'false'
  const [donorPage, setDonorPage] = useState(0);
  const DONORS_PER_PAGE = 8;

  // Selected donor for details modal
  const [selectedDonorDetails, setSelectedDonorDetails] = useState(null);
  const [showDonorDetailsModal, setShowDonorDetailsModal] = useState(false);
  const [loadingDonorDetails, setLoadingDonorDetails] = useState(false);

  // Donor edit modal state
  const [editingDonor, setEditingDonor] = useState(null);
  const [showDonorEditModal, setShowDonorEditModal] = useState(false);
  const [savingDonor, setSavingDonor] = useState(false);
  const [donorEditError, setDonorEditError] = useState('');
  const [donorEditFormData, setDonorEditFormData] = useState({
    bloodGroup: '',
    city: '',
    area: '',
    contactNumber: '',
    available: true,
    lastDonationDate: ''
  });

  // Donor deletion confirmation dialog state
  const [donorToDelete, setDonorToDelete] = useState(null);
  const [deletingDonor, setDeletingDonor] = useState(false);

  const loadDonors = () => {
    setLoadingDonors(true);
    setDonorsError('');
    api.get('/admin/donors')
      .then(res => {
        if (res.data?.success) {
          setDonors(res.data.data || []);
        } else {
          setDonorsError(res.data?.message || 'Failed to load donors directory.');
        }
      })
      .catch(err => {
        setDonorsError(err.response?.data?.message || err.message || 'Unable to connect to donor management service.');
      })
      .finally(() => setLoadingDonors(false));
  };

  // Filtered & Paginated Donors (Client-Side Search & Filter)
  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      // Search text
      if (donorSearch.trim()) {
        const query = donorSearch.toLowerCase();
        const matchesName = d.fullName?.toLowerCase().includes(query);
        const matchesEmail = d.email?.toLowerCase().includes(query);
        const matchesCity = d.city?.toLowerCase().includes(query);
        const matchesArea = d.area?.toLowerCase().includes(query);
        const matchesPhone = d.contactNumber?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesCity && !matchesArea && !matchesPhone) {
          return false;
        }
      }
      // Blood group
      if (donorBloodGroupFilter && d.bloodGroup !== donorBloodGroupFilter) {
        return false;
      }
      // Availability
      if (donorAvailabilityFilter === 'true' && !d.available) {
        return false;
      }
      if (donorAvailabilityFilter === 'false' && d.available) {
        return false;
      }
      return true;
    });
  }, [donors, donorSearch, donorBloodGroupFilter, donorAvailabilityFilter]);

  const donorTotalPages = Math.ceil(filteredDonors.length / DONORS_PER_PAGE) || 1;
  const paginatedDonors = useMemo(() => {
    const start = donorPage * DONORS_PER_PAGE;
    return filteredDonors.slice(start, start + DONORS_PER_PAGE);
  }, [filteredDonors, donorPage]);

  // Reset donor page when filters change
  useEffect(() => {
    setDonorPage(0);
  }, [donorSearch, donorBloodGroupFilter, donorAvailabilityFilter]);

  // Open Donor Details
  const handleViewDonorDetails = async (donor) => {
    setShowDonorDetailsModal(true);
    setSelectedDonorDetails(donor);
    setLoadingDonorDetails(true);
    try {
      const res = await api.get(`/admin/donors/${donor.id}`);
      if (res.data?.success) {
        setSelectedDonorDetails(res.data.data);
      }
    } catch (err) {
      console.warn('Could not refresh full donor details:', err);
    } finally {
      setLoadingDonorDetails(false);
    }
  };

  // Open Donor Edit
  const handleOpenEditDonor = (donor) => {
    setEditingDonor(donor);
    setDonorEditFormData({
      bloodGroup: donor.bloodGroup || '',
      city: donor.city || '',
      area: donor.area || '',
      contactNumber: donor.contactNumber || '',
      available: donor.available ?? true,
      lastDonationDate: donor.lastDonationDate || ''
    });
    setDonorEditError('');
    setShowDonorEditModal(true);
  };

  // Save Donor Edit
  const handleSaveDonorEdit = async (e) => {
    e.preventDefault();
    if (!editingDonor) return;
    setSavingDonor(true);
    setDonorEditError('');

    try {
      const payload = {
        bloodGroup: donorEditFormData.bloodGroup || undefined,
        city: donorEditFormData.city.trim() || undefined,
        area: donorEditFormData.area.trim() || undefined,
        contactNumber: donorEditFormData.contactNumber.trim() || undefined,
        available: donorEditFormData.available,
        lastDonationDate: donorEditFormData.lastDonationDate || null
      };

      const res = await api.put(`/admin/donors/${editingDonor.id}`, payload);
      if (res.data?.success) {
        setActionMsg(`Successfully updated donor profile for ${res.data.data?.fullName || editingDonor.fullName}.`);
        setShowDonorEditModal(false);
        setEditingDonor(null);
        loadDonors();
        loadDashboardSummary();
      }
    } catch (err) {
      setDonorEditError(err.response?.data?.message || 'Failed to update donor profile.');
    } finally {
      setSavingDonor(false);
    }
  };

  // Toggle Donor Availability
  const handleToggleAvailability = async (donor) => {
    try {
      const res = await api.put(`/admin/donors/${donor.id}`, {
        available: !donor.available
      });
      if (res.data?.success) {
        setActionMsg(`Updated availability for ${donor.fullName} to ${!donor.available ? 'Ready / Available' : 'Busy / Unavailable'}.`);
        loadDonors();
        loadDashboardSummary();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update donor availability.');
    }
  };

  // Confirm Delete Donor
  const handleConfirmDeleteDonor = async () => {
    if (!donorToDelete) return;
    setDeletingDonor(true);
    try {
      const res = await api.delete(`/admin/donors/${donorToDelete.id}`);
      if (res.data?.success) {
        setActionMsg(res.data.message || `Removed donor profile for ${donorToDelete.fullName}. User account and requests remain preserved.`);
        setDonorToDelete(null);
        loadDonors();
        loadDashboardSummary();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to remove donor profile.');
    } finally {
      setDeletingDonor(false);
    }
  };

  // ==============================================================
  // 3. BLOOD REQUEST MANAGEMENT STATE (GET /api/admin/requests)
  // ==============================================================
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestPage, setRequestPage] = useState(0);
  const [requestTotalPages, setRequestTotalPages] = useState(1);
  const [requestTotalElements, setRequestTotalElements] = useState(0);
  const REQUEST_PAGE_SIZE = 8;

  // Selected request for Inspection & Audit Modal
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [loadingRequestDetails, setLoadingRequestDetails] = useState(false);
  const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);

  // Status transition prompt modal state
  const [targetRequest, setTargetRequest] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusModalError, setStatusModalError] = useState('');

  const loadRequests = (page = 0) => {
    setLoadingRequests(true);
    setRequestsError('');

    const params = {
      page: page,
      size: REQUEST_PAGE_SIZE,
      sortBy: 'createdAt',
      sortDir: 'DESC'
    };
    if (statusFilter) params.status = statusFilter;
    if (urgencyFilter) params.urgency = urgencyFilter;
    if (bloodGroupFilter) params.bloodGroup = bloodGroupFilter;
    if (requestSearch.trim()) params.search = requestSearch.trim();

    api.get('/admin/requests', { params })
      .then(res => {
        if (res.data?.success) {
          const pagedData = res.data.data;
          setRequests(pagedData.content || []);
          setRequestPage(pagedData.pageNumber || 0);
          setRequestTotalPages(pagedData.totalPages || 1);
          setRequestTotalElements(pagedData.totalElements || 0);
        } else {
          setRequestsError(res.data?.message || 'Failed to load blood requests queue.');
        }
      })
      .catch(err => {
        setRequestsError(err.response?.data?.message || err.message || 'Unable to connect to blood request management service.');
      })
      .finally(() => setLoadingRequests(false));
  };

  useEffect(() => {
    loadRequests(0);
  }, [statusFilter, urgencyFilter, bloodGroupFilter, requestSearch]);

  // Open Full Request Inspection & Audit Modal
  const handleOpenRequestDetails = async (requestId) => {
    setShowRequestDetailsModal(true);
    setLoadingRequestDetails(true);
    try {
      const res = await api.get(`/admin/requests/${requestId}`);
      if (res.data?.success) {
        setSelectedRequestDetails(res.data.data);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to load requisition details.');
      setShowRequestDetailsModal(false);
    } finally {
      setLoadingRequestDetails(false);
    }
  };

  // Open status transition dialog
  const initiateStatusChange = (req, nextStatus) => {
    setTargetRequest(req);
    setTargetStatus(nextStatus);
    setStatusModalError('');
    if (nextStatus === 'APPROVED') {
      setStatusRemarks('Clinical requisition verified with hospital coordinator.');
    } else if (nextStatus === 'FULFILLED') {
      setStatusRemarks('Units dispensed and delivered to patient ward.');
    } else if (nextStatus === 'REJECTED') {
      setStatusRemarks('Clinical criteria or documentation requirements not met.');
    } else if (nextStatus === 'CANCELLED') {
      setStatusRemarks('Requisition cancelled by administrative order.');
    } else {
      setStatusRemarks('');
    }
  };

  // Submit status update to PATCH /api/admin/requests/{id}/status
  const confirmStatusChange = async (e) => {
    e.preventDefault();
    if (!targetRequest || !targetStatus) return;

    setUpdatingStatus(true);
    setStatusModalError('');

    try {
      const payload = {
        status: targetStatus,
        remarks: statusRemarks.trim() || undefined
      };
      const res = await api.patch(`/admin/requests/${targetRequest.id}/status`, payload);
      if (res.data?.success) {
        setActionMsg(`Successfully transitioned Request #${targetRequest.id} from ${targetRequest.status} to ${targetStatus}.`);
        setTargetRequest(null);
        setTargetStatus('');
        loadRequests(requestPage);
        loadDashboardSummary();
        // If details modal is open for this request, refresh it
        if (selectedRequestDetails && selectedRequestDetails.id === targetRequest.id) {
          handleOpenRequestDetails(targetRequest.id);
        }
      }
    } catch (err) {
      setStatusModalError(err.response?.data?.message || 'Failed to update request status. Valid transitions only.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Determine permitted status actions for a given request status
  const getPermittedTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return [
          { status: 'APPROVED', label: 'Approve Requisition', style: 'btn-success', badgeStyle: { background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)' } },
          { status: 'REJECTED', label: 'Reject', style: 'btn-danger', badgeStyle: { background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' } },
          { status: 'CANCELLED', label: 'Cancel', style: 'btn-secondary', badgeStyle: { background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.4)' } }
        ];
      case 'APPROVED':
        return [
          { status: 'FULFILLED', label: 'Mark Fulfilled ✓', style: 'btn-success', badgeStyle: { background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)' } },
          { status: 'REJECTED', label: 'Revoke / Reject', style: 'btn-danger', badgeStyle: { background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' } },
          { status: 'CANCELLED', label: 'Cancel Requisition', style: 'btn-secondary', badgeStyle: { background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.4)' } }
        ];
      case 'FULFILLED':
      case 'REJECTED':
      case 'CANCELLED':
      default:
        return []; // Terminal state
    }
  };

  // ==============================================================
  // 4. HOSPITAL MANAGEMENT STATE (GET /api/admin/hospitals)
  // ==============================================================
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [hospitalsError, setHospitalsError] = useState('');
  const [hospitalCityFilter, setHospitalCityFilter] = useState('');
  const [hospitalStatusFilter, setHospitalStatusFilter] = useState(''); // '' | 'true' | 'false'
  const [hospitalPage, setHospitalPage] = useState(0);
  const [hospitalTotalPages, setHospitalTotalPages] = useState(1);
  const [hospitalTotalElements, setHospitalTotalElements] = useState(0);
  const HOSPITAL_PAGE_SIZE = 8;

  // Hospital Modal (Create & Edit)
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalFormData, setHospitalFormData] = useState({
    name: '',
    address: '',
    city: '',
    contactNumber: '',
    active: true
  });
  const [savingHospital, setSavingHospital] = useState(false);
  const [hospitalFormError, setHospitalFormError] = useState('');

  // Hospital Deletion Confirmation Dialog
  const [hospitalToDelete, setHospitalToDelete] = useState(null);
  const [deletingHospital, setDeletingHospital] = useState(false);

  const loadHospitals = (page = 0) => {
    setLoadingHospitals(true);
    setHospitalsError('');

    const params = {
      page: page,
      size: HOSPITAL_PAGE_SIZE,
      sortBy: 'name',
      sortDir: 'ASC'
    };
    if (hospitalCityFilter.trim()) params.city = hospitalCityFilter.trim();
    if (hospitalStatusFilter) params.active = hospitalStatusFilter === 'true';

    api.get('/admin/hospitals', { params })
      .then(res => {
        if (res.data?.success) {
          const pageData = res.data.data;
          setHospitals(pageData.content || []);
          setHospitalPage(pageData.pageNumber || 0);
          setHospitalTotalPages(pageData.totalPages || 1);
          setHospitalTotalElements(pageData.totalElements || 0);
        } else {
          setHospitalsError(res.data?.message || 'Failed to load partner hospitals directory.');
        }
      })
      .catch(err => {
        setHospitalsError(err.response?.data?.message || err.message || 'Unable to connect to hospital service.');
      })
      .finally(() => setLoadingHospitals(false));
  };

  useEffect(() => {
    loadHospitals(0);
  }, [hospitalCityFilter, hospitalStatusFilter]);

  // Open Create Hospital Modal
  const openCreateHospitalModal = () => {
    setEditingHospital(null);
    setHospitalFormData({
      name: '',
      address: '',
      city: '',
      contactNumber: '',
      active: true
    });
    setHospitalFormError('');
    setShowHospitalModal(true);
  };

  // Open Edit Hospital Modal
  const openEditHospitalModal = (hospital) => {
    setEditingHospital(hospital);
    setHospitalFormData({
      name: hospital.name,
      address: hospital.address,
      city: hospital.city,
      contactNumber: hospital.contactNumber,
      active: hospital.active
    });
    setHospitalFormError('');
    setShowHospitalModal(true);
  };

  // Save Hospital (POST or PUT)
  const handleSaveHospital = async (e) => {
    e.preventDefault();
    setSavingHospital(true);
    setHospitalFormError('');

    try {
      if (editingHospital) {
        const res = await api.put(`/admin/hospitals/${editingHospital.id}`, hospitalFormData);
        if (res.data?.success) {
          setActionMsg(`Updated hospital '${res.data.data?.name || hospitalFormData.name}' successfully.`);
          setShowHospitalModal(false);
          loadHospitals(hospitalPage);
          loadDashboardSummary();
        }
      } else {
        const res = await api.post('/admin/hospitals', hospitalFormData);
        if (res.data?.success) {
          setActionMsg(`Registered partner hospital '${res.data.data?.name || hospitalFormData.name}' successfully.`);
          setShowHospitalModal(false);
          loadHospitals(0);
          loadDashboardSummary();
        }
      }
    } catch (err) {
      setHospitalFormError(err.response?.data?.message || 'Failed to save hospital details.');
    } finally {
      setSavingHospital(false);
    }
  };

  // Toggle Hospital Active/Inactive Status
  const handleToggleHospitalStatus = async (hospital) => {
    const nextActive = !hospital.active;
    try {
      const res = await api.patch(`/admin/hospitals/${hospital.id}/status?active=${nextActive}`);
      if (res.data?.success) {
        setActionMsg(res.data.message || `Hospital '${hospital.name}' status set to ${nextActive ? 'Active' : 'Inactive'}.`);
        loadHospitals(hospitalPage);
        loadDashboardSummary();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to update hospital status.');
    }
  };

  // Delete/Deactivate Hospital with safe cascade check
  const handleConfirmDeleteHospital = async () => {
    if (!hospitalToDelete) return;
    setDeletingHospital(true);
    try {
      const res = await api.delete(`/admin/hospitals/${hospitalToDelete.id}`);
      if (res.data?.success) {
        setActionMsg(res.data.message || `Hospital '${hospitalToDelete.name}' processed successfully.`);
        setHospitalToDelete(null);
        loadHospitals(hospitalPage);
        loadDashboardSummary();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Failed to process hospital deletion.');
    } finally {
      setDeletingHospital(false);
    }
  };

  // ==============================================================
  // INITIAL LIFECYCLE LOAD
  // ==============================================================
  useEffect(() => {
    loadDashboardSummary();
    loadDonors();
    loadRequests(0);
    loadHospitals(0);
  }, []);

  // UI Badges
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
    <div className="container" style={{ padding: '40px 24px', maxWidth: '1280px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span className="badge badge-warning" style={{ fontWeight: 700 }}>SYSTEM ADMINISTRATOR</span>
          <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            ROLE_ADMIN Access Verified
          </span>
        </div>
        <h2 style={{ fontSize: '1.9rem', margin: '4px 0 6px' }}>Administrative Command Console</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Real-time clinical governance, voluntary donor management, emergency triage queue, and partner hospital network.
        </p>
      </div>

      {/* Global Alerts */}
      {actionMsg && <AlertBox type="success" message={actionMsg} onClose={() => setActionMsg('')} />}
      {actionError && <AlertBox type="error" message={actionError} onClose={() => setActionError('')} />}

      {/* Global Summary Statistics KPI Strip (GET /api/admin/dashboard) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '4px', color: '#fff' }}>
            {loadingSummary ? '...' : (dashboardSummary?.totalUsers ?? '0')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Registered accounts</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Active Donors</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '4px', color: '#4ade80' }}>
            {loadingSummary ? '...' : (dashboardSummary?.activeDonorProfiles ?? donors.length)}
            <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#94a3b8', marginLeft: '6px' }}>
              ({loadingSummary ? '...' : (dashboardSummary?.availableDonors ?? donors.filter(d => d.available).length)} ready)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Voluntary donor registry</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Blood Requests</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '4px', color: '#38bdf8' }}>
            {loadingSummary ? '...' : (dashboardSummary?.totalBloodRequests ?? requestTotalElements)}
            <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#facc15', marginLeft: '6px' }}>
              ({loadingSummary ? '...' : (dashboardSummary?.pendingRequests ?? 0)} pending)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Clinical demand pipeline</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Fulfilled Requests</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '4px', color: '#34d399' }}>
            {loadingSummary ? '...' : (dashboardSummary?.fulfilledRequests ?? 0)}
            <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#38bdf8', marginLeft: '6px' }}>
              ({loadingSummary ? '...' : (dashboardSummary?.approvedRequests ?? 0)} active)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Successful blood dispensations</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Partner Hospitals</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '4px', color: '#a78bfa' }}>
            {loadingSummary ? '...' : (dashboardSummary?.totalHospitals ?? hospitalTotalElements)}
            <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#4ade80', marginLeft: '6px' }}>
              ({loadingSummary ? '...' : (dashboardSummary?.activeHospitals ?? hospitals.filter(h => h.active).length)} active)
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Accredited healthcare centers</div>
        </div>
      </div>

      {/* Permission-Aware Navigation Tab Bar */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '28px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          id="tab-overview"
          onClick={() => handleTabChange('overview')}
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ padding: '8px 18px' }}
        >
          📊 Executive Summary & Triage
        </button>
        <button
          id="tab-requests"
          onClick={() => handleTabChange('requests')}
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ padding: '8px 18px' }}
        >
          📋 Blood Requests Queue ({dashboardSummary?.totalBloodRequests ?? requestTotalElements})
        </button>
        <button
          id="tab-donors"
          onClick={() => handleTabChange('donors')}
          className={`btn ${activeTab === 'donors' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ padding: '8px 18px' }}
        >
          🩸 Donor Directory ({dashboardSummary?.totalDonors ?? donors.length})
        </button>
        <button
          id="tab-hospitals"
          onClick={() => handleTabChange('hospitals')}
          className={`btn ${activeTab === 'hospitals' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ padding: '8px 18px' }}
        >
          🏥 Partner Hospitals ({dashboardSummary?.totalHospitals ?? hospitalTotalElements})
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 0: EXECUTIVE SUMMARY & TRIAGE OVERVIEW                    */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {summaryError && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
              <AlertBox type="error" message={summaryError} />
              <button onClick={loadDashboardSummary} className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }}>
                ↻ Retry Loading Summary
              </button>
            </div>
          )}

          {/* Deep Breakdown Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {/* Card 1: Donor Registry Status */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>🩸 Voluntary Donor Metrics</h4>
                <span className="badge badge-primary">Database Aggregates</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Total Donor Records:</span>
                  <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{dashboardSummary?.totalDonors ?? donors.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Active Profiles:</span>
                  <strong style={{ color: '#38bdf8', fontSize: '1.1rem' }}>{dashboardSummary?.activeDonorProfiles ?? donors.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Ready for Immediate Donation:</span>
                  <strong style={{ color: '#4ade80', fontSize: '1.1rem' }}>
                    {dashboardSummary?.availableDonors ?? donors.filter(d => d.available).length}
                  </strong>
                </div>
              </div>
              <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                ℹ️ <em>Operational Policy:</em> Available donors are eligible voluntary donors who marked themselves ready for contact during clinical emergencies.
              </div>
              <div style={{ marginTop: '16px' }}>
                <button
                  id="btn-goto-donors"
                  onClick={() => handleTabChange('donors')}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  Manage Voluntary Donor Directory →
                </button>
              </div>
            </div>

            {/* Card 2: Request Pipeline Breakdown */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>📋 Clinical Requisition Pipeline</h4>
                <span className="badge badge-warning">Workflow States</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#facc15' }}>Pending Review</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#facc15', marginTop: '2px' }}>
                    {dashboardSummary?.pendingRequests ?? 0}
                  </div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Approved / Active</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                    {dashboardSummary?.approvedRequests ?? 0}
                  </div>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>Fulfilled ✓</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ade80', marginTop: '2px' }}>
                    {dashboardSummary?.fulfilledRequests ?? 0}
                  </div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#f87171' }}>Rejected / Cancelled</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171', marginTop: '2px' }}>
                    {(dashboardSummary?.rejectedRequests ?? 0) + (dashboardSummary?.cancelledRequests ?? 0)}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <button
                  id="btn-goto-queue"
                  onClick={() => handleTabChange('requests')}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                >
                  Open Emergency Requests Queue →
                </button>
              </div>
            </div>

            {/* Card 3: Healthcare Infrastructure */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>🏥 Partner Hospital Network</h4>
                <span className="badge" style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' }}>Clinical Centers</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Total Registered Hospitals:</span>
                  <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{dashboardSummary?.totalHospitals ?? hospitalTotalElements}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Accredited Active Centers:</span>
                  <strong style={{ color: '#4ade80', fontSize: '1.1rem' }}>{dashboardSummary?.activeHospitals ?? hospitals.filter(h => h.active).length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Deactivated / Suspended:</span>
                  <strong style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                    {Math.max(0, (dashboardSummary?.totalHospitals ?? hospitalTotalElements) - (dashboardSummary?.activeHospitals ?? 0))}
                  </strong>
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <button
                  id="btn-goto-hospitals"
                  onClick={() => handleTabChange('hospitals')}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  Manage Partner Hospitals →
                </button>
              </div>
            </div>
          </div>

          {/* Recent Emergency Blood Requests Feed (Ordered by timestamp) */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Recent Emergency Blood Requests</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  Deterministic live triage feed ordered by receipt timestamp (personal phone numbers redacted for privacy).
                </p>
              </div>
              <button
                id="btn-refresh-dashboard"
                onClick={loadDashboardSummary}
                className="btn btn-secondary btn-sm"
              >
                ↻ Refresh Feed
              </button>
            </div>

            {loadingSummary ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <LoadingSpinner />
                <p style={{ marginTop: '12px', color: '#94a3b8' }}>Loading recent emergency requisitions...</p>
              </div>
            ) : !dashboardSummary?.recentRequests || dashboardSummary.recentRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
                No clinical blood requests submitted yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 8px' }}>Requisition #</th>
                      <th style={{ padding: '12px 8px' }}>Blood Group</th>
                      <th style={{ padding: '12px 8px' }}>Units</th>
                      <th style={{ padding: '12px 8px' }}>Hospital & Location</th>
                      <th style={{ padding: '12px 8px' }}>Urgency</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px' }}>Received At</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Triage Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardSummary.recentRequests.map(req => (
                      <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                          <span style={{ color: '#38bdf8' }}>#{req.id}</span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>{req.bloodGroup}</span>
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#fff' }}>
                          {req.unitsRequired} {req.unitsRequired === 1 ? 'Unit' : 'Units'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{req.hospitalName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.hospitalCity ? `${req.hospitalCity} — ` : ''}{req.location}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {getUrgencyBadge(req.urgency)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {getStatusBadge(req.status)}
                        </td>
                        <td style={{ padding: '12px 8px', color: '#94a3b8', fontSize: '0.8rem' }}>
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              id={`btn-inspect-recent-${req.id}`}
                              onClick={() => handleOpenRequestDetails(req.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                              Inspect & Triage
                            </button>
                            <button
                              id={`btn-triage-recent-${req.id}`}
                              onClick={() => handleTabChange('requests')}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            >
                              View Queue →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: BLOOD REQUESTS MANAGEMENT QUEUE                         */}
      {/* ============================================================== */}
      {activeTab === 'requests' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Clinical Blood Requisition Queue</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                Review, triage, authorize, fulfill, or reject emergency blood allocation requests.
              </p>
            </div>
            <button
              id="btn-refresh-requests"
              onClick={() => loadRequests(requestPage)}
              className="btn btn-secondary btn-sm"
            >
              ↻ Refresh Queue
            </button>
          </div>

          {requestsError && (
            <div style={{ marginBottom: '20px' }}>
              <AlertBox type="error" message={requestsError} />
              <button onClick={() => loadRequests(0)} className="btn btn-secondary btn-sm">↻ Retry Loading</button>
            </div>
          )}

          {/* Filters Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Status Filter</label>
              <select
                id="admin-filter-status"
                className="form-control"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '6px 10px' }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved / Active</option>
                <option value="FULFILLED">Fulfilled</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Blood Group</label>
              <select
                id="admin-filter-blood-group"
                className="form-control"
                value={bloodGroupFilter}
                onChange={e => setBloodGroupFilter(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '6px 10px' }}
              >
                <option value="">All Blood Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Urgency Level</label>
              <select
                id="admin-filter-urgency"
                className="form-control"
                value={urgencyFilter}
                onChange={e => setUrgencyFilter(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '6px 10px' }}
              >
                <option value="">All Urgencies</option>
                <option value="CRITICAL">🚨 Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Search Requisition</label>
              <input
                id="admin-search-requests"
                type="text"
                className="form-control"
                placeholder="Requester, hospital, location..."
                value={requestSearch}
                onChange={e => setRequestSearch(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '6px 10px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                id="btn-reset-request-filters"
                onClick={() => {
                  setStatusFilter('');
                  setUrgencyFilter('');
                  setBloodGroupFilter('');
                  setRequestSearch('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', height: '38px' }}
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Table */}
          {loadingRequests ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '12px', color: '#94a3b8' }}>Loading requests queue...</p>
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              No clinical blood requests found matching the specified filters.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 8px' }}>Req #</th>
                      <th style={{ padding: '12px 8px' }}>Requester</th>
                      <th style={{ padding: '12px 8px' }}>Blood / Units</th>
                      <th style={{ padding: '12px 8px' }}>Hospital / Location</th>
                      <th style={{ padding: '12px 8px' }}>Urgency</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => {
                      const permittedActions = getPermittedTransitions(req.status);
                      return (
                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 700 }}>
                            <button
                              onClick={() => handleOpenRequestDetails(req.id)}
                              style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                              title="Inspect full details and audit history"
                            >
                              #{req.id}
                            </button>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{req.requesterName}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{req.requesterEmail}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>📞 {req.contactNumber}</div>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span className="badge badge-primary" style={{ fontWeight: 700 }}>{req.bloodGroup}</span>
                              <span style={{ color: '#fff', fontWeight: 600 }}>{req.unitsRequired} {req.unitsRequired === 1 ? 'Unit' : 'Units'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{req.hospitalName}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>📍 {req.location}</div>
                            {req.notes && (
                              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontStyle: 'italic', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                "{req.notes}"
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            {getUrgencyBadge(req.urgency)}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            {getStatusBadge(req.status)}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              {/* Valid Status Transition Action Buttons */}
                              {permittedActions.map(action => (
                                <button
                                  key={action.status}
                                  id={`btn-action-${req.id}-${action.status.toLowerCase()}`}
                                  onClick={() => initiateStatusChange(req, action.status)}
                                  className="btn btn-sm"
                                  style={{ ...action.badgeStyle, padding: '4px 8px', fontSize: '0.8rem' }}
                                >
                                  {action.label}
                                </button>
                              ))}

                              {/* Terminal status marker if no transitions permitted */}
                              {permittedActions.length === 0 && (
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginRight: '4px' }}>
                                  Terminal State
                                </span>
                              )}

                              {/* Detailed Inspection & Audit button */}
                              <button
                                id={`btn-inspect-req-${req.id}`}
                                onClick={() => handleOpenRequestDetails(req.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                title="Inspect clinical details, patient contacts, and complete audit history"
                              >
                                Details & Audit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {requestTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Page {requestPage + 1} of {requestTotalPages} ({requestTotalElements} total requisitions)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      id="btn-prev-requests"
                      onClick={() => loadRequests(requestPage - 1)}
                      className="btn btn-secondary btn-sm"
                      disabled={requestPage === 0}
                    >
                      ← Previous
                    </button>
                    <button
                      id="btn-next-requests"
                      onClick={() => loadRequests(requestPage + 1)}
                      className="btn btn-secondary btn-sm"
                      disabled={requestPage >= requestTotalPages - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: VOLUNTARY DONOR DIRECTORY & MANAGEMENT                  */}
      {/* ============================================================== */}
      {activeTab === 'donors' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Voluntary Donor Management Directory</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                Search, inspect, edit details, toggle availability, or safely deactivate voluntary donor accounts.
              </p>
            </div>
            <button
              id="btn-refresh-donors"
              onClick={loadDonors}
              className="btn btn-secondary btn-sm"
            >
              ↻ Refresh List
            </button>
          </div>

          {donorsError && (
            <div style={{ marginBottom: '20px' }}>
              <AlertBox type="error" message={donorsError} />
              <button onClick={loadDonors} className="btn btn-secondary btn-sm">↻ Retry Loading</button>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Search Donors
              </label>
              <input
                id="admin-search-donors"
                type="text"
                className="form-control"
                placeholder="Search by name, email, city, phone..."
                value={donorSearch}
                onChange={e => setDonorSearch(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '6px 10px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Blood Group
              </label>
              <select
                id="admin-filter-donor-blood-group"
                className="form-control"
                value={donorBloodGroupFilter}
                onChange={e => setDonorBloodGroupFilter(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '6px 10px' }}
              >
                <option value="">All Blood Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Availability Status
              </label>
              <select
                id="admin-filter-donor-availability"
                className="form-control"
                value={donorAvailabilityFilter}
                onChange={e => setDonorAvailabilityFilter(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '6px 10px' }}
              >
                <option value="">All Statuses</option>
                <option value="true">Available / Ready</option>
                <option value="false">Busy / Unavailable</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                id="btn-reset-donor-filters"
                onClick={() => {
                  setDonorSearch('');
                  setDonorBloodGroupFilter('');
                  setDonorAvailabilityFilter('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', height: '38px' }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Table */}
          {loadingDonors ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '12px', color: '#94a3b8' }}>Loading voluntary donors...</p>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🩸</div>
              No donor profiles found matching the search criteria.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 8px' }}>Donor Name</th>
                      <th style={{ padding: '12px 8px' }}>Blood Group</th>
                      <th style={{ padding: '12px 8px' }}>Location</th>
                      <th style={{ padding: '12px 8px' }}>Contact Phone</th>
                      <th style={{ padding: '12px 8px' }}>Last Donation</th>
                      <th style={{ padding: '12px 8px' }}>Availability</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDonors.map(donor => (
                      <tr key={donor.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#fff' }}>
                          <button
                            onClick={() => handleViewDonorDetails(donor)}
                            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', textAlign: 'left', fontWeight: 600, padding: 0 }}
                            title="Click to view full donor details"
                          >
                            {donor.fullName}
                          </button>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 400 }}>{donor.email}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>{donor.bloodGroup}</span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {donor.city}{donor.area ? `, ${donor.area}` : ''}
                        </td>
                        <td style={{ padding: '12px 8px', color: '#94a3b8' }}>
                          📞 {donor.contactNumber}
                        </td>
                        <td style={{ padding: '12px 8px', color: '#94a3b8' }}>
                          {donor.lastDonationDate || 'None recorded'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className={`badge ${donor.available ? 'badge-success' : 'badge-warning'}`}>
                            {donor.available ? '● Ready / Available' : '○ Busy / Unavailable'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              id={`btn-view-donor-${donor.id}`}
                              onClick={() => handleViewDonorDetails(donor)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              title="Inspect full profile details"
                            >
                              Details
                            </button>
                            <button
                              id={`btn-edit-donor-${donor.id}`}
                              onClick={() => handleOpenEditDonor(donor)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              title="Edit donor parameters"
                            >
                              Edit
                            </button>
                            <button
                              id={`btn-toggle-donor-${donor.id}`}
                              onClick={() => handleToggleAvailability(donor)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              title="Toggle available status"
                            >
                              {donor.available ? 'Mark Busy' : 'Mark Ready'}
                            </button>
                            <button
                              id={`btn-delete-donor-${donor.id}`}
                              onClick={() => setDonorToDelete(donor)}
                              className="btn btn-sm"
                              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 8px', fontSize: '0.8rem' }}
                              title="Remove donor profile while preserving user account"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Donor Pagination Controls */}
              {donorTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Page {donorPage + 1} of {donorTotalPages} ({filteredDonors.length} matching donors)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      id="btn-prev-donors"
                      onClick={() => setDonorPage(p => Math.max(0, p - 1))}
                      className="btn btn-secondary btn-sm"
                      disabled={donorPage === 0}
                    >
                      ← Previous
                    </button>
                    <button
                      id="btn-next-donors"
                      onClick={() => setDonorPage(p => Math.min(donorTotalPages - 1, p + 1))}
                      className="btn btn-secondary btn-sm"
                      disabled={donorPage >= donorTotalPages - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PARTNER HOSPITALS DIRECTORY & MANAGEMENT                */}
      {/* ============================================================== */}
      {activeTab === 'hospitals' && (
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Accredited Partner Hospital Network</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                Register, update clinical facilities, configure contact details, and toggle active status.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                id="btn-register-hospital"
                onClick={openCreateHospitalModal}
                className="btn btn-primary btn-sm"
              >
                + Register New Hospital
              </button>
              <button
                id="btn-refresh-hospitals"
                onClick={() => loadHospitals(hospitalPage)}
                className="btn btn-secondary btn-sm"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {hospitalsError && (
            <div style={{ marginBottom: '20px' }}>
              <AlertBox type="error" message={hospitalsError} />
              <button onClick={() => loadHospitals(0)} className="btn btn-secondary btn-sm">↻ Retry Loading</button>
            </div>
          )}

          {/* Filters Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Filter by City
              </label>
              <input
                id="filter-hospital-city"
                type="text"
                className="form-control"
                placeholder="Search city (e.g. Hyderabad, Secunderabad)..."
                value={hospitalCityFilter}
                onChange={e => setHospitalCityFilter(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Accreditation Status
              </label>
              <select
                id="filter-hospital-status"
                className="form-control"
                value={hospitalStatusFilter}
                onChange={e => setHospitalStatusFilter(e.target.value)}
              >
                <option value="">All Statuses (Active & Inactive)</option>
                <option value="true">Active & Accredited Only</option>
                <option value="false">Deactivated Only</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                id="btn-reset-hospital-filters"
                onClick={() => { setHospitalCityFilter(''); setHospitalStatusFilter(''); }}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', height: '38px' }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Hospitals Table */}
          {loadingHospitals ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '12px', color: '#94a3b8' }}>Loading partner hospitals...</p>
            </div>
          ) : hospitals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏥</div>
              No partner hospitals found matching criteria.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 8px' }}>Hospital Name</th>
                      <th style={{ padding: '12px 8px' }}>City</th>
                      <th style={{ padding: '12px 8px' }}>Address</th>
                      <th style={{ padding: '12px 8px' }}>Emergency Contact</th>
                      <th style={{ padding: '12px 8px' }}>Accreditation Status</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map(hosp => (
                      <tr key={hosp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#fff' }}>
                          {hosp.name}
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>Center ID #{hosp.id}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                            {hosp.city}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', color: '#cbd5e1', maxWidth: '240px' }}>
                          {hosp.address}
                        </td>
                        <td style={{ padding: '12px 8px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          📞 {hosp.contactNumber}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span
                            className="badge"
                            style={hosp.active ? {
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#4ade80',
                              border: '1px solid rgba(34, 197, 94, 0.3)'
                            } : {
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            {hosp.active ? '● Active & Accredited' : '○ Deactivated'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            id={`btn-edit-hospital-${hosp.id}`}
                            onClick={() => openEditHospitalModal(hosp)}
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '6px' }}
                          >
                            Edit
                          </button>
                          <button
                            id={`btn-toggle-hospital-${hosp.id}`}
                            onClick={() => handleToggleHospitalStatus(hosp)}
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '6px' }}
                          >
                            {hosp.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            id={`btn-delete-hospital-${hosp.id}`}
                            onClick={() => setHospitalToDelete(hosp)}
                            className="btn btn-sm"
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {hospitalTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Page {hospitalPage + 1} of {hospitalTotalPages} ({hospitalTotalElements} total hospitals)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      id="btn-prev-hospitals"
                      onClick={() => loadHospitals(hospitalPage - 1)}
                      className="btn btn-secondary btn-sm"
                      disabled={hospitalPage === 0}
                    >
                      ← Previous
                    </button>
                    <button
                      id="btn-next-hospitals"
                      onClick={() => loadHospitals(hospitalPage + 1)}
                      className="btn btn-secondary btn-sm"
                      disabled={hospitalPage >= hospitalTotalPages - 1}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: FULL REQUISITION DETAILS & AUDIT INSPECTION MODAL    */}
      {/* ============================================================== */}
      {showRequestDetailsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '780px', padding: '28px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff' }}>
                  Requisition Inspection #{selectedRequestDetails?.id}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Submitted on {selectedRequestDetails?.createdAt ? new Date(selectedRequestDetails.createdAt).toLocaleString() : '...'}
                </span>
              </div>
              <button
                id="btn-close-req-details-modal"
                onClick={() => { setShowRequestDetailsModal(false); setSelectedRequestDetails(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.6rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingRequestDetails ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <LoadingSpinner />
                <p style={{ marginTop: '10px', color: '#94a3b8' }}>Loading detailed clinical requisition...</p>
              </div>
            ) : selectedRequestDetails && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Status & Urgency Header Strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '14px 18px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Current Requisition Status: </span>
                    <span style={{ marginLeft: '8px' }}>{getStatusBadge(selectedRequestDetails.status)}</span>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Urgency: </span>
                    <span style={{ marginLeft: '8px' }}>{getUrgencyBadge(selectedRequestDetails.urgency)}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Requester Info */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <h5 style={{ margin: '0 0 10px', color: '#38bdf8', fontSize: '0.9rem' }}>👤 Requester Profile</h5>
                    <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{selectedRequestDetails.requesterName}</div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Email: {selectedRequestDetails.requesterEmail}</div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>Phone: 📞 {selectedRequestDetails.contactNumber}</div>
                  </div>

                  {/* Clinical Need */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <h5 style={{ margin: '0 0 10px', color: '#e63946', fontSize: '0.9rem' }}>🩸 Clinical Units Required</h5>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '1rem', padding: '4px 12px' }}>
                        {selectedRequestDetails.bloodGroup}
                      </span>
                      <strong style={{ fontSize: '1.2rem', color: '#fff' }}>
                        {selectedRequestDetails.unitsRequired} {selectedRequestDetails.unitsRequired === 1 ? 'Unit' : 'Units'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Hospital Information */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h5 style={{ margin: '0 0 8px', color: '#a78bfa', fontSize: '0.9rem' }}>🏥 Receiving Hospital Center</h5>
                  <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>{selectedRequestDetails.hospitalName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    {selectedRequestDetails.hospitalAddress || selectedRequestDetails.location}
                  </div>
                  {selectedRequestDetails.hospitalCity && (
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>City: {selectedRequestDetails.hospitalCity}</div>
                  )}
                  {selectedRequestDetails.notes && (
                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', fontSize: '0.85rem', fontStyle: 'italic', color: '#e2e8f0' }}>
                      Clinical Notes: "{selectedRequestDetails.notes}"
                    </div>
                  )}
                </div>

                {/* Quick Permitted Transition Actions from inside Details Modal */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h5 style={{ margin: '0 0 10px', color: '#facc15', fontSize: '0.9rem' }}>⚡ Administrative Status Transitions</h5>
                  {getPermittedTransitions(selectedRequestDetails.status).length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {getPermittedTransitions(selectedRequestDetails.status).map(action => (
                        <button
                          key={action.status}
                          id={`btn-modal-action-${action.status.toLowerCase()}`}
                          onClick={() => initiateStatusChange(selectedRequestDetails, action.status)}
                          className="btn btn-sm"
                          style={{ ...action.badgeStyle, padding: '6px 14px', fontSize: '0.85rem' }}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Requisition is in a terminal state ({selectedRequestDetails.status}). No further status transitions are permitted.
                    </div>
                  )}
                </div>

                {/* Audit History Log */}
                <div>
                  <h5 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#fff' }}>📜 Complete Status Audit Trail</h5>
                  {!selectedRequestDetails.auditTrail || selectedRequestDetails.auditTrail.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No status transitions recorded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedRequestDetails.auditTrail.map((audit, idx) => (
                        <div
                          key={audit.id || idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderLeft: '4px solid #38bdf8',
                            padding: '12px 16px',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{audit.actorRole}</span>
                              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{audit.actorEmail}</strong>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                              {new Date(audit.changedAt).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.85rem', margin: '3px 0' }}>
                            Transition: <span style={{ color: '#facc15' }}>{audit.oldStatus}</span> → <span style={{ color: '#4ade80', fontWeight: 600 }}>{audit.newStatus}</span>
                          </div>
                          {audit.remarks && (
                            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                              "{audit.remarks}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <button
                    onClick={() => { setShowRequestDetailsModal(false); setSelectedRequestDetails(null); }}
                    className="btn btn-secondary btn-sm"
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: STATUS CHANGE CONFIRMATION PROMPT                     */}
      {/* ============================================================== */}
      {targetRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.3rem', color: '#fff' }}>
              Confirm Status Transition
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
              Transition Request <strong>#{targetRequest.id}</strong> ({targetRequest.bloodGroup}, {targetRequest.unitsRequired} Units) from{' '}
              <span style={{ color: '#facc15', fontWeight: 600 }}>{targetRequest.status}</span> to{' '}
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{targetStatus}</span>.
            </p>

            {statusModalError && (
              <div style={{ marginBottom: '14px' }}>
                <AlertBox type="error" message={statusModalError} />
              </div>
            )}

            <form onSubmit={confirmStatusChange}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Administrative Justification / Audit Remarks:
                </label>
                <textarea
                  id="admin-status-remarks"
                  className="form-control"
                  rows="3"
                  placeholder="Enter clinical notes, verification details, or justification..."
                  value={statusRemarks}
                  onChange={e => setStatusRemarks(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setTargetRequest(null); setTargetStatus(''); }}
                  className="btn btn-secondary"
                  disabled={updatingStatus}
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-status-update"
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : `Confirm → ${targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DONOR DETAILS INSPECTION MODAL                        */}
      {/* ============================================================== */}
      {showDonorDetailsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '28px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>
                  Donor Profile #{selectedDonorDetails?.id}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Voluntary Donor Registry Record</span>
              </div>
              <button
                id="btn-close-donor-details"
                onClick={() => { setShowDonorDetailsModal(false); setSelectedDonorDetails(null); }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {loadingDonorDetails ? (
              <div style={{ padding: '30px', textAlign: 'center' }}>
                <LoadingSpinner />
              </div>
            ) : selectedDonorDetails && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Full Name:</span>
                  <strong style={{ color: '#fff' }}>{selectedDonorDetails.fullName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>User Account Email:</span>
                  <strong style={{ color: '#38bdf8' }}>{selectedDonorDetails.email}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Blood Group:</span>
                  <span className="badge badge-primary">{selectedDonorDetails.bloodGroup}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Location / City:</span>
                  <strong style={{ color: '#fff' }}>{selectedDonorDetails.city}{selectedDonorDetails.area ? `, ${selectedDonorDetails.area}` : ''}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Contact Phone:</span>
                  <strong style={{ color: '#4ade80' }}>📞 {selectedDonorDetails.contactNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Last Donation Date:</span>
                  <strong style={{ color: '#fff' }}>{selectedDonorDetails.lastDonationDate || 'None recorded'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Availability Status:</span>
                  <span className={`badge ${selectedDonorDetails.available ? 'badge-success' : 'badge-warning'}`}>
                    {selectedDonorDetails.available ? '● Ready / Available' : '○ Busy / Unavailable'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      setShowDonorDetailsModal(false);
                      handleOpenEditDonor(selectedDonorDetails);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Edit Profile Parameters
                  </button>
                  <button
                    onClick={() => { setShowDonorDetailsModal(false); setSelectedDonorDetails(null); }}
                    className="btn btn-secondary btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: DONOR EDIT MODAL                                      */}
      {/* ============================================================== */}
      {showDonorEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>
                Edit Donor Profile — {editingDonor?.fullName}
              </h3>
              <button
                onClick={() => setShowDonorEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {donorEditError && (
              <div style={{ marginBottom: '14px' }}>
                <AlertBox type="error" message={donorEditError} />
              </div>
            )}

            <form onSubmit={handleSaveDonorEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Blood Group</label>
                  <select
                    id="input-edit-donor-blood-group"
                    className="form-control"
                    value={donorEditFormData.bloodGroup}
                    onChange={e => setDonorEditFormData({ ...donorEditFormData, bloodGroup: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Contact Phone</label>
                  <input
                    id="input-edit-donor-phone"
                    type="text"
                    className="form-control"
                    value={donorEditFormData.contactNumber}
                    onChange={e => setDonorEditFormData({ ...donorEditFormData, contactNumber: e.target.value })}
                    maxLength={20}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>City</label>
                  <input
                    id="input-edit-donor-city"
                    type="text"
                    className="form-control"
                    value={donorEditFormData.city}
                    onChange={e => setDonorEditFormData({ ...donorEditFormData, city: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Area / Locality</label>
                  <input
                    id="input-edit-donor-area"
                    type="text"
                    className="form-control"
                    value={donorEditFormData.area}
                    onChange={e => setDonorEditFormData({ ...donorEditFormData, area: e.target.value })}
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Last Donation Date</label>
                <input
                  id="input-edit-donor-date"
                  type="date"
                  className="form-control"
                  value={donorEditFormData.lastDonationDate || ''}
                  onChange={e => setDonorEditFormData({ ...donorEditFormData, lastDonationDate: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  id="input-edit-donor-available"
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#e63946', cursor: 'pointer' }}
                  checked={donorEditFormData.available}
                  onChange={e => setDonorEditFormData({ ...donorEditFormData, available: e.target.checked })}
                />
                <label htmlFor="input-edit-donor-available" style={{ fontSize: '0.9rem', color: '#cbd5e1', cursor: 'pointer', margin: 0 }}>
                  Mark as Available & Ready for Immediate Donation
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowDonorEditModal(false)}
                  className="btn btn-secondary"
                  disabled={savingDonor}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-edit-donor"
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingDonor}
                >
                  {savingDonor ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: REGISTER / EDIT PARTNER HOSPITAL MODAL                */}
      {/* ============================================================== */}
      {showHospitalModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '28px', background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>
                {editingHospital ? `Edit Hospital #${editingHospital.id}` : 'Register New Partner Hospital'}
              </h3>
              <button
                id="btn-close-hospital-modal"
                onClick={() => setShowHospitalModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {hospitalFormError && (
              <div style={{ marginBottom: '14px' }}>
                <AlertBox type="error" message={hospitalFormError} />
              </div>
            )}

            <form onSubmit={handleSaveHospital}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Hospital Name *
                </label>
                <input
                  id="input-hospital-name"
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Apollo Multi-Speciality Hospital"
                  value={hospitalFormData.name}
                  onChange={e => setHospitalFormData({ ...hospitalFormData, name: e.target.value })}
                  minLength={2}
                  maxLength={150}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    City *
                  </label>
                  <input
                    id="input-hospital-city"
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Hyderabad"
                    value={hospitalFormData.city}
                    onChange={e => setHospitalFormData({ ...hospitalFormData, city: e.target.value })}
                    minLength={2}
                    maxLength={100}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Emergency Contact Phone *
                  </label>
                  <input
                    id="input-hospital-contact"
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. +91-40-23607777"
                    value={hospitalFormData.contactNumber}
                    onChange={e => setHospitalFormData({ ...hospitalFormData, contactNumber: e.target.value })}
                    minLength={7}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Complete Street Address *
                </label>
                <textarea
                  id="input-hospital-address"
                  required
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Jubilee Hills Road No 72, Film Nagar"
                  value={hospitalFormData.address}
                  onChange={e => setHospitalFormData({ ...hospitalFormData, address: e.target.value })}
                  minLength={3}
                  maxLength={255}
                />
              </div>

              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  id="input-hospital-active"
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#e63946', cursor: 'pointer' }}
                  checked={hospitalFormData.active}
                  onChange={e => setHospitalFormData({ ...hospitalFormData, active: e.target.checked })}
                />
                <label htmlFor="input-hospital-active" style={{ fontSize: '0.9rem', color: '#cbd5e1', cursor: 'pointer', margin: 0 }}>
                  Accredited & Active for Emergency Blood Requests
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  id="btn-cancel-hospital"
                  type="button"
                  onClick={() => setShowHospitalModal(false)}
                  className="btn btn-secondary"
                  disabled={savingHospital}
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-hospital"
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingHospital}
                >
                  {savingHospital ? 'Saving...' : editingHospital ? 'Update Hospital' : 'Register Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DIALOG 1: DONOR REMOVAL CONFIRMATION DIALOG                    */}
      {/* ============================================================== */}
      <ConfirmDialog
        isOpen={Boolean(donorToDelete)}
        title="Remove Voluntary Donor Profile"
        message={`Are you sure you want to remove the donor profile for "${donorToDelete?.fullName}" (${donorToDelete?.bloodGroup})?

Note: In accordance with Rule 8 data protection, their user authentication account and any historical clinical blood requests will remain completely intact.`}
        confirmLabel="Remove Profile"
        cancelLabel="Keep Profile"
        isDanger={true}
        loading={deletingDonor}
        onConfirm={handleConfirmDeleteDonor}
        onCancel={() => setDonorToDelete(null)}
      />

      {/* ============================================================== */}
      {/* DIALOG 2: HOSPITAL DELETION CONFIRMATION DIALOG                */}
      {/* ============================================================== */}
      <ConfirmDialog
        isOpen={Boolean(hospitalToDelete)}
        title="Delete Partner Hospital"
        message={`Are you sure you want to delete "${hospitalToDelete?.name}"?

Clinical Safety Rule: If historical blood requests reference this hospital, the system will automatically deactivate it rather than break foreign key clinical history.`}
        confirmLabel="Delete / Deactivate"
        cancelLabel="Cancel"
        isDanger={true}
        loading={deletingHospital}
        onConfirm={handleConfirmDeleteHospital}
        onCancel={() => setHospitalToDelete(null)}
      />
    </div>
  );
}
