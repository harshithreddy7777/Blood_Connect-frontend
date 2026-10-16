import React from 'react';
import AdminDashboardPage from './AdminDashboardPage';

/**
 * Admin Hospital Management Page.
 * Dedicated route: /admin/hospitals
 */
export default function AdminHospitalsPage() {
  return <AdminDashboardPage initialTab="hospitals" />;
}
