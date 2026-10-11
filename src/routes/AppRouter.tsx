import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'

import {
  hasRole,
  initializeAuthSession,
  revalidateAuthSession,
  type AuthSession,
} from '../auth'

const Dashboard = lazy(() => import('../pages/Admin/Dashboard'))
const Incidents = lazy(() => import('../pages/Admin/Incidents'))
const DeviceMonitoring = lazy(() => import('../pages/Admin/DeviceMonitoring'))
const UserManagement = lazy(() => import('../pages/Admin/UserManagement'))
const GenerateReports = lazy(() => import('../pages/Admin/GenerateReports'))
const Profile = lazy(() => import('../pages/Admin/Profile'))
const ManageAndAssign = lazy(() => import('../pages/Admin/ManageandAssign'))

const Login = lazy(() => import('../pages/Auth/Login'))

const ReportIncident = lazy(() => import('../pages/Employee/ReportIncident'))
const EmployeeIncidents = lazy(() => import('../pages/Employee/Incidents'))
const EmployeeProfile = lazy(() => import('../pages/Employee/Profile'))

const ITPersonnelIncidents = lazy(() => import('../pages/ITPersonnel/Incidents'))
const ITPersonnelAssignments = lazy(() => import('../pages/ITPersonnel/MyAssignments'))
const ITPersonnelDeviceMonitoring = lazy(() => import('../pages/ITPersonnel/DeviceMonitoring'))
const ITPersonnelProfile = lazy(() => import('../pages/ITPersonnel/Profile'))

const SecretaryIncidents = lazy(() => import('../pages/Secretary/Incidents'))
const SecretaryManageAndAssign = lazy(() => import('../pages/Secretary/ManageandAssign'))
const SecretaryProfile = lazy(() => import('../pages/Secretary/Profile'))

function ProtectedRoute({
  role,
  children,
}: {
  role: 'Administrator' | 'Employee' | 'Secretary' | 'IT Personnel'
  children: ReactNode
}) {
  return hasRole(role) ? children : <Navigate to="/" replace />
}

function AppRouter() {
  const [authReady, setAuthReady] = useState(false)
  const [, setAuthSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    let active = true
    void initializeAuthSession().then(session => {
      if (active) {
        setAuthSession(session)
        setAuthReady(true)
      }
    })

    const validationTimer = window.setInterval(() => {
      void revalidateAuthSession()
        .then(session => {
          if (active) setAuthSession(session)
        })
        .catch(error => {
          console.error('Session revalidation error:', error)
        })
    }, 5 * 60 * 1000)

    return () => {
      active = false
      window.clearInterval(validationTimer)
    }
  }, [])

  if (!authReady) {
    return <main role="status" aria-live="polite">Checking login session...</main>
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<main role="status" aria-live="polite">Loading page...</main>}>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="Administrator">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/incidents"
          element={
            <ProtectedRoute role="Administrator">
              <Incidents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/device-monitoring"
          element={
            <ProtectedRoute role="Administrator">
              <DeviceMonitoring />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/user-management"
          element={
            <ProtectedRoute role="Administrator">
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/generate-reports"
          element={
            <ProtectedRoute role="Administrator">
              <GenerateReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute role="Administrator">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute role="Administrator">
              <Profile view="settings" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/manage-assign"
          element={
            <ProtectedRoute role="Administrator">
              <ManageAndAssign />
            </ProtectedRoute>
          }
        />

        <Route
          path="/secretary"
          element={
            <Navigate to="/secretary/incidents" replace />
          }
        />

        <Route
          path="/secretary/incidents"
          element={
            <ProtectedRoute role="Secretary">
              <SecretaryIncidents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/secretary/manage-assign"
          element={
            <ProtectedRoute role="Secretary">
              <SecretaryManageAndAssign />
            </ProtectedRoute>
          }
        />

        <Route
          path="/secretary/profile"
          element={
            <ProtectedRoute role="Secretary">
              <SecretaryProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/secretary/settings"
          element={
            <ProtectedRoute role="Secretary">
              <Profile
                audience="secretary"
                view="settings"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee"
          element={
            <Navigate
              to="/employee/report-incident"
              replace
            />
          }
        />

        <Route
          path="/employee/report-incident"
          element={
            <ProtectedRoute role="Employee">
              <ReportIncident />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/incidents"
          element={
            <ProtectedRoute role="Employee">
              <EmployeeIncidents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute role="Employee">
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/settings"
          element={
            <ProtectedRoute role="Employee">
              <Profile
                audience="employee"
                view="settings"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/it"
          element={
            <Navigate
              to="/it/incidents"
              replace
            />
          }
        />

        <Route
          path="/it/incidents"
          element={
            <ProtectedRoute role="IT Personnel">
              <ITPersonnelIncidents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/it/my-assignments"
          element={
            <ProtectedRoute role="IT Personnel">
              <ITPersonnelAssignments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/it/device-monitoring"
          element={
            <ProtectedRoute role="IT Personnel">
              <ITPersonnelDeviceMonitoring />
            </ProtectedRoute>
          }
        />

        <Route
          path="/it/profile"
          element={
            <ProtectedRoute role="IT Personnel">
              <ITPersonnelProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/it/settings"
          element={
            <ProtectedRoute role="IT Personnel">
              <Profile
                audience="it"
                view="settings"
              />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default AppRouter
