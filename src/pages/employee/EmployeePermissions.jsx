import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { requestPermission, getMyPermissions } from '../../services/permissionService.js';
import { Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import toast from 'react-hot-toast';

const EmployeePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(false);

  // Form states
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getMyPermissions();
      if (res.success) {
        setPermissions(res.data);
      }
    } catch (err) {
      console.warn('Error fetching permissions log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !reason) {
      toast.error('All fields are required');
      return;
    }

    setBtnLoading(true);
    try {
      const res = await requestPermission({ date, startTime, endTime, reason });
      if (res.success) {
        toast.success(res.message);
        setApplyModal(false);
        setDate('');
        setStartTime('');
        setEndTime('');
        setReason('');
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Absence filing failed');
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
      <Navbar pageTitle="Short Absence Permissions" />

      <div className="glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-main font-weight-bold m-0">My Absence Logs</h5>
          <Button onClick={() => setApplyModal(true)} className="btn-premium rounded-pill px-4">
            <i className="bi bi-clock-history"></i> Request Permission
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4 text-muted">Retrieving absence history...</div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-shield-check" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2">No short absence permissions logged</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle border-0 m-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                <th>Absence Date</th>
                <th>Interval Time</th>
                <th>Reason Details</th>
                <th>Status</th>
                <th>HR Remarks</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm._id} className="border-bottom border-glass-subtle">
                  <td className="text-main font-weight-semibold">
                    {new Date(perm.date).toLocaleDateString()}
                  </td>
                  <td className="text-muted">{perm.startTime} - {perm.endTime}</td>
                  <td className="text-main" style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {perm.reason}
                  </td>
                  <td>
                    <Badge bg={getStatusColor(perm.status)} className="px-2 py-1">
                      {perm.status}
                    </Badge>
                  </td>
                  <td className="text-muted small">{perm.adminComments || 'No comments'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Request Modal */}
      <Modal show={applyModal} onHide={() => setApplyModal(false)} centered contentClassName="glass-card border-glass p-3">
        <Form onSubmit={handleApply}>
          <Modal.Header closeButton className="border-glass-subtle">
            <Modal.Title className="text-main font-weight-bold">Request Short Absence</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="text-muted">Absence Date</Form.Label>
              <Form.Control type="date" className="form-control-glass" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Form.Group>

            <Row className="g-2">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Start Time</Form.Label>
                  <Form.Control type="time" className="form-control-glass" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">End Time</Form.Label>
                  <Form.Control type="time" className="form-control-glass" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="text-muted">Reason</Form.Label>
              <Form.Control as="textarea" rows={3} className="form-control-glass" placeholder="State reason details..." value={reason} onChange={(e) => setReason(e.target.value)} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle">
            <Button variant="secondary" onClick={() => setApplyModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-premium" disabled={btnLoading}>
              {btnLoading ? 'Filing Request...' : 'Submit Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeePermissions;
