import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { applyLeave, getMyLeaves, getLeaveAnalytics } from '../../services/leaveService.js';
import { Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import toast from 'react-hot-toast';

const EmployeeLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(false);

  // Form states
  const [leaveType, setLeaveType] = useState('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [halfDayType, setHalfDayType] = useState('None');
  const [reason, setReason] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const histRes = await getMyLeaves();
      const anaRes = await getLeaveAnalytics();
      if (histRes.success) setLeaves(histRes.data);
      if (anaRes.success) setAnalytics(anaRes.data);
    } catch (err) {
      console.warn('Error loading leave logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill out all fields');
      return;
    }

    setBtnLoading(true);
    try {
      const res = await applyLeave({ leaveType, startDate, endDate, halfDayType, reason });
      if (res.success) {
        toast.success(res.message);
        setApplyModal(false);
        // Clear
        setStartDate('');
        setEndDate('');
        setReason('');
        setHalfDayType('None');
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Application failed');
    } finally {
      setBtnLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="Leave Request System" />

      {/* Metrics Section */}
      {analytics && (
        <Row className="g-4 mb-4">
          <Col md={4}>
            <div className="glass-card p-4 text-center">
              <span className="text-muted d-block uppercase mb-1" style={{ fontSize: '0.85rem' }}>Allocated Annual Leaves</span>
              <h2 className="text-primary font-weight-bold display-font m-0">{analytics.allocated} Days</h2>
            </div>
          </Col>
          <Col md={4}>
            <div className="glass-card p-4 text-center">
              <span className="text-muted d-block uppercase mb-1" style={{ fontSize: '0.85rem' }}>Leaves Approved</span>
              <h2 className="text-success font-weight-bold display-font m-0">{analytics.taken} Days</h2>
            </div>
          </Col>
          <Col md={4}>
            <div className="glass-card p-4 text-center">
              <span className="text-muted d-block uppercase mb-1" style={{ fontSize: '0.85rem' }}>Leaves Remaining</span>
              <h2 className="text-warning font-weight-bold display-font m-0">{analytics.remaining} Days</h2>
            </div>
          </Col>
        </Row>
      )}

      {/* History Grid */}
      <div className="glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-main font-weight-bold m-0">Leave Application History</h5>
          <Button onClick={() => setApplyModal(true)} className="btn-premium rounded-pill px-4">
            <i className="bi bi-calendar-plus-fill"></i> Apply for Leave
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4 text-muted">Loading logs...</div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2">No leave applications registered yet</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle border-0 m-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>HR Approver Remarks</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id} className="border-bottom border-glass-subtle">
                  <td className="text-main font-weight-semibold">{leave.leaveType}</td>
                  <td className="text-muted">{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td className="text-muted">{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td className="text-main" style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {leave.reason}
                  </td>
                  <td>
                    <Badge bg={getStatusColor(leave.status)} className="px-2 py-1">
                      {leave.status}
                    </Badge>
                  </td>
                  <td className="text-muted small">{leave.adminComments || 'No comments'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Apply Leave Modal Form */}
      <Modal show={applyModal} onHide={() => setApplyModal(false)} centered contentClassName="glass-card border-glass p-3">
        <Form onSubmit={handleApply}>
          <Modal.Header closeButton className="border-glass-subtle">
            <Modal.Title className="text-main font-weight-bold">Apply for Leave</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="text-muted">Leave Type</Form.Label>
              <Form.Select className="form-control-glass form-select" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                <option value="Annual">Annual Leave</option>
                <option value="Medical">Medical Leave</option>
                <option value="Emergency">Emergency Leave</option>
                <option value="Permission">Permission Leave</option>
                <option value="Half-Day">Half Day</option>
                <option value="Custom">Custom Leave</option>
              </Form.Select>
            </Form.Group>

            <Row className="g-2">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Start Date</Form.Label>
                  <Form.Control type="date" className="form-control-glass" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">End Date</Form.Label>
                  <Form.Control type="date" className="form-control-glass" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </Form.Group>
              </Col>
            </Row>

            {leaveType === 'Half-Day' && (
              <Form.Group>
                <Form.Label className="text-muted">Half Day Interval</Form.Label>
                <Form.Select className="form-control-glass form-select" value={halfDayType} onChange={(e) => setHalfDayType(e.target.value)}>
                  <option value="None">None</option>
                  <option value="First Half">First Half Session</option>
                  <option value="Second Half">Second Half Session</option>
                </Form.Select>
              </Form.Group>
            )}

            <Form.Group>
              <Form.Label className="text-muted">Reason for Absence</Form.Label>
              <Form.Control as="textarea" rows={3} className="form-control-glass" placeholder="Describe context details..." value={reason} onChange={(e) => setReason(e.target.value)} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle">
            <Button variant="secondary" onClick={() => setApplyModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-premium" disabled={btnLoading}>
              {btnLoading ? 'Filing Application...' : 'File Application'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeLeaves;
