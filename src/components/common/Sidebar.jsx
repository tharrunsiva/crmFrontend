import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { motion } from 'framer-motion';
import CompanyLogo from './CompanyLogo.jsx';

const Sidebar = () => {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const isAdmin = user.role === 'admin';

  // Navigation structures
  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
    { path: '/admin/employees', label: 'Manage Employees', icon: 'bi-people-fill' },
    { path: '/admin/attendance', label: 'Attendance', icon: 'bi-calendar-check-fill' },
    { path: '/admin/payroll', label: 'Payroll', icon: 'bi-cash-coin' },
    { path: '/admin/leaves', label: 'Leave Requests', icon: 'bi-calendar-range-fill' },
    { path: '/admin/permissions', label: 'Permissions', icon: 'bi-shield-check' },
    { path: '/admin/complaints', label: 'Complaints', icon: 'bi-exclamation-triangle-fill' },
    { path: '/idcard', label: 'ID Cards', icon: 'bi-person-badge-fill' },
  ];

  const employeeLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-house-heart-fill' },
    { path: '/profile', label: 'My Profile', icon: 'bi-person-bounding-box' },
    { path: '/leaves', label: 'Leave Request', icon: 'bi-calendar-plus-fill' },
    { path: '/permissions', label: 'Permission Request', icon: 'bi-clock-history' },
    { path: '/payroll', label: 'Payslip History', icon: 'bi-file-earmark-pdf-fill' },
    { path: '/complaints', label: 'Complaints Box', icon: 'bi-chat-left-text-fill' },
    { path: '/idcard', label: 'Download ID Card', icon: 'bi-credit-card-2-front-fill' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-sidebar d-flex flex-column h-100 p-4 position-fixed"
      style={{ width: '280px', top: 0, left: 0 }}
    >
      {/* Brand Header */}
      <div className="d-flex align-items-center justify-content-center w-100 mb-5 mt-2">
        <CompanyLogo height={46} theme="dark" />
      </div>

      {/* Nav List */}
      <div className="flex-grow-1 overflow-auto d-flex flex-column gap-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? 'nav-link-custom active' : 'nav-link-custom'
            }
          >
            <i className={`bi ${link.icon}`} style={{ fontSize: '1.1rem' }}></i>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Profile Details & Logout */}
      <div className="pt-4 border-top border-glass mt-auto d-flex flex-column gap-3">
        <div className="d-flex align-items-center gap-3">
          {user?.profilePhoto ? (
            <img
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:https://crmbackend-nq36.onrender.com'}${user.profilePhoto.startsWith('/') ? '' : '/'}${user.profilePhoto}`}
              alt="Profile"
              className="rounded-circle object-fit-cover"
              style={{ width: '44px', height: '44px', border: '2px solid var(--border-glass)' }}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.nextSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
            style={{ 
              width: '44px', 
              height: '44px', 
              fontWeight: '600',
              display: user?.profilePhoto ? 'none' : 'flex'
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h6 className="m-0 text-truncate text-main" style={{ fontSize: '0.95rem' }}>
              {user.name}
            </h6>
            <small className="text-muted text-capitalize d-block text-truncate">
              {user.role} | {user.employeeId || user.hrId || 'Staff'}
            </small>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
          style={{ borderRadius: '12px', padding: '10px' }}
        >
          <i className="bi bi-box-arrow-left"></i>
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
