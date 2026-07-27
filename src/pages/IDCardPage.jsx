import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/common/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation } from 'react-router-dom';
import api from '../services/api.js';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Form, Button, Badge } from 'react-bootstrap';
import toast from 'react-hot-toast';

import CompanyLogo from '../components/common/CompanyLogo.jsx';

const AuthorizedSignature = () => (
  <svg width="70" height="30" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 25C25 10 35 30 50 20C65 10 75 35 90 20" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 15C45 5 50 30 65 15" stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CompanySeal = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="20" fill="url(#sealGold)" stroke="#D97706" strokeWidth="1.5" />
    <circle cx="24" cy="24" r="16" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" />
    <path d="M24 12L27.09 18.26L34 19.27L29 24.14L30.18 31L24 27.75L17.82 31L19 24.14L14 19.27L20.91 18.26L24 12Z" fill="#F59E0B" />
    <defs>
      <linearGradient id="sealGold" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF3C7" />
        <stop offset="0.5" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#B45309" />
      </linearGradient>
    </defs>
  </svg>
);

// Barcode sub-component for front side of the ID Card
const Barcode = ({ value = "VSP-001" }) => {
  const bars = [];
  const str = String(value);
  for (let i = 0; i < 34; i++) {
    const charCode = str.charCodeAt(i % str.length) || 65;
    const thickness = (charCode % 3) + 1; // Generates line thicknesses: 1px, 2px, or 3px
    bars.push(thickness);
  }

  return (
    <div className="d-flex flex-column align-items-center mt-3">
      <div className="d-flex align-items-end" style={{ height: '28px', gap: '1.5px', background: 'transparent' }}>
        {bars.map((w, idx) => (
          <div
            key={idx}
            style={{
              width: `${w}px`,
              height: idx % 5 === 0 ? '28px' : '23px',
              backgroundColor: '#0F172A',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.55rem', letterSpacing: '2.5px', color: '#64748B', fontFamily: 'monospace', marginTop: '3.5px', fontWeight: 'bold' }}>
        {value}
      </span>
    </div>
  );
};

const IDCardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const location = useLocation();
  const qrCanvasRef = useRef(null);
  const cardFrontRef = useRef(null);
  const cardBackRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [cardData, setCardData] = useState(null);
  const [extraProfileData, setExtraProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchActiveEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/admin/employees?status=active&limit=100');
      if (data.success) {
        setEmployees(data.data.employees);
      }
    } catch (err) {
      console.warn('Failed to fetch employee list');
    }
  }, [isAdmin]);

  const loadCardDetails = useCallback(async (empId) => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? `/admin/idcard/${empId}` : `/employees/idcard/${empId}`;
      const { data } = await api.get(endpoint);
      if (data.success) {
        setCardData(data.data);
        if (!isAdmin) {
          // Fetch employee's own profile for address and emergency contact details
          const profileRes = await api.get('/employees/profile');
          if (profileRes.data.success) {
            setExtraProfileData(profileRes.data.data);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load card details');
      setCardData(null);
      setExtraProfileData(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const empIdParam = params.get('empId');

    if (isAdmin) {
      fetchActiveEmployees();
      if (empIdParam) {
        loadCardDetails(empIdParam);
      } else {
        setLoading(false);
      }
    } else if (user) {
      loadCardDetails(user.employeeId);
    }
  }, [isAdmin, user, fetchActiveEmployees, loadCardDetails, location.search]);

  // Fetch extra profile data for admin view once employees and cardData are loaded
  useEffect(() => {
    if (isAdmin && employees.length > 0 && cardData && (!extraProfileData || extraProfileData.user?.employeeId !== cardData.employeeId)) {
      const emp = employees.find((item) => item.employeeId === cardData.employeeId);
      if (emp) {
        api.get(`/admin/employees/${emp._id}`)
          .then(res => {
            if (res.data.success) {
              setExtraProfileData(res.data.data.profile);
            }
          })
          .catch(err => {
            console.warn('Failed to load extra profile', err);
            setExtraProfileData(null);
          });
      } else {
        setExtraProfileData(null);
      }
    }
  }, [isAdmin, employees, cardData, extraProfileData]);

  // Sync selected employee dropdown value when employees are loaded
  useEffect(() => {
    if (employees.length > 0) {
      const params = new URLSearchParams(location.search);
      const empIdParam = params.get('empId');
      if (empIdParam) {
        const emp = employees.find((item) => item.employeeId === empIdParam);
        if (emp) {
          setSelectedEmpId(emp._id);
        }
      }
    }
  }, [employees, location.search]);

  // Handle dropdown select
  const handleEmployeeChange = (e) => {
    const val = e.target.value;
    setSelectedEmpId(val);
    setExtraProfileData(null); // Reset extra profile data on change
    if (val) {
      const emp = employees.find((item) => item._id === val);
      if (emp && emp.employeeId) {
        loadCardDetails(emp.employeeId);
      }
    } else {
      setCardData(null);
    }
  };

  // Generate QR Code on canvas when cardData changes
  useEffect(() => {
    if (cardData && qrCanvasRef.current) {
      // Encode verification details
      const info = `ID:${cardData.employeeId}\nName:${cardData.name}\nDept:${cardData.department}\nStatus:${cardData.status}`;
      QRCode.toCanvas(
        qrCanvasRef.current,
        info,
        {
          width: 70,
          margin: 1,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [cardData]);

  // Export Front/Back as PDF
  const handleDownloadPDF = async () => {
    if (!cardFrontRef.current || !cardBackRef.current) return;
    setDownloading(true);
    toast.loading('Compiling PVC PDF document...');

    try {
      // Render elements to high-res canvases
      const frontCanvas = await html2canvas(cardFrontRef.current, { scale: 3, useCORS: true });
      const backCanvas = await html2canvas(cardBackRef.current, { scale: 3, useCORS: true });

      const frontImg = frontCanvas.toDataURL('image/png');
      const backImg = backCanvas.toDataURL('image/png');

      // PVC Standard Dimension approx 85.6mm x 53.98mm (standard CR80 ratio is ~1.58)
      // Standard print layout: 54mm width, 86mm height in portrait
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [86, 54],
      });

      // Page 1: Front
      pdf.addImage(frontImg, 'PNG', 0, 0, 54, 86);

      // Page 2: Back
      pdf.addPage([86, 54], 'portrait');
      pdf.addImage(backImg, 'PNG', 0, 0, 54, 86);

      toast.dismiss();
      pdf.save(`ID_Card_${cardData.employeeId}.pdf`);
      toast.success('ID Card PDF saved successfully');
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error('Error generating PDF file');
    } finally {
      setDownloading(false);
    }
  };

  // Helper to construct formatted address
  const getFormattedAddress = () => {
    if (!extraProfileData) return 'N/A';
    const parts = [
      extraProfileData.address,
      extraProfileData.city,
      extraProfileData.state,
      extraProfileData.pincode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  // Helper to construct formatted emergency contact
  const getFormattedEmergency = () => {
    if (!extraProfileData || !extraProfileData.emergencyContact) {
      return cardData.emergencyPhone || 'N/A';
    }
    const { name, relationship, phone } = extraProfileData.emergencyContact;
    const contactParts = [];
    if (name) contactParts.push(name);
    if (relationship) contactParts.push(`(${relationship})`);
    if (phone) {
      contactParts.push(phone);
    } else if (cardData.emergencyPhone) {
      contactParts.push(cardData.emergencyPhone);
    }
    return contactParts.length > 0 ? contactParts.join(' ') : 'N/A';
  };

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="Corporate ID Card Generator" />

      {/* Select Dropdown (For Admin View) */}
      {isAdmin && (
        <div className="glass-card p-4 mb-4">
          <Form.Group>
            <Form.Label className="text-muted">Select Active Employee to Generate Card</Form.Label>
            <Form.Select className="form-control-glass form-select" value={selectedEmpId} onChange={handleEmployeeChange}>
              <option value="">Choose Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId || 'Active'})</option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5 text-muted">Retrieving card information...</div>
      ) : !cardData ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-credit-card-2-front" style={{ fontSize: '2.5rem' }}></i>
          <p className="m-0 mt-3 font-weight-medium">Select an employee from the dropdown list to render their ID card.</p>
        </div>
      ) : !cardData.profilePhoto ? (
        <div className="glass-card p-5 text-center shadow-lg mx-auto" style={{ maxWidth: '500px' }}>
          <i className="bi bi-exclamation-octagon-fill text-danger mb-4" style={{ fontSize: '3.5rem' }}></i>
          <h4 className="text-danger font-weight-bold mb-3">Generation Blocked</h4>
          <p className="text-muted mb-0">
            Cannot generate Employee ID Card because the employee profile photo has not been uploaded.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column align-items-center gap-4">
          <div className="id-card-print-area d-flex flex-wrap justify-content-center gap-5 my-3">
            {/* Front Side Card */}
            <div>
              <p className="text-muted text-center font-weight-bold mb-2 d-print-none">FRONT VIEW</p>
              <div ref={cardFrontRef} className="id-card-wrap">
                <div className="id-card-header-bar" />
                <div className="id-card-glass">
                  {/* Card Header Brand */}
                  <div className="text-center pt-3 pb-1">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <CompanyLogo height={44} theme="light" />
                      <small className="text-muted mt-1" style={{ fontSize: '0.48rem', letterSpacing: '1.5px', fontWeight: '700', textTransform: 'uppercase' }}>CORPORATE ID CARD</small>
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <div className="text-center my-2">
                    <div className="id-photo-container">
                      {cardData.profilePhoto ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:https://crmbackend-nq36.onrender.com'}${cardData.profilePhoto}`}
                          alt="Photo"
                          className="id-photo-img"
                        />
                      ) : (
                        <div className="id-photo-fallback">
                          {cardData.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employee Info details */}
                  <div className="text-center mb-3">
                    <h5 className="id-name-text">{cardData.name}</h5>
                    <div className="mb-1">
                      <span className="id-badge">ID: {cardData.employeeId}</span>
                    </div>
                    <div className="id-department">{cardData.department || 'N/A'}</div>

                    {/* Barcode on Front Side */}
                    <Barcode value={cardData.employeeId} />
                  </div>

                  {/* Front Footer with Seal */}
                  <div className="d-flex justify-content-between align-items-end mt-auto pt-2 border-top" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                    <span className="text-muted" style={{ fontSize: '0.48rem', letterSpacing: '0.5px' }}>SECURE VERIFICATION CARD</span>
                    <div style={{ transform: 'scale(0.8)', transformOrigin: 'bottom right' }}>
                      <CompanySeal />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back Side Card */}
            <div>
              <p className="text-muted text-center font-weight-bold mb-2 d-print-none">BACK VIEW</p>
              <div ref={cardBackRef} className="id-card-wrap">
                <div className="id-card-header-bar" />
                <div className="id-card-glass">
                  {/* Return Notice */}
                  <div className="text-center pt-2">
                    <small className="text-muted d-block" style={{ fontSize: '0.5rem', letterSpacing: '0.5px' }}>IF FOUND, PLEASE RETURN TO:</small>
                    <p className="m-0 text-main font-weight-bold" style={{ fontSize: '0.58rem', marginTop: '2px' }}>
                      Vinsup Skill Academy
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="id-card-details-grid">
                    <div className="id-detail-item">
                      <span className="id-detail-label">Full Name</span>
                      <span className="id-detail-value text-truncate" style={{ maxWidth: '120px' }}>{cardData.name}</span>
                    </div>
                    <div className="id-detail-item">
                      <span className="id-detail-label">Employee ID</span>
                      <span className="id-detail-value">{cardData.employeeId}</span>
                    </div>
                    <div className="id-detail-item">
                      <span className="id-detail-label">Department</span>
                      <span className="id-detail-value">{cardData.department || 'N/A'}</span>
                    </div>
                    <div className="id-detail-item">
                      <span className="id-detail-label">Designation</span>
                      <span className="id-detail-value text-truncate" style={{ maxWidth: '120px' }}>{cardData.designation || 'N/A'}</span>
                    </div>
                    <div className="id-detail-item">
                      <span className="id-detail-label">Date of Birth</span>
                      <span className="id-detail-value">
                        {cardData.dob ? new Date(cardData.dob).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                    <div className="id-detail-item">
                      <span className="id-detail-label">Blood Group</span>
                      <span className="id-detail-value">{cardData.bloodGroup || 'N/A'}</span>
                    </div>
                    <div className="id-detail-item">
                      <span className="id-detail-label">Phone Number</span>
                      <span className="id-detail-value">{cardData.phone || 'N/A'}</span>
                    </div>
                    <div className="id-detail-item">
                      <span className="id-detail-label">Joining Date</span>
                      <span className="id-detail-value">
                        {cardData.joinDate ? new Date(cardData.joinDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                    <div className="id-detail-item full-width">
                      <span className="id-detail-label">Email Address</span>
                      <span className="id-detail-value text-truncate" style={{ maxWidth: '260px' }}>{cardData.email}</span>
                    </div>
                    <div className="id-detail-item full-width">
                      <span className="id-detail-label">Address</span>
                      <span className="id-detail-value text-truncate" style={{ display: 'block', maxWidth: '260px' }} title={getFormattedAddress()}>
                        {getFormattedAddress()}
                      </span>
                    </div>
                    <div className="id-detail-item full-width">
                      <span className="id-detail-label">Emergency Contact</span>
                      <span className="id-detail-value text-truncate" style={{ display: 'block', maxWidth: '260px' }} title={getFormattedEmergency()}>
                        {getFormattedEmergency()}
                      </span>
                    </div>
                  </div>

                  {/* QR, Validity and Signatures */}
                  <div className="d-flex align-items-center justify-content-between my-2 px-1">
                    <div className="d-flex flex-column align-items-center gap-1">
                      <div className="id-qr-box">
                        <canvas ref={qrCanvasRef} style={{ width: '64px', height: '64px', display: 'block' }}></canvas>
                      </div>
                      <small className="text-muted" style={{ fontSize: '0.45rem', letterSpacing: '0.5px' }}>SCAN TO VERIFY</small>
                    </div>

                    <div className="d-flex flex-column align-items-end justify-content-between" style={{ height: '75px', minWidth: '120px' }}>
                      <div className="text-end">
                        <span className="id-valid-badge">
                          Valid Thru: {new Date(cardData.validUntil).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-center position-relative w-100 mt-2">
                        <div style={{ opacity: 0.85, height: '24px' }} className="d-flex align-items-center justify-content-center">
                          <AuthorizedSignature />
                        </div>
                        <div className="text-muted mt-1" style={{ fontSize: '0.45rem', borderTop: '1px dashed rgba(15,23,42,0.15)', paddingTop: '2px' }}>
                          AUTHORIZED SIGNATURE
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Address Footer */}
                  <p className="id-footer-address text-center">
                    148, Gopalasamy Koil St, Ganapathy, Coimbatore - 641006                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="d-flex gap-3 d-print-none">
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="btn-premium px-4 py-2.5 d-flex align-items-center gap-2"
            >
              <i className="bi bi-file-earmark-pdf-fill"></i>
              <span>{downloading ? 'Exporting...' : 'Download PVC PDF'}</span>
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline-secondary"
              className="px-4 py-2.5 d-flex align-items-center gap-2"
              style={{ borderRadius: '10px' }}
            >
              <i className="bi bi-printer-fill"></i>
              <span>Print Card</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDCardPage;
