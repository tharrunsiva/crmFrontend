import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { submitComplaint, getMyComplaints, replyToComplaint, updateComplaintStatus } from '../../services/complaintService.js';
import { Table, Button, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import toast from 'react-hot-toast';

const EmployeeComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [department, setDepartment] = useState('Human Resources');
  const [attachment, setAttachment] = useState(null);
  const [btnLoading, setBtnLoading] = useState(false);

  // Thread Chat Modal States
  const [chatModal, setChatModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [chatMessage, setChatMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await getMyComplaints();
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.warn('Error fetching complaints history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Please input a title and description');
      return;
    }

    setBtnLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('priority', priority);
    formData.append('department', department);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const res = await submitComplaint(formData);
      if (res.success) {
        toast.success(res.message);
        setApplyModal(false);
        setTitle('');
        setDescription('');
        setPriority('Medium');
        setAttachment(null);
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Complaint submission failed');
    } finally {
      setBtnLoading(false);
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      const res = await replyToComplaint(activeTicket._id, chatMessage);
      if (res.success) {
        setChatMessage('');
        setActiveTicket(res.data);
        loadData();
      }
    } catch (err) {
      toast.error('Failed to post message response');
    }
  };

  const handleCloseTicket = async (id) => {
    const confirm = window.confirm('Are you sure you want to close this ticket? This cannot be undone.');
    if (!confirm) return;
    try {
      const res = await updateComplaintStatus(id, 'Closed');
      if (res.success) {
        toast.success('Ticket closed successfully');
        setChatModal(false);
        loadData();
      }
    } catch (err) {
      toast.error('Failed to close ticket');
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
      <Navbar pageTitle="Grievance Redressal Box" />

      <div className="glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-main font-weight-bold m-0">My Complaint Tickets</h5>
          <Button onClick={() => setApplyModal(true)} className="btn-premium rounded-pill px-4">
            <i className="bi bi-patch-exclamation-fill"></i> Submit Complaint
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4 text-muted">Retrieving tickets...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-chat-left-heart" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2">All clean! No complaints filed.</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle border-0 m-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                <th>Complaint Title</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Filed Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((comp) => (
                <tr key={comp._id} className="border-bottom border-glass-subtle">
                  <td className="text-main font-weight-semibold">{comp.title}</td>
                  <td>
                    <Badge bg={getPriorityColor(comp.priority)} className="px-2 py-1">
                      {comp.priority}
                    </Badge>
                  </td>
                  <td className="text-muted">{comp.department}</td>
                  <td className="text-muted">{new Date(comp.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Badge bg={getStatusColor(comp.status)} className="px-2 py-1">
                      {comp.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="rounded-pill px-3"
                      onClick={() => {
                        setActiveTicket(comp);
                        setChatModal(true);
                      }}
                    >
                      Chat Thread ({comp.replies.length})
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Apply Complaint Modal Form */}
      <Modal show={applyModal} onHide={() => setApplyModal(false)} centered contentClassName="glass-card border-glass p-3">
        <Form onSubmit={handleApply}>
          <Modal.Header closeButton className="border-glass-subtle">
            <Modal.Title className="text-main font-weight-bold">File a Complaint</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="text-muted">Complaint Title</Form.Label>
              <Form.Control type="text" className="form-control-glass" placeholder="Brief subject..." value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Form.Group>

            <Row className="g-2">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Priority</Form.Label>
                  <Form.Select className="form-control-glass form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Target Department</Form.Label>
                  <Form.Select className="form-control-glass form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Operations">Operations</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label className="text-muted">Description</Form.Label>
              <Form.Control as="textarea" rows={3} className="form-control-glass" placeholder="Elaborate details of the issue..." value={description} onChange={(e) => setDescription(e.target.value)} required />
            </Form.Group>

            <Form.Group>
              <Form.Label className="text-muted">Attachment (Image/PDF)</Form.Label>
              <Form.Control type="file" className="form-control-glass" onChange={(e) => setAttachment(e.target.files[0])} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle">
            <Button variant="secondary" onClick={() => setApplyModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-premium" disabled={btnLoading}>
              {btnLoading ? 'Filing Ticket...' : 'File Ticket'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Ticket Chat Modal Thread */}
      {activeTicket && (
        <Modal show={chatModal} onHide={() => setChatModal(false)} size="lg" centered contentClassName="glass-card border-glass p-3">
          <Modal.Header closeButton className="border-glass-subtle">
            <div>
              <Modal.Title className="text-main font-weight-bold">{activeTicket.title}</Modal.Title>
              <small className="text-muted">Status: {activeTicket.status} | Priority: {activeTicket.priority}</small>
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

            {/* Conversation Feed list */}
            <div className="overflow-auto border border-glass rounded-3 p-3 bg-light-subtle" style={{ maxHeight: '240px', minHeight: '160px' }}>
              {activeTicket.replies.length === 0 ? (
                <div className="text-center py-5 text-muted small">No message responses yet.</div>
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

            {/* Write reply */}
            {activeTicket.status !== 'Closed' && (
              <Form onSubmit={handlePostReply} className="d-flex gap-2">
                <Form.Control
                  type="text"
                  className="form-control-glass flex-grow-1"
                  placeholder="Type message response..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  required
                />
                <Button type="submit" variant="primary">Send</Button>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle justify-content-between">
            {activeTicket.status !== 'Closed' ? (
              <Button variant="outline-danger" onClick={() => handleCloseTicket(activeTicket._id)}>
                Close Ticket
              </Button>
            ) : (
              <Badge bg="secondary">Ticket Closed</Badge>
            )}
            <Button variant="secondary" onClick={() => setChatModal(false)}>Close Dialog</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeComplaints;
// Completed
