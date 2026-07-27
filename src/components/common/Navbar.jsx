import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { Dropdown } from 'react-bootstrap';
import CompanyLogo from './CompanyLogo.jsx';
import { BACKEND_URL } from '../../config.js';

const Navbar = ({ pageTitle = 'Dashboard' }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div
      className="glass-card d-flex align-items-center justify-content-between p-3 mb-4 mx-4 mt-3"
      style={{
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        position: 'relative',
        zIndex: 1050,
      }}
    >
      {/* Title & Logo */}
      <div className="d-flex align-items-center gap-3">
        <CompanyLogo height={30} theme="light" />
        <div className="border-start border-glass ps-3">
          <h4 className="m-0 text-main font-weight-bold">{pageTitle}</h4>
          <small className="text-muted d-none d-md-block">
            Welcome back, {user?.name || 'User'}
          </small>
        </div>
      </div>

      {/* Action Bar */}
      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell Dropdown */}
        <Dropdown align="end">
          <Dropdown.Toggle
            variant="link"
            id="notification-dropdown"
            className="text-decoration-none border-0 p-2 shadow-none position-relative"
            style={{ color: 'var(--text-muted)' }}
          >
            <i className="bi bi-bell-fill" style={{ fontSize: '1.25rem' }}></i>
            {unreadCount > 0 && (
              <span
                className="position-absolute top-1 start-7 translate-middle badge rounded-pill bg-danger border border-white"
                style={{ fontSize: '0.65rem', padding: '0.35em 0.5em' }}
              >
                {unreadCount}
              </span>
            )}
          </Dropdown.Toggle>

          <Dropdown.Menu
            className="glass-card shadow-lg p-2 border-glass"
            style={{ 
              width: '320px', 
              borderRadius: '16px', 
              maxHeight: '400px', 
              overflowY: 'auto', 
              zIndex: 1050,
              backgroundColor: 'var(--bg-card-opaque)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none'
            }}
          >
            <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom border-glass">
              <span className="font-weight-bold text-main">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="btn btn-link p-0 text-decoration-none text-primary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Clear All
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-bell-slash" style={{ fontSize: '1.5rem' }}></i>
                <p className="m-0 mt-2" style={{ fontSize: '0.85rem' }}>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Dropdown.Item
                  key={notif._id}
                  onClick={() => !notif.isRead && markAsRead(notif._id)}
                  className={`d-flex flex-column gap-1 p-3 border-bottom border-glass text-wrap ${
                    !notif.isRead ? 'bg-light-blue' : ''
                  }`}
                  style={{
                    backgroundColor: !notif.isRead ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                    whiteSpace: 'normal',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <strong className="text-main" style={{ fontSize: '0.85rem' }}>{notif.title}</strong>
                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="m-0 text-muted" style={{ fontSize: '0.8rem' }}>
                    {notif.message}
                  </p>
                </Dropdown.Item>
              ))
            )}
          </Dropdown.Menu>
        </Dropdown>

        {/* Quick Profile Summary */}
        <div className="d-flex align-items-center gap-2 border-start border-glass ps-3">
          {user?.profilePhoto ? (
            <img
              src={`${BACKEND_URL}${user.profilePhoto.startsWith('/') ? '' : '/'}${user.profilePhoto}`}
              alt="Profile"
              className="rounded-circle object-fit-cover"
              style={{ width: '36px', height: '36px', border: '2px solid var(--border-glass)' }}
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = e.target.nextSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
            style={{ 
              width: '36px', 
              height: '36px', 
              fontSize: '0.9rem', 
              fontWeight: 'bold',
              display: user?.profilePhoto ? 'none' : 'flex'
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
