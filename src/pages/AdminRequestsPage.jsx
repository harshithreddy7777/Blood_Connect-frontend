import React from 'react';
import AdminDashboardPage from './AdminDashboardPage';

/**
 * Admin Request Management Page.
 * Dedicated route: /admin/requests
 */
export default function AdminRequestsPage() {
  return <AdminDashboardPage initialTab="requests" />;
}
