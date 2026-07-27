import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import MetricCard from '../../components/dashboard/MetricCard.jsx';
import QuickActions from '../../components/dashboard/QuickActions.jsx';
import { getLeaveAnalytics } from '../../services/leaveService.js';
import { getMyPayrollHistory } from '../../services/payrollService.js';
import { getMyAttendanceHistory } from '../../services/attendanceService.js';
import { getMyComplaints } from '../../services/complaintService.js';
import { getMyProfile } from '../../services/profileService.js';
import { Card, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    leavesRemaining: 30,
    lastSalary: 'Rs. 0.00',
    attendancePercent: '100%',
    openComplaints: 0,
  });
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const leavesRes = await getLeaveAnalytics();
      const payrollRes = await getMyPayrollHistory();
      const attendanceRes = await getMyAttendanceHistory();
      const complaintsRes = await getMyComplaints();
      const profileRes = await getMyProfile();

      if (profileRes.success) {
        setProfile(profileRes.data);
      }

      let lastPay = 'Rs. 0.00';
      if (payrollRes.success && payrollRes.data.length > 0) {
        lastPay = `Rs. ${payrollRes.data[0].netSalary.toLocaleString()}`;
      }

      let remainingLeaves = 30;
      if (leavesRes.success) {
        remainingLeaves = leavesRes.data.remaining;
      }

      let attendanceRate = '100%';
      let logs = [];
      if (attendanceRes.success) {
        logs = attendanceRes.data.slice(0, 5); // last 5 logs
        const total = attendanceRes.data.length;
        if (total > 0) {
          const present = attendanceRes.data.filter((a) => a.status === 'Present' || a.status === 'Late').length;
          attendanceRate = `${Math.round((present / total) * 100)}%`;
        }
      }

      let activeComplaints = 0;
      if (complaintsRes.success) {
        activeComplaints = complaintsRes.data.filter((c) => c.status === 'Open' || c.status === 'In-Progress').length;
      }

      setMetrics({
        leavesRemaining: remainingLeaves,
        lastSalary: lastPay,
        attendancePercent: attendanceRate,
        openComplaints: activeComplaints,
      });
      setAttendanceLogs(logs);
    } catch (err) {
      console.warn('Error loading employee dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Static company announcements
  const announcements = [
    { title: 'Annual General Assembly', date: 'July 24, 2026', body: 'The annual assembly will be held at 3 PM in the grand conference hall.' },
    { title: 'New Office Policy Update', date: 'July 18, 2026', body: 'Check out the updated policies regarding work hours adjustments.' },
  ];

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="Staff Dashboard" />

      {/* Profile Header Card */}
      {profile && (
        <div className="glass-card p-4 mb-4">
          <div className="d-flex flex-column flex-md-row align-items-center gap-4">
            <div>
              {profile.documents?.profilePhoto ? (
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.documents.profilePhoto.startsWith('/') ? '' : '/'}${profile.documents.profilePhoto}`}
                  alt="Profile Avatar"
                  className="shadow"
                  style={{ width: '140px', height: '140px', objectFit: 'cover', border: '1.5px solid #000000', borderRadius: '16px' }}
                />
              ) : (
                <div
                  className="bg-secondary text-white d-flex align-items-center justify-content-center shadow"
                  style={{ width: '140px', height: '140px', fontSize: '3rem', fontWeight: 'bold', borderRadius: '16px' }}
                >
                  {profile.user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="text-center text-md-start flex-grow-1 d-flex flex-column flex-md-row justify-content-between align-items-center">
              <div>
                <h4 className="text-main font-weight-bold m-0">{profile.user?.name}</h4>
                <small className="text-primary font-weight-semibold d-block mb-2">{profile.user?.designation} — {profile.user?.department}</small>
                <div className="row g-2 text-muted" style={{ fontSize: '0.85rem' }}>
                  <div className="col-6 col-sm-3">
                    <strong>Employee ID:</strong> {profile.user?.employeeId}
                  </div>
                  <div className="col-6 col-sm-3">
                    <strong>DOB:</strong> {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="col-6 col-sm-3">
                    <strong>Blood Group:</strong> {profile.bloodGroup || 'N/A'}
                  </div>
                  <div className="col-6 col-sm-3">
                    <strong>Status:</strong> <span className="text-success font-weight-semibold text-capitalize">{profile.user?.status}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 mt-md-0">
                <Link
                  to="/idcard"
                  className="btn btn-premium d-flex align-items-center gap-2"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <i className="bi bi-credit-card-2-front-fill"></i>
                  <span>Download ID Card</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <MetricCard
            title="Attendance Rate"
            value={metrics.attendancePercent}
            icon="bi-check-all"
            color="success"
            subtitle="Ratio of Present status"
          />
        </div>
        <div className="col-md-3">
          <MetricCard
            title="Leaves Left"
            value={metrics.leavesRemaining}
            icon="bi-calendar-minus-fill"
            color="primary"
            subtitle="Of 30 allocated days"
          />
        </div>
        <div className="col-md-3">
          <MetricCard
            title="Last Payout"
            value={metrics.lastSalary}
            icon="bi-cash-stack"
            color="indigo"
            subtitle="Net monthly salary"
          />
        </div>
        <div className="col-md-3">
          <MetricCard
            title="Open Grievances"
            value={metrics.openComplaints}
            icon="bi-chat-left-text-fill"
            color="warning"
            subtitle="Unresolved complaint tickets"
          />
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side: Check In Actions */}
        <div className="col-md-4">
          <QuickActions onStatusChange={loadDashboardData} />
        </div>

        {/* Right Side: Log Hist & Announcements */}
        <div className="col-md-8 d-flex flex-column gap-4">
          {/* Recent punches */}
          <div className="glass-card p-4">
            <h5 className="text-main font-weight-bold mb-3">Recent Attendance Logs</h5>
            {attendanceLogs.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <p className="m-0">No punches found. Clock in to begin!</p>
              </div>
            ) : (
              <Table responsive className="align-middle border-0 m-0">
                <thead>
                  <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.8rem' }}>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours Worked</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map((log) => (
                    <tr key={log._id} className="border-bottom border-glass-subtle">
                      <td className="text-main font-weight-medium">
                        {new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="text-muted">
                        {new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="text-muted">
                        {log.checkOut
                          ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Active'}
                      </td>
                      <td className="text-main font-weight-semibold">{log.workingHours} hrs</td>
                      <td>
                        <Badge
                          bg={
                            log.status === 'Present'
                              ? 'success-subtle'
                              : log.status === 'Late'
                              ? 'warning-subtle'
                              : 'danger-subtle'
                          }
                          className={`text-${
                            log.status === 'Present'
                              ? 'success'
                              : log.status === 'Late'
                              ? 'warning'
                              : 'danger'
                          } font-weight-medium px-2 py-1`}
                        >
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {/* Announcements Feed */}
          <div className="glass-card p-4">
            <h5 className="text-main font-weight-bold mb-3">Company Bulletin Board</h5>
            <div className="d-flex flex-column gap-3">
              {announcements.map((ann, idx) => (
                <div key={idx} className="p-3 bg-light-subtle rounded-3 border border-glass">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="m-0 font-weight-semibold text-main">{ann.title}</h6>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{ann.date}</small>
                  </div>
                  <p className="m-0 text-muted" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {ann.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
