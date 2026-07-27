import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import MetricCard from '../../components/dashboard/MetricCard.jsx';
import PayrollTrendChart from '../../components/charts/PayrollTrendChart.jsx';
import AttendanceChart from '../../components/charts/AttendanceChart.jsx';
import LeaveChart from '../../components/charts/LeaveChart.jsx';
import { getAdminDashboardAnalytics, approveRejectEmployee, getEmployeeById, getEmployeesList } from '../../services/adminService.js';
import { Table, Button, Badge, Modal, Row, Col, Form, Tabs, Tab } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);

  // Modal Review States
  const [detailModal, setDetailModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDesg, setSelectedDesg] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getAdminDashboardAnalytics();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.warn('Failed to load admin analytics');
    }

    try {
      // Since analytics endpoint returns pending users stats, let's query the employee list directly with 'pending' status
      const empRes = await getEmployeesList({ status: 'pending' });
      if (empRes.success) {
        setPendingUsers(empRes.data.employees);
      }
    } catch (err) {
      console.warn('Failed to query pending registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openReviewModal = async (empId) => {
    setModalLoading(true);
    try {
      const res = await getEmployeeById(empId);
      if (res.success) {
        setSelectedEmp(res.data);
        setSelectedDept(res.data.user.department || '');
        setSelectedDesg(res.data.user.designation || '');
        setRemarks('');
        setDetailModal(true);
      }
    } catch (err) {
      toast.error('Failed to load onboarding details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleApprovalAction = async (status) => {
    if (!selectedEmp) return;

    if (status === 'active') {
      if (!selectedDept) {
        toast.error('Please assign a department');
        return;
      }
      if (!selectedDesg) {
        toast.error('Please assign a designation');
        return;
      }
    }

    try {
      const res = await approveRejectEmployee(
        selectedEmp.user._id,
        status,
        remarks || (status === 'active' ? 'Approved onboarding details' : 'Changes requested'),
        selectedDept,
        selectedDesg
      );
      if (res.success) {
        toast.success(`Employee has been ${status === 'active' ? 'Approved' : status === 'changes_requested' ? 'requested to make changes' : 'Rejected'}`);
        setDetailModal(false);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update employee status');
    }
  };

  if (loading || !analytics) {
    return (
      <div className="p-4" style={{ marginLeft: '280px' }}>
        <Navbar pageTitle="Overview Metrics" />
        <div className="row g-4 mb-4">
          <div className="col-md-3"><div className="skeleton-box" style={{ height: '120px' }}></div></div>
          <div className="col-md-3"><div className="skeleton-box" style={{ height: '120px' }}></div></div>
          <div className="col-md-3"><div className="skeleton-box" style={{ height: '120px' }}></div></div>
          <div className="col-md-3"><div className="skeleton-box" style={{ height: '120px' }}></div></div>
        </div>
        <div className="skeleton-box mt-4" style={{ height: '300px' }}></div>
      </div>
    );
  }

  const { cards, payroll, leaves, attendanceToday } = analytics;

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="HR Executive Dashboard" />

      {/* KPI Cards Grid */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <MetricCard
            title="Total Employees"
            value={cards.totalEmployees}
            icon="bi-people-fill"
            color="primary"
            subtitle="Staff headcount"
          />
        </div>
        <div className="col-md-3">
          <MetricCard
            title="Pending Approval"
            value={cards.pendingApprovals}
            icon="bi-person-fill-exclamation"
            color="warning"
            subtitle="Awaiting documents review"
          />
        </div>
        <div className="col-md-3">
          <MetricCard
            title="Pending Leaves"
            value={cards.pendingLeaves}
            icon="bi-calendar-date-fill"
            color="indigo"
            subtitle="Pending review requests"
          />
        </div>
        <div className="col-md-3">
          <MetricCard
            title="Open Complaints"
            value={cards.openComplaints}
            icon="bi-chat-right-dots-fill"
            color="danger"
            subtitle="Active unresolved tickets"
          />
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="row g-4 mb-5">
        <div className="col-lg-6">
          <PayrollTrendChart data={payroll} />
        </div>
        <div className="col-lg-3">
          <AttendanceChart data={attendanceToday} />
        </div>
        <div className="col-lg-3">
          <LeaveChart data={leaves} />
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="glass-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-main font-weight-bold m-0">Pending Approvals Queue</h5>
          <Link to="/admin/employees" className="btn btn-outline-primary btn-sm rounded-pill px-3">
            View Directory
          </Link>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-person-check-fill" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2 font-weight-medium">All registration approvals completed!</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle m-0 border-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Registered Date</th>
                <th className="text-end">Verification Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((emp) => (
                <tr key={emp._id} className="border-bottom border-glass-subtle">
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                        style={{ width: '36px', height: '36px', fontWeight: '500' }}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-weight-semibold text-main">{emp.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{emp.email}</td>
                  <td className="text-main font-weight-medium">{emp.employeeId || 'N/A'}</td>
                  <td>
                    <Badge bg="primary-subtle" className="text-primary font-weight-medium px-2 py-1">
                      {emp.department || 'Pending Assignment'}
                    </Badge>
                  </td>
                  <td className="text-muted">{new Date(emp.createdAt).toLocaleDateString()}</td>
                  <td className="text-end">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="px-3 rounded-pill"
                      disabled={modalLoading}
                      onClick={() => openReviewModal(emp._id)}
                    >
                      <i className="bi bi-eye-fill me-1"></i> Review & Verify
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Review Onboarding Modal */}
      {selectedEmp && (
        <Modal
          show={detailModal}
          onHide={() => setDetailModal(false)}
          size="lg"
          centered
          className="glass-modal"
          contentClassName="glass-card border-glass p-3"
        >
          <Modal.Header closeButton className="border-glass-subtle">
            <Modal.Title className="text-main font-weight-bold">Verify Onboarding Request</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs defaultActiveKey="general" className="mb-4 custom-tabs-border">
              {/* Section 1: Personal Details */}
              <Tab eventKey="general" title="Personal Info">
                <Row className="g-3">
                  <Col sm={4} className="text-center py-3 border-end border-glass">
                    {selectedEmp.profile?.documents?.profilePhoto ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedEmp.profile.documents.profilePhoto.startsWith('/') ? '' : '/'}${selectedEmp.profile.documents.profilePhoto}`}
                        alt="Profile Photo"
                        className="rounded-circle mb-3 shadow"
                        style={{ width: '120px', height: '120px', objectFit: 'cover', border: '3px solid var(--primary-color)' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary text-white d-inline-flex align-items-center justify-content-center mb-3 shadow"
                        style={{ width: '120px', height: '120px', fontSize: '2.5rem', fontWeight: 'bold' }}
                      >
                        {selectedEmp.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h5 className="text-main font-weight-bold m-0">{selectedEmp.user.name}</h5>
                    <small className="text-muted">Employee ID: {selectedEmp.user.employeeId}</small>
                  </Col>
                  <Col sm={8}>
                    <div className="row g-3" style={{ fontSize: '0.9rem' }}>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Email Address</strong>
                        <span className="text-main font-weight-medium">{selectedEmp.user.email}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Phone Number</strong>
                        <span className="text-main font-weight-medium">{selectedEmp.user.phone || 'N/A'}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Date of Birth</strong>
                        <span className="text-main font-weight-medium">
                          {selectedEmp.profile?.dob ? new Date(selectedEmp.profile.dob).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Blood Group</strong>
                        <span className="text-main font-weight-medium">{selectedEmp.profile?.bloodGroup || 'N/A'}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Gender</strong>
                        <span className="text-main font-weight-medium">{selectedEmp.profile?.gender || 'N/A'}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Marital Status</strong>
                        <span className="text-main font-weight-medium">{selectedEmp.profile?.maritalStatus || 'N/A'}</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Tab>

              {/* Section 2: Contact & Address */}
              <Tab eventKey="contact" title="Emergency & Address">
                <div className="p-2" style={{ fontSize: '0.9rem' }}>
                  <h6 className="text-primary font-weight-bold mb-3 border-bottom pb-2 border-glass">Current Address</h6>
                  <Row className="g-3 mb-4">
                    <Col sm={12}>
                      <strong className="text-muted d-block">Street Address</strong>
                      <span className="text-main font-weight-medium">{selectedEmp.profile?.address || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">City</strong>
                      <span className="text-main font-weight-medium">{selectedEmp.profile?.city || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">State</strong>
                      <span className="text-main font-weight-medium">{selectedEmp.profile?.state || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">Pincode</strong>
                      <span className="text-main font-weight-medium">{selectedEmp.profile?.pincode || 'N/A'}</span>
                    </Col>
                  </Row>

                  <h6 className="text-primary font-weight-bold mb-3 border-bottom pb-2 border-glass">Emergency Contact</h6>
                  <Row className="g-3">
                    <Col sm={4}>
                      <strong className="text-muted d-block">Full Name</strong>
                      <span className="text-main font-weight-medium">{selectedEmp.profile?.emergencyContact?.name || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">Relationship</strong>
                      <span className="text-main font-weight-medium">{selectedEmp.profile?.emergencyContact?.relationship || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">Phone Number</strong>
                      <span className="text-main font-weight-medium">{selectedEmp.profile?.emergencyContact?.phone || 'N/A'}</span>
                    </Col>
                  </Row>
                </div>
              </Tab>

              {/* Section 3: Document Review */}
              <Tab eventKey="documents" title="Document Uploads">
                <div className="d-flex flex-column gap-3">
                  {selectedEmp.documents?.length === 0 ? (
                    <div className="text-center py-4 text-muted">No documents uploaded</div>
                  ) : (
                    selectedEmp.documents?.map((doc) => (
                      <div key={doc._id} className="d-flex justify-content-between align-items-center p-3 bg-light-subtle rounded-3 border border-glass">
                        <div>
                          <strong className="text-main d-block">{doc.type}</strong>
                          <small className="text-muted">{doc.name}</small>
                        </div>
                        <div>
                          <a
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm rounded-pill px-3"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Tab>

              {/* Section 4: Assign Role details */}
              <Tab eventKey="assign" title="Assign Role Info">
                <div className="p-2">
                  <h6 className="text-primary font-weight-bold mb-3 border-bottom pb-2 border-glass">Department & Designation Assignment</h6>
                  <Row className="g-3">
                    <Col sm={6}>
                      <Form.Group controlId="modalDept">
                        <Form.Label className="text-muted">Department <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          className="form-control-glass form-select"
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                        >
                          <option value="">Select Department</option>
                          {['Engineering', 'Human Resources', 'IT Support', 'Marketing', 'Infrastructure & Security', 'Sales'].map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col sm={6}>
                      <Form.Group controlId="modalDesg">
                        <Form.Label className="text-muted">Designation <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          className="form-control-glass"
                          placeholder="e.g. Software Engineer"
                          value={selectedDesg}
                          onChange={(e) => setSelectedDesg(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Tab>
            </Tabs>

            {/* Remarks Input */}
            <div className="mt-3">
              <Form.Group controlId="modalRemarks">
                <Form.Label className="text-muted">Verification Comments / Remarks (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="form-control-glass"
                  placeholder="Describe reasons for rejection/changes request..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </Form.Group>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle justify-content-end gap-2">
            <Button variant="success" className="px-4" onClick={() => handleApprovalAction('active')}>
              <i className="bi bi-check-circle-fill me-1"></i> Approve Employee
            </Button>
            <Button variant="warning" className="px-4 text-dark" onClick={() => handleApprovalAction('changes_requested')}>
              <i className="bi bi-exclamation-triangle-fill me-1"></i> Request Changes
            </Button>
            <Button variant="danger" className="px-4" onClick={() => handleApprovalAction('rejected')}>
              <i className="bi bi-x-circle-fill me-1"></i> Reject
            </Button>
            <Button variant="secondary" onClick={() => setDetailModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
