import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { hasRole, initializeAuthSession, revalidateAuthSession, } from '../auth';
const Dashboard = lazy(() => import('../pages/Admin/Dashboard'));
const Incidents = lazy(() => import('../pages/Admin/Incidents'));
const DeviceMonitoring = lazy(() => import('../pages/Admin/DeviceMonitoring'));
const UserManagement = lazy(() => import('../pages/Admin/UserManagement'));
const GenerateReports = lazy(() => import('../pages/Admin/GenerateReports'));
const Profile = lazy(() => import('../pages/Admin/Profile'));
const ManageAndAssign = lazy(() => import('../pages/Admin/ManageandAssign'));
const Login = lazy(() => import('../pages/Auth/Login'));
const ReportIncident = lazy(() => import('../pages/Employee/ReportIncident'));
const EmployeeIncidents = lazy(() => import('../pages/Employee/Incidents'));
const EmployeeProfile = lazy(() => import('../pages/Employee/Profile'));
const ITPersonnelIncidents = lazy(() => import('../pages/ITPersonnel/Incidents'));
const ITPersonnelAssignments = lazy(() => import('../pages/ITPersonnel/MyAssignments'));
const ITPersonnelDeviceMonitoring = lazy(() => import('../pages/ITPersonnel/DeviceMonitoring'));
const ITPersonnelProfile = lazy(() => import('../pages/ITPersonnel/Profile'));
const SecretaryIncidents = lazy(() => import('../pages/Secretary/Incidents'));
const SecretaryManageAndAssign = lazy(() => import('../pages/Secretary/ManageandAssign'));
const SecretaryProfile = lazy(() => import('../pages/Secretary/Profile'));
function ProtectedRoute({ role, children, }) {
    return hasRole(role) ? children : _jsx(Navigate, { to: "/", replace: true });
}
function AppRouter() {
    const [authReady, setAuthReady] = useState(false);
    const [, setAuthSession] = useState(null);
    useEffect(() => {
        let active = true;
        void initializeAuthSession().then(session => {
            if (active) {
                setAuthSession(session);
                setAuthReady(true);
            }
        });
        const validationTimer = window.setInterval(() => {
            void revalidateAuthSession()
                .then(session => {
                if (active)
                    setAuthSession(session);
            })
                .catch(error => {
                console.error('Session revalidation error:', error);
            });
        }, 5 * 60 * 1000);
        return () => {
            active = false;
            window.clearInterval(validationTimer);
        };
    }, []);
    if (!authReady) {
        return _jsx("main", { role: "status", "aria-live": "polite", children: "Checking login session..." });
    }
    return (_jsx(BrowserRouter, { children: _jsx(Suspense, { fallback: _jsx("main", { role: "status", "aria-live": "polite", children: "Loading page..." }), children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Login, {}) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/admin/incidents", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(Incidents, {}) }) }), _jsx(Route, { path: "/admin/device-monitoring", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(DeviceMonitoring, {}) }) }), _jsx(Route, { path: "/admin/user-management", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(UserManagement, {}) }) }), _jsx(Route, { path: "/admin/generate-reports", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(GenerateReports, {}) }) }), _jsx(Route, { path: "/admin/profile", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(Profile, {}) }) }), _jsx(Route, { path: "/admin/settings", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(Profile, { view: "settings" }) }) }), _jsx(Route, { path: "/admin/manage-assign", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(ManageAndAssign, {}) }) }), _jsx(Route, { path: "/admin/my-assignments", element: _jsx(ProtectedRoute, { role: "Administrator", children: _jsx(ITPersonnelAssignments, { audience: "administrator" }) }) }), _jsx(Route, { path: "/secretary", element: _jsx(Navigate, { to: "/secretary/incidents", replace: true }) }), _jsx(Route, { path: "/secretary/incidents", element: _jsx(ProtectedRoute, { role: "Secretary", children: _jsx(SecretaryIncidents, {}) }) }), _jsx(Route, { path: "/secretary/manage-assign", element: _jsx(ProtectedRoute, { role: "Secretary", children: _jsx(SecretaryManageAndAssign, {}) }) }), _jsx(Route, { path: "/secretary/profile", element: _jsx(ProtectedRoute, { role: "Secretary", children: _jsx(SecretaryProfile, {}) }) }), _jsx(Route, { path: "/secretary/settings", element: _jsx(ProtectedRoute, { role: "Secretary", children: _jsx(Profile, { audience: "secretary", view: "settings" }) }) }), _jsx(Route, { path: "/employee", element: _jsx(Navigate, { to: "/employee/report-incident", replace: true }) }), _jsx(Route, { path: "/employee/report-incident", element: _jsx(ProtectedRoute, { role: "Employee", children: _jsx(ReportIncident, {}) }) }), _jsx(Route, { path: "/employee/incidents", element: _jsx(ProtectedRoute, { role: "Employee", children: _jsx(EmployeeIncidents, {}) }) }), _jsx(Route, { path: "/employee/profile", element: _jsx(ProtectedRoute, { role: "Employee", children: _jsx(EmployeeProfile, {}) }) }), _jsx(Route, { path: "/employee/settings", element: _jsx(ProtectedRoute, { role: "Employee", children: _jsx(Profile, { audience: "employee", view: "settings" }) }) }), _jsx(Route, { path: "/it", element: _jsx(Navigate, { to: "/it/incidents", replace: true }) }), _jsx(Route, { path: "/it/incidents", element: _jsx(ProtectedRoute, { role: "IT Personnel", children: _jsx(ITPersonnelIncidents, {}) }) }), _jsx(Route, { path: "/it/my-assignments", element: _jsx(ProtectedRoute, { role: "IT Personnel", children: _jsx(ITPersonnelAssignments, {}) }) }), _jsx(Route, { path: "/it/device-monitoring", element: _jsx(ProtectedRoute, { role: "IT Personnel", children: _jsx(ITPersonnelDeviceMonitoring, {}) }) }), _jsx(Route, { path: "/it/profile", element: _jsx(ProtectedRoute, { role: "IT Personnel", children: _jsx(ITPersonnelProfile, {}) }) }), _jsx(Route, { path: "/it/settings", element: _jsx(ProtectedRoute, { role: "IT Personnel", children: _jsx(Profile, { audience: "it", view: "settings" }) }) })] }) }) }));
}
export default AppRouter;
