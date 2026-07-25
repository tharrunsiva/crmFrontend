import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { getPermissionsAdmin, approveRejectPermission } from '../../services/permissionService.js';
import { Table, Form, Button, Row, Col, Badge, Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';

const AdminPermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Review Modal
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState(null);
  const [adminComments, setAdminComments] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPermissionsAdmin({ status, search });
      if (res.success) {
        setPermissions(res.data);
      }
    } catch (err) {
      toast.error('Failed to load permission requests');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleDecision = async (decision) => {
    if (!selectedPerm) return;
    setBtnLoading(true);
    try {
      const res = await approveRejectPermission(selectedPerm._id, decision, adminComments);
      if (res.success) {
        toast.success(`Permission request ${decision}`);
        setReviewModal(false);
        setAdminComments('');
        fetchList();
      }
    } catch (err) {
      toast.error('Failed to update permission status');
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
      <Navbar pageTitle="Manage Staff Permissions" />

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
          <div className="text-center py-4 text-muted">Retrieving permission requests...</div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-clock" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2 font-weight-medium">No permission requests found matching the search criteria</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle border-0 m-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Absence Date</th>
                <th>Absence Interval</th>
                <th>Reason Details</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm._id} className="border-bottom border-glass-subtle">
                  <td>
                    <span className="font-weight-semibold text-main">{perm.user.name}</span>
                  </td>
                  <td className="text-muted">{perm.user.employeeId}</td>
                  <td className="text-main font-weight-medium">
                    {new Date(perm.date).toLocaleDateString()}
                  </td>
                  <td className="text-muted small">{perm.startTime} - {perm.endTime}</td>
                  <td className="text-main" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {perm.reason}
                  </td>
                  <td>
                    <Badge bg={getStatusColor(perm.status)} className="px-2 py-1">
                      {perm.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant={perm.status === 'Pending' ? 'primary' : 'outline-secondary'}
                      className="rounded-pill px-3"
                      onClick={() => {
                        setSelectedPerm(perm);
                        setReviewModal(true);
                      }}
                    >
                      {perm.status === 'Pending' ? 'Review' : 'View'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Review Dialog */}
      {selectedPerm && (
        <Modal show={reviewModal} onHide={() => setReviewModal(false)} centered contentClassName="glass-card border-glass p-3">
          <Modal.Header closeButton className="border-glass-subtle">
            <Modal.Title className="text-main font-weight-bold">Review Permission Request</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <div>
              <strong className="text-muted d-block small">Employee details</strong>
              <span className="text-main font-weight-medium">{selectedPerm.user.name} ({selectedPerm.user.employeeId})</span>
            </div>
            <div>
              <strong className="text-muted d-block small">Absence date & times</strong>
              <span className="text-main font-weight-medium">
                {new Date(selectedPerm.date).toLocaleDateString()} | {selectedPerm.startTime} to {selectedPerm.endTime}
              </span>
            </div>
            <div>
              <strong className="text-muted d-block small">Reason details</strong>
              <p className="m-0 text-main p-2 bg-light-subtle rounded border border-glass" style={{ fontSize: '0.9rem' }}>
                {selectedPerm.reason}
              </p>
            </div>

            {selectedPerm.status === 'Pending' ? (
              <Form.Group>
                <Form.Label className="text-muted small">HR Approver Comments</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="form-control-glass"
                  placeholder="State decision context..."
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                />
              </Form.Group>
            ) : (
              <div>
                <strong className="text-muted d-block small">Admin comments</strong>
                <span className="text-main">{selectedPerm.adminComments || 'No comments left'}</span>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle">
            <Button variant="secondary" onClick={() => setReviewModal(false)}>Close</Button>
            {selectedPerm.status === 'Pending' && (
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

export default AdminPermissions;
