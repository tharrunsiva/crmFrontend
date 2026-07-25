import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { getLeavesAdmin, approveRejectLeave } from '../../services/leaveService.js';
import { Table, Form, Button, Row, Col, Badge, Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Decision Modal States
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [adminComments, setAdminComments] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeavesAdmin({ status, search });
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (err) {
      toast.error('Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDecision = async (decision) => {
    if (!selectedLeave) return;
    setBtnLoading(true);
    try {
      const res = await approveRejectLeave(selectedLeave._id, decision, adminComments);
      if (res.success) {
        toast.success(`Leave request successfully ${decision}`);
        setReviewModal(false);
        setAdminComments('');
        fetchList();
      }
    } catch (err) {
      toast.error('Failed to update leave request status');
    } finally {
      setBtnLoading(false);
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="Manage Staff Leaves" />

      {/* Query Filters */}
      <div className="glass-card p-4 mb-4">
        <Row className="g-3 align-items-end">
          <Col md={6}>
            <Form.Group controlId="search">
              <Form.Label className="text-muted">Search Employee</Form.Label>
              <Form.Control
                type="text"
                className="form-control-glass"
                placeholder="Enter employee name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="status">
              <Form.Label className="text-muted">Filter Status</Form.Label>
              <Form.Select
                className="form-control-glass form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Data Table */}
      <div className="glass-card p-4">
        {loading ? (
          <div className="text-center py-4 text-muted">Retrieving leave applications...</div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-calendar-check" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2 font-weight-medium">No leave applications found matching the search criteria</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle border-0 m-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Leave Type</th>
                <th>Interval Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id} className="border-bottom border-glass-subtle">
                  <td>
                    <span className="font-weight-semibold text-main">{leave.user?.name || 'Deleted Employee'}</span>
                  </td>
                  <td className="text-muted">{leave.user?.employeeId || 'N/A'}</td>
                  <td className="text-main font-weight-medium">{leave.leaveType}</td>
                  <td className="text-muted small">
                    {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="text-main" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {leave.reason}
                  </td>
                  <td>
                    <Badge bg={getStatusColor(leave.status)} className="px-2 py-1">
                      {leave.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant={leave.status === 'Pending' ? 'primary' : 'outline-secondary'}
                      className="rounded-pill px-3"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setReviewModal(true);
                      }}
                    >
                      {leave.status === 'Pending' ? 'Review' : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Review Dialog */}
      {selectedLeave && (
        <Modal show={reviewModal} onHide={() => setReviewModal(false)} centered contentClassName="glass-card border-glass p-3">
          <Modal.Header closeButton className="border-glass-subtle">
            <Modal.Title className="text-main font-weight-bold">Review Leave Request</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <div>
              <strong className="text-muted d-block small">Employee details</strong>
              <span className="text-main font-weight-medium">{selectedLeave.user?.name || 'Deleted Employee'} ({selectedLeave.user?.employeeId || 'N/A'})</span>
            </div>
            <div>
              <strong className="text-muted d-block small">Leave type & interval</strong>
              <span className="text-main font-weight-medium">
                {selectedLeave.leaveType} | {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <strong className="text-muted d-block small">Reason details</strong>
              <p className="m-0 text-main p-2 bg-light-subtle rounded border border-glass" style={{ fontSize: '0.9rem' }}>
                {selectedLeave.reason}
              </p>
            </div>

            {selectedLeave.status === 'Pending' ? (
              <Form.Group>
                <Form.Label className="text-muted small">Approver Comments</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="form-control-glass"
                  placeholder="Include status reasoning..."
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                />
              </Form.Group>
            ) : (
              <div>
                <strong className="text-muted d-block small">Admin comment log</strong>
                <span className="text-main">{selectedLeave.adminComments || 'No remarks provided'}</span>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle">
            <Button variant="secondary" onClick={() => setReviewModal(false)}>Close</Button>
            {selectedLeave.status === 'Pending' && (
              <>
                <Button variant="success" onClick={() => handleDecision('Approved')} disabled={btnLoading}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => handleDecision('Rejected')} disabled={btnLoading}>
                  Reject
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default AdminLeaves;
