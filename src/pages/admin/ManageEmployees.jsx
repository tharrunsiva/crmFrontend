import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { useNavigate } from 'react-router-dom';
import {
  getEmployeesList,
  getEmployeeById,
  approveRejectEmployee,
  toggleEmployeeStatus,
  resetEmployeePasswordAdmin,
  bulkActionEmployees,
} from '../../services/adminService.js';
import { Table, Form, Button, Row, Col, Badge, Modal, Tabs, Tab } from 'react-bootstrap';
import toast from 'react-hot-toast';

const ManageEmployees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 10 });
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modal states
  const [detailModal, setDetailModal] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [resetPassModal, setResetPassModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [targetResetUser, setTargetResetUser] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { search, department, status, page, limit: 10 };
      const res = await getEmployeesList(filters);
      if (res.success) {
        setEmployees(res.data.employees);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load employee list');
    } finally {
      setLoading(false);
    }
  }, [search, department, status, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Bulk selectors
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(employees.map((emp) => emp._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const triggerBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      toast.error('No employees selected');
      return;
    }
    const confirm = window.confirm(`Are you sure you want to perform "${action}" on ${selectedIds.length} employees?`);
    if (!confirm) return;

    try {
      const res = await bulkActionEmployees(selectedIds, action);
      if (res.success) {
        toast.success(res.message);
        setSelectedIds([]);
        fetchList();
      }
    } catch (err) {
      toast.error('Bulk operations failed');
    }
  };

  // Inspect details
  const viewEmployeeDetails = async (id) => {
    try {
      const res = await getEmployeeById(id);
      if (res.success) {
        setSelectedEmployeeData(res.data);
        setDetailModal(true);
      }
    } catch (err) {
      toast.error('Failed to fetch detailed records');
    }
  };

  // Individual approvals
  const handleApproval = async (id, approvalStatus) => {
    const remarks = window.prompt(`Enter remarks for ${approvalStatus === 'active' ? 'Approval' : 'Rejection'}:`, '');
    if (remarks === null) return; // cancelled
    try {
      const res = await approveRejectEmployee(id, approvalStatus, remarks);
      if (res.success) {
        toast.success(`Employee account status set to ${approvalStatus}`);
        setDetailModal(false);
        fetchList();
      }
    } catch (err) {
      toast.error('Status change error');
    }
  };

  // Toggle account activation
  const handleToggleActive = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    const confirm = window.confirm(`Deactivate or Activate employee? Set status to ${nextStatus}?`);
    if (!confirm) return;

    try {
      const res = await toggleEmployeeStatus(id, nextStatus);
      if (res.success) {
        toast.success(`Account has been ${nextStatus}`);
        setDetailModal(false);
        fetchList();
      }
    } catch (err) {
      toast.error('Toggle failed');
    }
  };

  // Password reset override
  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await resetEmployeePasswordAdmin(targetResetUser, newPassword);
      if (res.success) {
        toast.success('Password updated successfully');
        setResetPassModal(false);
        setNewPassword('');
      }
    } catch (err) {
      toast.error('Password override failed');
    }
  };

  // CSV Export utility
  const handleCSVExport = () => {
    const headers = ['Employee ID', 'Full Name', 'Email', 'Phone', 'Department', 'Designation', 'Joining Date', 'Status'];
    const rows = employees.map((emp) => [
      emp.employeeId || 'N/A',
      emp.name,
      emp.email,
      emp.phone || 'N/A',
      emp.department,
      emp.designation,
      new Date(emp.joinDate).toLocaleDateString(),
      emp.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departments = ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Operations', 'Sales'];

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="Manage Employees" />

      {/* Query Filters */}
      <div className="glass-card p-4 mb-4">
        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Group controlId="search">
              <Form.Label className="text-muted">Search Employees</Form.Label>
              <Form.Control
                type="text"
                className="form-control-glass"
                placeholder="Name, Email, or Employee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="department">
              <Form.Label className="text-muted">Department</Form.Label>
              <Form.Select
                className="form-control-glass form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="status">
              <Form.Label className="text-muted">Account Status</Form.Label>
              <Form.Select
                className="form-control-glass form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="deactivated">Deactivated</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Button onClick={handleCSVExport} className="btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-file-earmark-spreadsheet-fill"></i>
              <span>Export CSV</span>
            </Button>
          </Col>
        </Row>
      </div>

      {/* Bulk Operations Bar */}
      {selectedIds.length > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-4 p-3 rounded-3" style={{ border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <span><strong>{selectedIds.length}</strong> employees selected</span>
          <div className="d-flex gap-2">
            <Button size="sm" variant="success" onClick={() => triggerBulkAction('approve')}>
              Bulk Approve
            </Button>
            <Button size="sm" variant="warning" onClick={() => triggerBulkAction('reject')}>
              Bulk Reject
            </Button>
            <Button size="sm" variant="danger" onClick={() => triggerBulkAction('delete')}>
              Bulk Delete
            </Button>
          </div>
        </div>
      )}

      {/* Data Grid Table */}
      <div className="glass-card p-4">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2">Retrieving records...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people" style={{ fontSize: '2.5rem' }}></i>
            <p className="m-0 mt-3 font-weight-medium">No employee records match the filters</p>
          </div>
        ) : (
          <>
            <Table responsive hover className="align-middle m-0 border-0">
              <thead>
                <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                  <th style={{ width: '40px' }}>
                    <Form.Check
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === employees.length && employees.length > 0}
                    />
                  </th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Register Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id} className="border-bottom border-glass-subtle">
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selectedIds.includes(emp._id)}
                        onChange={(e) => handleSelectOne(e, emp._id)}
                      />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {emp.documents?.profilePhoto ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:https://crmbackend-nq36.onrender.com'}${emp.documents.profilePhoto.startsWith('/') ? '' : '/'}${emp.documents.profilePhoto}`}
                            alt="Avatar"
                            className="rounded-circle shadow-sm"
                            style={{ width: '36px', height: '36px', objectFit: 'cover', border: '1.5px solid var(--primary-color)' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                            style={{ width: '36px', height: '36px', fontWeight: '500' }}
                          >
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-weight-semibold text-main d-block">{emp.name}</span>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{emp.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-main font-weight-medium">{emp.employeeId || 'N/A'}</td>
                    <td>
                      <Badge bg="primary-subtle" className="text-primary font-weight-semibold">
                        {emp.department}
                      </Badge>
                    </td>
                    <td className="text-muted">{emp.designation}</td>
                    <td>
                      <Badge
                        bg={
                          emp.status === 'active'
                            ? 'success'
                            : emp.status === 'pending'
                            ? 'warning'
                            : emp.status === 'rejected'
                            ? 'danger'
                            : 'secondary'
                        }
                        className="text-white font-weight-medium px-2 py-1"
                      >
                        {emp.status === 'active' ? 'Active' : emp.status === 'pending' ? 'Pending' : emp.status === 'rejected' ? 'Rejected' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="text-muted">{new Date(emp.joinDate).toLocaleDateString()}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="rounded-pill px-3"
                        onClick={() => viewEmployeeDetails(emp._id)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4">
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Showing Page {page} of {pagination.pages}
                </span>
                <div className="d-inline-flex gap-2">
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    disabled={page === pagination.pages}
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details View Modal */}
      {selectedEmployeeData && (
        <Modal
          show={detailModal}
          onHide={() => setDetailModal(false)}
          size="lg"
          centered
          className="glass-modal"
          contentClassName="glass-card border-glass p-3"
        >
          <Modal.Header closeButton className="border-glass-subtle">
            <Modal.Title className="text-main font-weight-bold">Employee Full Record</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Tabs defaultActiveKey="general" className="mb-4 custom-tabs-border">
              {/* Section 1: Name Details */}
              <Tab eventKey="general" title="Name Details">
                <Row className="g-3">
                  <Col sm={4} className="text-center py-3 border-end border-glass">
                    {selectedEmployeeData.profile?.documents?.profilePhoto ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:https://crmbackend-nq36.onrender.com'}${selectedEmployeeData.profile.documents.profilePhoto.startsWith('/') ? '' : '/'}${selectedEmployeeData.profile.documents.profilePhoto}`}
                        alt="Profile Photo"
                        className="mb-3 shadow"
                        style={{ width: '130px', height: '155px', objectFit: 'cover', border: '1.5px solid #000000', borderRadius: '16px' }}
                      />
                    ) : (
                      <div
                        className="bg-secondary text-white d-inline-flex align-items-center justify-content-center mb-3 shadow"
                        style={{ width: '130px', height: '155px', fontSize: '3rem', fontWeight: 'bold', border: '1.5px solid #000000', borderRadius: '16px' }}
                      >
                        {selectedEmployeeData.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <h5 className="text-main font-weight-bold m-0">{selectedEmployeeData.user.name}</h5>
                    <small className="text-muted">{selectedEmployeeData.user.designation}</small>
                  </Col>
                  <Col sm={8}>
                    <div className="row g-2" style={{ fontSize: '0.9rem' }}>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Employee ID</strong>
                        <span className="text-main font-weight-medium">{selectedEmployeeData.user.employeeId || 'Pending'}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Email Address</strong>
                        <span className="text-main font-weight-medium">{selectedEmployeeData.user.email}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Mobile Phone</strong>
                        <span className="text-main font-weight-medium">{selectedEmployeeData.user.phone || 'N/A'}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Department</strong>
                        <span className="text-main font-weight-medium">{selectedEmployeeData.user.department}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">DOB</strong>
                        <span className="text-main font-weight-medium">
                          {selectedEmployeeData.profile?.dob ? new Date(selectedEmployeeData.profile.dob).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Gender</strong>
                        <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.gender || 'N/A'}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Marital Status</strong>
                        <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.maritalStatus || 'N/A'}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Blood Group</strong>
                        <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.bloodGroup || 'N/A'}</span>
                      </div>
                      <div className="col-sm-6">
                        <strong className="text-muted d-block">Account Status</strong>
                        <span className="text-main font-weight-semibold text-capitalize text-primary">{selectedEmployeeData.user.status}</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Tab>

              {/* Section 2: Contact & Emergency Info */}
              <Tab eventKey="contact" title="Emergency & Address">
                <div className="p-2" style={{ fontSize: '0.9rem' }}>
                  <h6 className="text-primary font-weight-bold mb-3 border-bottom pb-2 border-glass">Current Address</h6>
                  <Row className="g-3 mb-4">
                    <Col sm={6}>
                      <strong className="text-muted d-block">Street Address</strong>
                      <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.address || 'N/A'}</span>
                    </Col>
                    <Col sm={3}>
                      <strong className="text-muted d-block">City</strong>
                      <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.city || 'N/A'}</span>
                    </Col>
                    <Col sm={3}>
                      <strong className="text-muted d-block">State</strong>
                      <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.state || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">Country</strong>
                      <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.country || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">Pincode</strong>
                      <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.pincode || 'N/A'}</span>
                    </Col>
                  </Row>

                  <h6 className="text-primary font-weight-bold mb-3 border-bottom pb-2 border-glass">Emergency Contact</h6>
                  <Row className="g-3">
                    <Col sm={4}>
                      <strong className="text-muted d-block">Full Name</strong>
                      <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.emergencyContact?.name || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">Relationship</strong>
                      <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.emergencyContact?.relationship || 'N/A'}</span>
                    </Col>
                    <Col sm={4}>
                      <strong className="text-muted d-block">Phone Number</strong>
                      <span className="text-main font-weight-medium">{selectedEmployeeData.profile?.emergencyContact?.phone || 'N/A'}</span>
                    </Col>
                  </Row>
                </div>
              </Tab>

              {/* Section 3: Documents */}
              <Tab eventKey="documents" title="Documents">
                <div className="d-flex flex-column gap-3">
                  {selectedEmployeeData.documents?.length === 0 ? (
                    <div className="text-center py-4 text-muted">No documents uploaded</div>
                  ) : (
                    selectedEmployeeData.documents?.map((doc) => (
                      <div key={doc._id} className="d-flex justify-content-between align-items-center p-3 bg-light-subtle rounded-3 border border-glass">
                        <div>
                          <strong className="text-main d-block">{doc.type}</strong>
                          <small className="text-muted">{doc.name}</small>
                        </div>
                        <div className="d-inline-flex gap-2">
                          <a
                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:https://crmbackend-nq36.onrender.com'}${doc.path}`}
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
            </Tabs>
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle justify-content-between">
            <div className="d-inline-flex gap-2">
              <Button
                variant="outline-warning"
                onClick={() => {
                  setTargetResetUser(selectedEmployeeData.user._id);
                  setResetPassModal(true);
                }}
              >
                Reset Password
              </Button>
              <Button
                variant={selectedEmployeeData.user.status === 'active' ? 'danger' : 'success'}
                onClick={() => handleToggleActive(selectedEmployeeData.user._id, selectedEmployeeData.user.status)}
              >
                {selectedEmployeeData.user.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </Button>
            </div>
            <div className="d-inline-flex gap-2">
              {selectedEmployeeData.user.status === 'active' && (
                <Button
                  variant="primary"
                  className="btn-premium d-flex align-items-center gap-2"
                  onClick={() => {
                    if (!selectedEmployeeData.profile?.documents?.profilePhoto) {
                      toast.error('Cannot generate Employee ID Card because the employee profile photo has not been uploaded.');
                      return;
                    }
                    setDetailModal(false);
                    navigate(`/idcard?empId=${selectedEmployeeData.user.employeeId}`);
                  }}
                >
                  <i className="bi bi-person-badge-fill"></i>
                  <span>Generate ID Card</span>
                </Button>
              )}
              {selectedEmployeeData.user.status === 'pending' && (
                <>
                  <Button variant="success" className="px-3" onClick={() => handleApproval(selectedEmployeeData.user._id, 'active')}>
                    <i className="bi bi-check-circle-fill me-1"></i> Approve
                  </Button>
                  <Button variant="warning" className="px-3 text-dark" onClick={() => handleApproval(selectedEmployeeData.user._id, 'changes_requested')}>
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> Request Changes
                  </Button>
                  <Button variant="danger" className="px-3" onClick={() => handleApproval(selectedEmployeeData.user._id, 'rejected')}>
                    <i className="bi bi-x-circle-fill me-1"></i> Reject
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={() => setDetailModal(false)}>
                Close
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* Password Reset Modal Override */}
      <Modal
        show={resetPassModal}
        onHide={() => setResetPassModal(false)}
        centered
        contentClassName="glass-card border-glass p-3"
      >
        <Modal.Header closeButton className="border-glass-subtle">
          <Modal.Title className="text-main font-weight-bold">Reset Employee Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="text-muted">Enter New Password (min 6 chars)</Form.Label>
            <Form.Control
              type="password"
              className="form-control-glass"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-glass-subtle">
          <Button variant="secondary" onClick={() => setResetPassModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePasswordReset}>
            Update Password
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManageEmployees;
