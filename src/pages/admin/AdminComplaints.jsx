import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { getComplaintsAdmin, replyToComplaint, updateComplaintStatus } from '../../services/complaintService.js';
import { Table, Form, Button, Row, Col, Badge, Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Thread chat Modal states
  const [chatModal, setChatModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getComplaintsAdmin({ status, priority, search });
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      toast.error('Failed to load complaint logs');
    } finally {
      setLoading(false);
    }
  }, [status, priority, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      const res = await replyToComplaint(activeTicket._id, chatMessage);
      if (res.success) {
        setChatMessage('');
        setActiveTicket(res.data);
        fetchList();
      }
    } catch (err) {
      toast.error('Failed to send response');
    }
  };

  const handleToggleStatus = async (id, nextStatus) => {
    const confirm = window.confirm(`Update ticket status to ${nextStatus}?`);
    if (!confirm) return;

    setBtnLoading(true);
    try {
      const res = await updateComplaintStatus(id, nextStatus);
      if (res.success) {
        toast.success(`Ticket successfully ${nextStatus}`);
        setChatModal(false);
        fetchList();
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setBtnLoading(false);
    }
  };

  const getPriorityColor = (pr) => {
    switch (pr) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'secondary';
      default: return 'primary';
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'Open': return 'primary';
      case 'In-Progress': return 'warning';
      case 'Resolved': return 'success';
      case 'Closed': return 'secondary';
      default: return 'dark';
    }
  };

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="Manage Staff Grievances" />

      {/* Query Filters */}
      <div className="glass-card p-4 mb-4">
        <Row className="g-3 align-items-end">
          <Col md={4}>
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
          <Col md={4}>
            <Form.Group controlId="priority">
              <Form.Label className="text-muted">Filter Priority</Form.Label>
              <Form.Select
                className="form-control-glass form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group controlId="status">
              <Form.Label className="text-muted">Filter Status</Form.Label>
              <Form.Select
                className="form-control-glass form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Data Table */}
      <div className="glass-card p-4">
        {loading ? (
          <div className="text-center py-4 text-muted">Retrieving tickets...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-chat-left-text" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2 font-weight-medium">No complaints matching the criteria</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle border-0 m-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Complaint Title</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((comp) => (
                <tr key={comp._id} className="border-bottom border-glass-subtle">
                  <td>
                    <span className="font-weight-semibold text-main">{comp.user.name}</span>
                  </td>
                  <td className="text-muted">{comp.user.employeeId}</td>
                  <td className="text-main font-weight-medium">{comp.title}</td>
                  <td>
                    <Badge bg={getPriorityColor(comp.priority)} className="px-2 py-1">
                      {comp.priority}
                    </Badge>
                  </td>
                  <td className="text-muted">{comp.department}</td>
                  <td>
                    <Badge bg={getStatusColor(comp.status)} className="px-2 py-1">
                      {comp.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant={comp.status === 'Open' || comp.status === 'In-Progress' ? 'primary' : 'outline-secondary'}
                      className="rounded-pill px-3"
                      onClick={() => {
                        setActiveTicket(comp);
                        setChatModal(true);
                      }}
                    >
                      {comp.status === 'Open' || comp.status === 'In-Progress' ? 'Inspect Thread' : 'View Logs'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Review Chat Modal Thread */}
      {activeTicket && (
        <Modal show={chatModal} onHide={() => setChatModal(false)} size="lg" centered contentClassName="glass-card border-glass p-3">
          <Modal.Header closeButton className="border-glass-subtle">
            <div>
              <Modal.Title className="text-main font-weight-bold">{activeTicket.title}</Modal.Title>
              <small className="text-muted">By {activeTicket.user.name} ({activeTicket.user.employeeId}) | Priority: {activeTicket.priority}</small>
            </div>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            {/* Original Complaint description */}
            <div className="p-3 bg-light-subtle rounded border border-glass">
              <strong className="text-muted d-block mb-1">Issue context:</strong>
              <p className="m-0 text-main" style={{ fontSize: '0.9rem' }}>{activeTicket.description}</p>
              {activeTicket.attachment && (
                <div className="mt-2">
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${activeTicket.attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 mt-1"
                    style={{ fontSize: '0.8rem' }}
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </div>

            {/* Conversation Feed */}
            <div className="overflow-auto border border-glass rounded-3 p-3 bg-light-subtle" style={{ maxHeight: '240px', minHeight: '160px' }}>
              {activeTicket.replies.length === 0 ? (
                <div className="text-center py-5 text-muted small">No replies logged. Write a response below.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {activeTicket.replies.map((reply, idx) => (
                    <div key={idx} className="p-2 rounded bg-white shadow-sm border border-glass" style={{ width: '90%', marginLeft: reply.sender.role === 'admin' ? 'auto' : '0' }}>
                      <div className="d-flex justify-content-between align-items-center border-bottom border-light pb-1 mb-1">
                        <strong className="text-main small">{reply.sender.name} ({reply.sender.role})</strong>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="m-0 text-muted" style={{ fontSize: '0.85rem' }}>{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply trigger */}
            {activeTicket.status !== 'Closed' && activeTicket.status !== 'Resolved' && (
              <Form onSubmit={handlePostReply} className="d-flex gap-2">
                <Form.Control
                  type="text"
                  className="form-control-glass flex-grow-1"
                  placeholder="Type official reply..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary">Post Reply</Button>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle justify-content-between">
            {activeTicket.status !== 'Closed' && activeTicket.status !== 'Resolved' ? (
              <div className="d-inline-flex gap-2">
                <Button variant="success" onClick={() => handleToggleStatus(activeTicket._id, 'Resolved')} disabled={btnLoading}>
                  Resolve Issue
                </Button>
                <Button variant="danger" onClick={() => handleToggleStatus(activeTicket._id, 'Closed')} disabled={btnLoading}>
                  Close Ticket
                </Button>
              </div>
            ) : (
              <Badge bg={getStatusColor(activeTicket.status)} className="px-2 py-1">Ticket {activeTicket.status}</Badge>
            )}
            <Button variant="secondary" onClick={() => setChatModal(false)}>Close Dialog</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default AdminComplaints;
