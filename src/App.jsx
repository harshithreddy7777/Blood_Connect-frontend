import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Authenticated User Pages
import DashboardPage from './pages/DashboardPage';
import DonorProfilePage from './pages/DonorProfilePage';
import CreateRequestPage from './pages/CreateRequestPage';
import MyRequestsPage from './pages/MyRequestsPage';
import RequestDetailsPage from './pages/RequestDetailsPage';

// Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminDonorsPage from './pages/AdminDonorsPage';
import AdminRequestsPage from './pages/AdminRequestsPage';
import AdminHospitalsPage from './pages/AdminHospitalsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Public & Donor Discovery Routes */}
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Authenticated User Routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="donor/profile"
            element={
              <ProtectedRoute>
                <DonorProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/new"
            element={
              <ProtectedRoute>
                <CreateRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/my"
            element={
              <ProtectedRoute>
                <MyRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests/:id"
            element={
              <ProtectedRoute>
                <RequestDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Administrative Control Routes (Strict ROLE_ADMIN Guard) */}
          <Route
            path="admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/donors"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDonorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/requests"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/hospitals"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminHospitalsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
