import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import {
  getAttendanceAdmin,
  editAttendanceAdmin,
  markAttendanceManualAdmin,
  deleteAttendanceAdmin,
  getEmployeesList
} from '../../services/adminService.js';
import { Table, Form, Button, Row, Col, Badge, Modal, Card } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [rawAttendance, setRawAttendance] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  
  // Filters
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Modals
  const [markModal, setMarkModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Manual mark form inputs
  const [manualUserId, setManualUserId] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualCheckInTime, setManualCheckInTime] = useState('09:00');
  const [manualCheckOutTime, setManualCheckOutTime] = useState('17:00');
  const [manualStatus, setManualStatus] = useState('Present');
  const [manualRemarks, setManualRemarks] = useState('');

  // Edit form inputs
  const [editCheckInTime, setEditCheckInTime] = useState('');
  const [editCheckOutTime, setEditCheckOutTime] = useState('');
  const [editStatus, setEditStatus] = useState('Present');
  const [editRemarks, setEditRemarks] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Static options
  const departments = ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Operations', 'Sales'];
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const fetchActiveEmployees = useCallback(async () => {
    try {
      const res = await getEmployeesList({ status: 'active', limit: 100 });
      if (res.success) {
        setActiveEmployees(res.data.employees);
      }
    } catch (err) {
      console.warn('Failed to load active employees list');
    }
  }, []);

  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      let params = {};
      if (viewMode === 'daily') {
        params.date = selectedDate;
      } else {
        params.month = selectedMonth;
        params.year = selectedYear;
      }

      // Pass search and dept filters if specified
      if (searchQuery) params.search = searchQuery;
      if (selectedDept) params.department = selectedDept;

      const res = await getAttendanceAdmin(params);
      if (res.success) {
        setRawAttendance(res.data);
      }
    } catch (err) {
      toast.error('Failed to load attendance logs');
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedDate, selectedMonth, selectedYear, searchQuery, selectedDept]);

  useEffect(() => {
    fetchActiveEmployees();
  }, [fetchActiveEmployees]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // Compile daily records to display active employees who have NOT checked in as 'Absent'
  useEffect(() => {
    if (viewMode === 'daily') {
      const list = activeEmployees
        .filter(emp => {
          // Client-side filtering check for search query & department
          const matchesSearch = !searchQuery || 
            emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (emp.employeeId && emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchesDept = !selectedDept || emp.department === selectedDept;
          return matchesSearch && matchesDept;
        })
        .map(emp => {
          const record = rawAttendance.find(att => att.user?._id === emp._id || att.user === emp._id);
          if (record) {
            return {
              ...record,
              user: emp
            };
          } else {
            return {
              _id: `absent-${emp._id}`,
              user: emp,
              date: selectedDate,
              checkIn: null,
              checkOut: null,
              workingHours: 0,
              status: 'Absent',
              remarks: 'Implicit Absent - No check-in recorded',
              isImplicit: true
            };
          }
        });
      setFilteredRecords(list);
      setCurrentPage(1);
    } else {
      // In monthly view, rawAttendance contains only the checked-in records
      setFilteredRecords(rawAttendance);
      setCurrentPage(1);
    }
  }, [viewMode, activeEmployees, rawAttendance, selectedDate, searchQuery, selectedDept]);

  // Calculations for summary stats
  const getStats = () => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;

    if (viewMode === 'daily') {
      filteredRecords.forEach(r => {
        if (r.status === 'Present') present++;
        else if (r.status === 'Late') late++;
        else if (r.status === 'Half-Day' || r.status === 'Half Day') halfDay++;
        else if (r.status === 'Absent') absent++;
      });
    } else {
      // Monthly summary stats
      filteredRecords.forEach(r => {
        if (r.status === 'Present') present++;
        else if (r.status === 'Late') late++;
        else if (r.status === 'Half-Day' || r.status === 'Half Day') halfDay++;
        else if (r.status === 'Absent') absent++;
      });
    }

    return { present, absent, late, halfDay };
  };

  const stats = getStats();

  // Monthly trends chart formatter
  const getMonthlyChartData = () => {
    const dayMap = {};
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
      dayMap[d] = { day: d, Present: 0, Late: 0, 'Half-Day': 0, Absent: 0 };
    }

    rawAttendance.forEach(rec => {
      const d = new Date(rec.date).getDate();
      if (dayMap[d]) {
        if (rec.status === 'Present') dayMap[d].Present++;
        else if (rec.status === 'Late') dayMap[d].Late++;
        else if (rec.status === 'Half-Day' || rec.status === 'Half Day') dayMap[d]['Half-Day']++;
        else if (rec.status === 'Absent') dayMap[d].Absent++;
      }
    });

    return Object.values(dayMap);
  };

  const chartData = getMonthlyChartData();

  // Export CSV/Excel
  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Date', 'Check-In', 'Check-Out', 'Working Hours', 'Status', 'Remarks'];
    const rows = filteredRecords.map(rec => {
      const name = rec.user?.name || 'N/A';
      const empId = rec.user?.employeeId || 'N/A';
      const dept = rec.user?.department || 'N/A';
      const dateStr = new Date(rec.date).toLocaleDateString();
      const checkInTime = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
      const checkOutTime = rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
      const hours = rec.workingHours || 0;
      const status = rec.status || 'N/A';
      const remarks = rec.remarks || '';
      
      return [name, empId, dept, dateStr, checkInTime, checkOutTime, hours, status, remarks];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Export_${viewMode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Vinsup CRM - Attendance Report (${viewMode.toUpperCase()})`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);
    
    let y = 35;
    doc.setFont('helvetica', 'bold');
    doc.text('Employee', 14, y);
    doc.text('ID', 60, y);
    doc.text('Dept', 85, y);
    doc.text('Date', 120, y);
    doc.text('Hours', 150, y);
    doc.text('Status', 175, y);
    doc.line(14, y + 2, 195, y + 2);
    y += 8;
    
    doc.setFont('helvetica', 'normal');
    filteredRecords.forEach((rec) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(rec.user?.name || 'N/A', 14, y);
      doc.text(rec.user?.employeeId || 'N/A', 60, y);
      doc.text(rec.user?.department || 'N/A', 85, y);
      doc.text(new Date(rec.date).toLocaleDateString(), 120, y);
      doc.text(String(rec.workingHours || 0), 150, y);
      doc.text(rec.status || 'N/A', 175, y);
      y += 6;
    });
    
    doc.save(`Attendance_Report_${viewMode}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Manual punch submit
  const handleManualMarkSubmit = async (e) => {
    e.preventDefault();
    if (!manualUserId || !manualDate || !manualStatus) {
      toast.error('Please fill in all compulsory fields');
      return;
    }

    try {
      let checkInDate = null;
      let checkOutDate = null;
      
      if (manualCheckInTime) {
        checkInDate = new Date(`${manualDate}T${manualCheckInTime}:00`);
      }
      if (manualCheckOutTime) {
        checkOutDate = new Date(`${manualDate}T${manualCheckOutTime}:00`);
      }

      const payload = {
        userId: manualUserId,
        date: manualDate,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: manualStatus,
        remarks: manualRemarks
      };

      await markAttendanceManualAdmin(payload);
      toast.success('Attendance record marked successfully');
      setMarkModal(false);
      setManualUserId('');
      setManualRemarks('');
      loadAttendanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to manually mark attendance');
    }
  };

  // Open edit modal
  const openEditModal = (rec) => {
    setEditingRecord(rec);
    
    const timeFormatter = (dtStr) => {
      if (!dtStr) return '';
      const d = new Date(dtStr);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    setEditCheckInTime(timeFormatter(rec.checkIn) || '09:00');
    setEditCheckOutTime(timeFormatter(rec.checkOut) || '17:00');
    setEditStatus(rec.status || 'Present');
    setEditRemarks(rec.remarks || '');
    setEditModal(true);
  };

  // Edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      let checkInDate = null;
      let checkOutDate = null;
      
      const recordDateStr = new Date(editingRecord.date).toISOString().split('T')[0];

      if (editCheckInTime) {
        checkInDate = new Date(`${recordDateStr}T${editCheckInTime}:00`);
      }
      if (editCheckOutTime) {
        checkOutDate = new Date(`${recordDateStr}T${editCheckOutTime}:00`);
      }

      const payload = {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: editStatus,
        remarks: editRemarks
      };

      if (editingRecord.isImplicit) {
        // If it's a simulated Absent row (which does not exist in db), we must create it!
        const createPayload = {
          userId: editingRecord.user._id,
          date: recordDateStr,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: editStatus,
          remarks: editRemarks
        };
        await markAttendanceManualAdmin(createPayload);
      } else {
        await editAttendanceAdmin(editingRecord._id, payload);
      }
      
      toast.success('Attendance record updated successfully');
      setEditModal(false);
      loadAttendanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  // Delete handler
  const handleDeleteClick = async (rec) => {
    if (rec.isImplicit) {
      toast.error('Implicit Absent record cannot be deleted since it does not exist in the database.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the attendance record for ${rec.user?.name}?`)) {
      try {
        await deleteAttendanceAdmin(rec._id);
        toast.success('Attendance record deleted successfully');
        loadAttendanceData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete attendance record');
      }
    }
  };

  // Slice paginated items
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return <Badge bg="success-subtle" className="text-success border border-success-subtle px-2 py-1">Present</Badge>;
      case 'Late': return <Badge bg="warning-subtle" className="text-warning border border-warning-subtle px-2 py-1">Late</Badge>;
      case 'Half-Day':
      case 'Half Day': return <Badge bg="info-subtle" className="text-info border border-info-subtle px-2 py-1">Half Day</Badge>;
      case 'Absent': return <Badge bg="danger-subtle" className="text-danger border border-danger-subtle px-2 py-1">Absent</Badge>;
      default: return <Badge bg="secondary-subtle" className="text-secondary px-2 py-1">{status}</Badge>;
    }
  };

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="Attendance Management" />

      {/* Header Controls */}
      <div className="glass-card p-4 mb-4">
        <Row className="g-3 align-items-center">
          <Col md={3}>
            <Form.Group>
              <Form.Label className="text-muted small">View Mode</Form.Label>
              <div className="d-flex gap-2">
                <Button 
                  variant={viewMode === 'daily' ? 'primary' : 'outline-primary'} 
                  className="w-50"
                  onClick={() => setViewMode('daily')}
                >
                  Daily Attendance
                </Button>
                <Button 
                  variant={viewMode === 'monthly' ? 'primary' : 'outline-primary'} 
                  className="w-50"
                  onClick={() => setViewMode('monthly')}
                >
                  Monthly View
                </Button>
              </div>
            </Form.Group>
          </Col>
          
          {viewMode === 'daily' ? (
            <Col md={3}>
              <Form.Group>
                <Form.Label className="text-muted small">Select Date</Form.Label>
                <Form.Control 
                  type="date" 
                  className="form-control-glass" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Form.Group>
            </Col>
          ) : (
            <>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="text-muted small">Select Month</Form.Label>
                  <Form.Select 
                    className="form-control-glass form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label className="text-muted small">Select Year</Form.Label>
                  <Form.Control 
                    type="number" 
                    className="form-control-glass"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  />
                </Form.Group>
              </Col>
            </>
          )}

          <Col md={2}>
            <Form.Group>
              <Form.Label className="text-muted small">Filter Department</Form.Label>
              <Form.Select 
                className="form-control-glass form-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label className="text-muted small">Search Employees</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Search name or ID..." 
                className="form-control-glass"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="glass-card p-4 text-center border-glass-subtle">
            <h6 className="text-muted m-0 small mb-2">Presents Count</h6>
            <h3 className="text-success font-weight-bold m-0">{stats.present}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="glass-card p-4 text-center border-glass-subtle">
            <h6 className="text-muted m-0 small mb-2">Late Entries</h6>
            <h3 className="text-warning font-weight-bold m-0">{stats.late}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="glass-card p-4 text-center border-glass-subtle">
            <h6 className="text-muted m-0 small mb-2">Half Day Punches</h6>
            <h3 className="text-info font-weight-bold m-0">{stats.halfDay}</h3>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="glass-card p-4 text-center border-glass-subtle">
            <h6 className="text-muted m-0 small mb-2">Absent Absentees</h6>
            <h3 className="text-danger font-weight-bold m-0">{stats.absent}</h3>
          </Card>
        </Col>
      </Row>

      {/* Analytics Chart Block */}
      {viewMode === 'monthly' && (
        <div className="glass-card p-4 mb-4">
          <h5 className="text-main font-weight-bold mb-4">Monthly Attendance Trends</h5>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--border-glass)', borderRadius: '8px', color: 'var(--text-main)' }} />
                <Legend />
                <Bar dataKey="Present" fill="#22C55E" stackId="a" />
                <Bar dataKey="Late" fill="#F59E0B" stackId="a" />
                <Bar dataKey="Half-Day" fill="#3B82F6" stackId="a" />
                <Bar dataKey="Absent" fill="#EF4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Actions and Table */}
      <div className="glass-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="text-main font-weight-bold m-0">Attendance Records Table</h5>
          <div className="d-flex gap-2">
            <Button variant="primary" className="btn-premium" onClick={() => setMarkModal(true)}>
              <i className="bi bi-patch-check-fill me-1"></i> Mark Attendance Manually
            </Button>
            <Button variant="outline-success" onClick={handleExportCSV}>
              <i className="bi bi-file-earmark-spreadsheet-fill me-1"></i> Export to Excel
            </Button>
            <Button variant="outline-danger" onClick={handleExportPDF}>
              <i className="bi bi-file-earmark-pdf-fill me-1"></i> Export to PDF
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted">Retrieving attendance logs...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-5 text-muted">No attendance logs match the current criteria</div>
        ) : (
          <>
            <Table responsive hover className="align-middle m-0 border-0">
              <thead>
                <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((rec) => (
                  <tr key={rec._id} className="border-bottom border-glass-subtle">
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        {rec.user?.documents?.profilePhoto ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:https://crmbackend-nq36.onrender.com'}${rec.user.documents.profilePhoto.startsWith('/') ? '' : '/'}${rec.user.documents.profilePhoto}`}
                            alt="Photo"
                            className="rounded-circle shadow-sm"
                            style={{ width: '36px', height: '36px', objectFit: 'cover', border: '1.5px solid var(--primary-color)' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                            style={{ width: '36px', height: '36px', fontWeight: '500' }}
                          >
                            {rec.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <span className="font-weight-semibold text-main d-block">{rec.user?.name || 'N/A'}</span>
                          <small className="text-muted">{rec.user?.email || 'N/A'}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-main font-weight-medium">{rec.user?.employeeId || 'N/A'}</td>
                    <td>
                      <Badge bg="primary-subtle" className="text-primary font-weight-semibold">
                        {rec.user?.department || 'N/A'}
                      </Badge>
                    </td>
                    <td className="text-muted">{new Date(rec.date).toLocaleDateString()}</td>
                    <td className="text-main font-weight-semibold">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="text-main font-weight-semibold">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="text-muted">{rec.workingHours || 0} hrs</td>
                    <td>{getStatusBadge(rec.status)}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => openEditModal(rec)}>
                          <i className="bi bi-pencil-fill"></i> Edit
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          disabled={rec.isImplicit}
                          onClick={() => handleDeleteClick(rec)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination Controls */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <small className="text-muted">Showing {paginatedRecords.length} of {filteredRecords.length} records</small>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPage * itemsPerPage >= filteredRecords.length}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal: Mark Manual */}
      <Modal show={markModal} onHide={() => setMarkModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-glass-subtle">
          <Modal.Title className="text-main font-weight-bold">Mark Attendance Manually</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleManualMarkSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="text-muted">Select Employee <span className="text-danger">*</span></Form.Label>
              <Form.Select 
                className="form-control-glass form-select"
                required
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
              >
                <option value="">Choose Employee</option>
                {activeEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId || 'Active'})</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="text-muted">Select Date <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="date" 
                className="form-control-glass"
                required
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Check-In Time</Form.Label>
                  <Form.Control 
                    type="time" 
                    className="form-control-glass"
                    value={manualCheckInTime}
                    onChange={(e) => setManualCheckInTime(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Check-Out Time</Form.Label>
                  <Form.Control 
                    type="time" 
                    className="form-control-glass"
                    value={manualCheckOutTime}
                    onChange={(e) => setManualCheckOutTime(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-muted">Status <span className="text-danger">*</span></Form.Label>
              <Form.Select
                className="form-control-glass form-select"
                required
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value)}
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half-Day">Half Day</option>
                <option value="Absent">Absent</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="text-muted">Remarks</Form.Label>
              <Form.Control 
                as="textarea"
                rows={2}
                className="form-control-glass"
                placeholder="Remarks, override reasons..."
                value={manualRemarks}
                onChange={(e) => setManualRemarks(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle">
            <Button variant="secondary" onClick={() => setMarkModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="btn-premium">Mark Attendance</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal: Edit Punch */}
      <Modal show={editModal} onHide={() => setEditModal(false)} centered className="glass-modal">
        <Modal.Header closeButton className="border-glass-subtle">
          <Modal.Title className="text-main font-weight-bold">Edit Attendance Record</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editingRecord && (
              <div className="mb-3 p-3 bg-light-subtle rounded-3 border border-glass">
                <strong className="text-main d-block">{editingRecord.user?.name}</strong>
                <small className="text-muted">Employee ID: {editingRecord.user?.employeeId} | Dept: {editingRecord.user?.department}</small>
              </div>
            )}

            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Check-In Time</Form.Label>
                  <Form.Control 
                    type="time" 
                    className="form-control-glass"
                    value={editCheckInTime}
                    onChange={(e) => setEditCheckInTime(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label className="text-muted">Check-Out Time</Form.Label>
                  <Form.Control 
                    type="time" 
                    className="form-control-glass"
                    value={editCheckOutTime}
                    onChange={(e) => setEditCheckOutTime(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="text-muted">Status <span className="text-danger">*</span></Form.Label>
              <Form.Select
                className="form-control-glass form-select"
                required
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half-Day">Half Day</option>
                <option value="Absent">Absent</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="text-muted">Remarks</Form.Label>
              <Form.Control 
                as="textarea"
                rows={2}
                className="form-control-glass"
                placeholder="Remarks, correction justification..."
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-glass-subtle">
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="btn-premium">Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAttendance;
