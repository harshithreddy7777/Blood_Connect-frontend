import React from 'react';
import AdminDashboardPage from './AdminDashboardPage';

/**
 * Admin Donor Management Page.
 * Dedicated route: /admin/donors
 */
export default function AdminDonorsPage() {
  return <AdminDashboardPage initialTab="donors" />;
}
