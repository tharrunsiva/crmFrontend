import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Import Layout & Pages
import Sidebar from './components/common/Sidebar.jsx';
import Login from './pages/auth/Login.jsx';
import Signup from './pages/auth/Signup.jsx';
import Onboarding from './pages/onboarding/Onboarding.jsx';
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageEmployees from './pages/admin/ManageEmployees.jsx';
import EmployeeLeaves from './pages/employee/EmployeeLeaves.jsx';
import AdminLeaves from './pages/admin/AdminLeaves.jsx';
import EmployeePermissions from './pages/employee/EmployeePermissions.jsx';
import AdminPermissions from './pages/admin/AdminPermissions.jsx';
import EmployeePayroll from './pages/employee/EmployeePayroll.jsx';
import AdminPayroll from './pages/admin/AdminPayroll.jsx';
import EmployeeComplaints from './pages/employee/EmployeeComplaints.jsx';
import AdminComplaints from './pages/admin/AdminComplaints.jsx';
import AdminAttendance from './pages/admin/AdminAttendance.jsx';
import Profile from './pages/Profile.jsx';
import IDCardPage from './pages/IDCardPage.jsx';

// Route Guard: Authentication check
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center">Loading Session...</div>;
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Route Guard: Admin check
const AdminRoute = () => {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

// Route Guard: Onboarding check for Employees
const EmployeeRoute = () => {
  const { user, logout } = useAuth();

  if (user?.role !== 'employee') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Redirect to Onboarding Wizard if not completed OR if changes are requested
  if (user?.status === 'pending_onboarding' || user?.status === 'changes_requested' || user?.onboardingStep === 0) {
    return <Navigate to="/employee/onboarding" replace />;
  }

  // Show pending approval view if completed onboarding but not approved
  if (user?.status === 'pending') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
        <div className="glass-card p-5 text-center shadow-lg" style={{ maxWidth: '500px' }}>
          <i className="bi bi-clock-history text-warning mb-4" style={{ fontSize: '3.5rem' }}></i>
          <h4 className="text-main font-weight-bold mb-3">Onboarding Submitted</h4>
          <p className="text-muted mb-4">
            Your onboarding details have been submitted successfully. Please wait for HR/Admin approval.
          </p>
          <button onClick={logout} className="btn btn-premium px-5 py-3 w-100">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

// Layout Wrapper for Private pages
const LayoutWrapper = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flexGrow: 1, backgroundColor: 'var(--bg-app)' }}>
        <Outlet />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Private Pages (Auth Protected) */}
      <Route element={<ProtectedRoute />}>
        {/* Onboarding step for employees */}
        <Route path="/employee/onboarding" element={<Onboarding />} />

        {/* Layout Wrappers */}
        <Route element={<LayoutWrapper />}>
          
          {/* Employee Routes */}
          <Route element={<EmployeeRoute />}>
            <Route path="/dashboard" element={<EmployeeDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaves" element={<EmployeeLeaves />} />
            <Route path="/permissions" element={<EmployeePermissions />} />
            <Route path="/payroll" element={<EmployeePayroll />} />
            <Route path="/complaints" element={<EmployeeComplaints />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<ManageEmployees />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/payroll" element={<AdminPayroll />} />
            <Route path="/admin/leaves" element={<AdminLeaves />} />
            <Route path="/admin/permissions" element={<AdminPermissions />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
          </Route>

          {/* Shared Routes (Both Admin and Employee) */}
          <Route path="/idcard" element={<IDCardPage />} />
        </Route>
      </Route>

      {/* Route Fallbacks */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
