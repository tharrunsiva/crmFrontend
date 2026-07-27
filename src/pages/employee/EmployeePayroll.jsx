import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import { getMyPayrollHistory, downloadPayslipUrl } from '../../services/payrollService.js';
import { Table, Button, Badge } from 'react-bootstrap';
import toast from 'react-hot-toast';
import axios from 'axios';

const EmployeePayroll = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await getMyPayrollHistory();
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      toast.error('Failed to load payroll logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDownload = async (id, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios({
        url: `${import.meta.env.VITE_API_URL || 'http://localhost:https://crmbackend-nq36.onrender.com/api'}/payroll/${id}/download`,
        method: 'GET',
        responseType: 'blob', // Important
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Create local URL and force download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Payslip downloaded successfully');
    } catch (err) {
      toast.error('Could not download payslip');
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
      <Navbar pageTitle="Salary Payslips" />

      <div className="glass-card p-4">
        <h5 className="text-main font-weight-bold mb-3">Payslip History Logs</h5>
        
        {loading ? (
          <div className="text-center py-4 text-muted">Retrieving payroll records...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-wallet2" style={{ fontSize: '2rem' }}></i>
            <p className="m-0 mt-2">No salary payslips generated yet</p>
          </div>
        ) : (
          <Table responsive hover className="align-middle border-0 m-0">
            <thead>
              <tr className="border-bottom border-glass text-muted" style={{ fontSize: '0.85rem' }}>
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
              {history.map((pay) => (
                <tr key={pay._id} className="border-bottom border-glass-subtle">
                  <td className="text-main font-weight-semibold">
                    {getMonthName(pay.month)} {pay.year}
                  </td>
                  <td className="text-muted">Rs. {pay.basicSalary.toLocaleString()}</td>
                  <td className="text-muted">Rs. {pay.allowances.toLocaleString()}</td>
                  <td className="text-success">+Rs. {pay.bonus.toLocaleString()}</td>
                  <td className="text-danger">-Rs. {pay.deductions.toLocaleString()}</td>
                  <td className="text-main font-weight-bold">Rs. {pay.netSalary.toLocaleString()}</td>
                  <td>
                    <Badge bg={pay.status === 'Paid' ? 'success' : 'warning'} className="px-2 py-1">
                      {pay.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="rounded-pill px-3"
                      onClick={() => handleDownload(pay._id, `payslip_${getMonthName(pay.month)}_${pay.year}.pdf`)}
                    >
                      <i className="bi bi-file-earmark-pdf"></i> Download PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default EmployeePayroll;
