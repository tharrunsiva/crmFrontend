import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { getPayrollAdmin, generatePayroll, approvePayroll } from '../../services/payrollService.js';
import { getEmployeesList } from '../../services/adminService.js';
import { Table, Form, Button, Row, Col, Badge, Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState(false);

  // Filters
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [search, setSearch] = useState('');

  // Form states
  const [targetUserId, setTargetUserId] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('0');
  const [bonus, setBonus] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [payMonth, setPayMonth] = useState((new Date().getMonth() + 1).toString());
  const [payYear, setPayYear] = useState(new Date().getFullYear().toString());
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { month, year, search };
      const res = await getPayrollAdmin(filters);
      if (res.success) {
        setPayrolls(res.data);
      }
    } catch (err) {
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  }, [month, year, search]);

  const fetchActiveEmployees = useCallback(async () => {
    try {
      const res = await getEmployeesList({ status: 'active', limit: 100 });
      if (res.success) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      console.warn('Unable to load employee list');
    }
  }, []);

  useEffect(() => {
    fetchList();
    fetchActiveEmployees();
  }, [fetchList, fetchActiveEmployees]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!targetUserId || !basicSalary || !payMonth || !payYear) {
      toast.error('Please input all required parameters');
      return;
    }

    setBtnLoading(true);
    try {
      const res = await generatePayroll({
        userId: targetUserId,
        basicSalary,
        allowances,
        bonus,
        deductions,
        month: payMonth,
        year: payYear,
      });

      if (res.success) {
        toast.success(res.message);
        setApplyModal(false);
        // Clear
        setTargetUserId('');
        setBasicSalary('');
        setAllowances('0');
        setBonus('0');
        setDeductions('0');
        fetchList();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Generation failed');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'Approved' : 'Paid';
    const confirm = window.confirm(`Update payment status to ${nextStatus}?`);
    if (!confirm) return;

    try {
      const res = await approvePayroll(id, nextStatus);
      if (res.success) {
        toast.success(`Payroll successfully updated to ${nextStatus}`);
        fetchList();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || '';
  };

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="Manage Staff Payroll" />

      {/* Query Filters */}
      <div className="glass-card p-4 mb-4">
        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Group controlId="search">
              <Form.Label className="text-muted">Search Employee</Form.Label>
              <Form.Control
                type="text"
                className="form-control-glass"
                placeholder="Enter name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="month">
              <Form.Label className="text-muted">Month</Form.Label>
              <Form.Select className="form-control-glass form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="">All Months</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="year">
              <Form.Label className="text-muted">Year</Form.Label>
              <Form.Control
                type="number"
                className="form-control-glass"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Button onClick={() => setApplyModal(true)} className="btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2">
              <i className="bi bi-patch-plus"></i>
              <span>Generate Pay</span>
            </Button>
          </Col>
        </Row>
      </div>

      {/* Data Grid Table */}
      <div className="glass-card p-4">
        {loading ? (
          <div className="text-center py-4 text-muted">Retrieving payroll records...</div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-wallet" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2 font-weight-medium">No payroll records match the criteria</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle border-0 m-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Period</th>
                <th>Basic Salary</th>
                <th>Allowances</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Payout</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((pay) => (
                <tr key={pay._id} className="border-bottom border-glass-subtle">
                  <td>
                    <span className="font-weight-semibold text-main">{pay.user?.name || 'Deleted User'}</span>
                  </td>
                  <td className="text-muted">{pay.user?.employeeId || 'N/A'}</td>
                  <td className="text-main font-weight-medium">
                    {getMonthName(pay.month)} {pay.year}
                  </td>
                  <td className="text-muted">Rs. {pay.basicSalary.toLocaleString()}</td>
                  <td className="text-muted">Rs. {pay.allowances.toLocaleString()}</td>
                  <td className="text-success">+Rs. {pay.bonus.toLocaleString()}</td>
                  <td className="text-danger">-Rs. {pay.deductions.toLocaleString()}</td>
                  <td className="text-main font-weight-bold">Rs. {pay.netSalary.toLocaleString()}</td>
                  <td>
                    <Badge bg={pay.status === 'Paid' ? 'success' : pay.status === 'Approved' ? 'primary' : 'warning'} className="px-2 py-1">
                      {pay.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      {pay.status !== 'Paid' && (
                        <Button
                          size="sm"
                          variant="outline-success"
                          className="rounded-pill px-3"
                          onClick={() => handleStatusChange(pay._id, pay.status)}
                        >
                          {pay.status === 'Pending' ? 'Approve' : 'Mark Paid'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Setup Pay Modal */}
      <Modal show={applyModal} onHide={() => setApplyModal(false)} centered contentClassName="glass-card border-glass p-3">
        <Form onSubmit={handleGenerate}>
          <Modal.Header closeButton className="border-glass-subtle">
            <Modal.Title className="text-main font-weight-bold">Generate Employee Payroll</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label className="text-muted">Select Active Employee</Form.Label>
              <Form.Select className="form-control-glass form-select" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} required>
                <option value="">Choose Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId || 'Active'})</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-2">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Month</Form.Label>
                  <Form.Select className="form-control-glass form-select" value={payMonth} onChange={(e) => setPayMonth(e.target.value)}>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i} value={i + 1}>{getMonthName(i + 1)}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Year</Form.Label>
                  <Form.Control type="number" className="form-control-glass" value={payYear} onChange={(e) => setPayYear(e.target.value)} required />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Basic Salary (Rs.)</Form.Label>
                  <Form.Control type="number" className="form-control-glass" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} required />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Allowances (Rs.)</Form.Label>
                  <Form.Control type="number" className="form-control-glass" value={allowances} onChange={(e) => setAllowances(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-2">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Bonus (Rs.)</Form.Label>
                  <Form.Control type="number" className="form-control-glass" value={bonus} onChange={(e) => setBonus(e.target.value)} />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Deductions (Rs.)</Form.Label>
                  <Form.Control type="number" className="form-control-glass" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle">
            <Button variant="secondary" onClick={() => setApplyModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-premium" disabled={btnLoading}>
              {btnLoading ? 'Compiling Slip...' : 'Release Payroll'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPayroll;
