import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasRole } from '../auth'
import Dashboard from '../pages/Admin/Dashboard'
import Incidents from '../pages/Admin/Incidents'
import DeviceMonitoring from '../pages/Admin/DeviceMonitoring'
import UserManagement from '../pages/Admin/UserManagement'
import GenerateReports from '../pages/Admin/GenerateReports'
import Profile from '../pages/Admin/Profile'
import ManageAndAssign from '../pages/Admin/ManageandAssign'
import Login from '../pages/Auth/Login'
import ReportIncident from '../pages/Employee/ReportIncident'
import EmployeeIncidents from '../pages/Employee/Incidents'
import EmployeeProfile from '../pages/Employee/Profile'
import ITPersonnelIncidents from '../pages/ITPersonnel/Incidents'
import ITPersonnelAssignments from '../pages/ITPersonnel/MyAssignments'
import ITPersonnelDeviceMonitoring from '../pages/ITPersonnel/DeviceMonitoring'
import ITPersonnelProfile from '../pages/ITPersonnel/Profile'
import SecretaryIncidents from '../pages/Secretary/Incidents'
import SecretaryManageAndAssign from '../pages/Secretary/ManageandAssign'
import SecretaryProfile from '../pages/Secretary/Profile'

function ProtectedRoute({ role, children }: { role: 'Administrator' | 'Employee' | 'Secretary' | 'IT Personnel'; children: ReactNode }) {
  return hasRole(role) ? children : <Navigate to="/" replace />
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute role="Administrator"><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/incidents" element={<ProtectedRoute role="Administrator"><Incidents /></ProtectedRoute>} />
        <Route path="/admin/device-monitoring" element={<ProtectedRoute role="Administrator"><DeviceMonitoring /></ProtectedRoute>} />
        <Route path="/admin/user-management" element={<ProtectedRoute role="Administrator"><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/generate-reports" element={<ProtectedRoute role="Administrator"><GenerateReports /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute role="Administrator"><Profile /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="Administrator"><Profile view="settings" /></ProtectedRoute>} />
        <Route path="/admin/manage-assign" element={<ProtectedRoute role="Administrator"><ManageAndAssign /></ProtectedRoute>} />
        <Route path="/secretary" element={<Navigate to="/secretary/incidents" replace />} />
        <Route path="/secretary/incidents" element={<ProtectedRoute role="Secretary"><SecretaryIncidents /></ProtectedRoute>} />
        <Route path="/secretary/manage-assign" element={<ProtectedRoute role="Secretary"><SecretaryManageAndAssign /></ProtectedRoute>} />
        <Route path="/secretary/profile" element={<ProtectedRoute role="Secretary"><SecretaryProfile /></ProtectedRoute>} />
        <Route path="/secretary/settings" element={<ProtectedRoute role="Secretary"><Profile audience="secretary" view="settings" /></ProtectedRoute>} />
        <Route path="/employee" element={<Navigate to="/employee/report-incident" replace />} />
        <Route path="/employee/report-incident" element={<ProtectedRoute role="Employee"><ReportIncident /></ProtectedRoute>} />
        <Route path="/employee/incidents" element={<ProtectedRoute role="Employee"><EmployeeIncidents /></ProtectedRoute>} />
        <Route path="/employee/profile" element={<ProtectedRoute role="Employee"><EmployeeProfile /></ProtectedRoute>} />
        <Route path="/employee/settings" element={<ProtectedRoute role="Employee"><Profile audience="employee" view="settings" /></ProtectedRoute>} />
        <Route path="/it" element={<Navigate to="/it/incidents" replace />} />
        <Route path="/it/incidents" element={<ProtectedRoute role="IT Personnel"><ITPersonnelIncidents /></ProtectedRoute>} />
        <Route path="/it/my-assignments" element={<ProtectedRoute role="IT Personnel"><ITPersonnelAssignments /></ProtectedRoute>} />
        <Route path="/it/device-monitoring" element={<ProtectedRoute role="IT Personnel"><ITPersonnelDeviceMonitoring /></ProtectedRoute>} />
        <Route path="/it/profile" element={<ProtectedRoute role="IT Personnel"><ITPersonnelProfile /></ProtectedRoute>} />
        <Route path="/it/settings" element={<ProtectedRoute role="IT Personnel"><Profile audience="it" view="settings" /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
