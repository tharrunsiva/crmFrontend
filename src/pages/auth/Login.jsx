import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CompanyLogo from '../../components/common/CompanyLogo.jsx';

const Login = () => {
  const { login, forgotPassword, resetPassword } = useAuth();
  const [role, setRole] = useState('employee'); // 'employee' or 'admin'
  const [forgotMode, setForgotMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm();
  const { register: registerForgot, handleSubmit: handleForgotSubmit } = useForm();
  const { register: registerReset, handleSubmit: handleResetSubmit } = useForm();

  const onLogin = async (data) => {
    setLoading(true);
    const res = await login(data.email, data.password, role);
    setLoading(false);
    if (res.success) {
      toast.success('Logged in successfully');
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(res.message || 'Login failed');
    }
  };

  const onSendOTP = async (data) => {
    setLoading(true);
    const res = await forgotPassword(data.email);
    setLoading(false);
    if (res.success) {
      toast.success('OTP sent to your email');
      setOtpEmail(data.email);
      setOtpSent(true);
    } else {
      toast.error(res.message || 'Request failed');
    }
  };

  const onReset = async (data) => {
    setLoading(true);
    const res = await resetPassword(otpEmail, data.otpCode, data.newPassword);
    setLoading(false);
    if (res.success) {
      toast.success('Password updated. Please log in.');
      setForgotMode(false);
      setOtpSent(false);
    } else {
      toast.error(res.message || 'Verification failed');
    }
  };

  return (
    <div className="auth-centered-container">
      {/* Background blobs */}
      <div className="auth-blob-wrapper">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="auth-centered-box-split"
      >
        {/* Left branding panel */}
        <div className="auth-split-left d-flex flex-column justify-content-between">
          <div className="d-flex flex-column gap-2 text-center text-md-start">
            <div className="mb-3 d-flex justify-content-center justify-content-md-start">
              <div className="bg-white p-2 rounded-3 shadow-sm d-inline-block">
                <CompanyLogo height={50} theme="light" />
              </div>
            </div>
            <h3 className="text-white font-weight-bold m-0" style={{ letterSpacing: '1px' }}>VINSUP CRM</h3>
            <p className="text-white-50 m-0" style={{ fontSize: '0.85rem' }}>Secure Staff Access Portal</p>
          </div>

          <div className="my-4 d-none d-md-flex flex-column gap-3 text-start">
            <div className="auth-feature-card">
              <div className="auth-feature-icon-wrapper">
                <i className="bi bi-shield-check auth-feature-icon"></i>
              </div>
              <div>
                <h6 className="auth-feature-title">Secure Integration</h6>
                <p className="auth-feature-desc">State-of-the-art authentication protocols</p>
              </div>
            </div>
            <div className="auth-feature-card">
              <div className="auth-feature-icon-wrapper">
                <i className="bi bi-cash-coin auth-feature-icon"></i>
              </div>
              <div>
                <h6 className="auth-feature-title">Automated Payroll</h6>
                <p className="auth-feature-desc">Digital payslip generation and history logs</p>
              </div>
            </div>
            <div className="auth-feature-card">
              <div className="auth-feature-icon-wrapper">
                <i className="bi bi-person-badge-fill auth-feature-icon"></i>
              </div>
              <div>
                <h6 className="auth-feature-title">Smart Attendance</h6>
                <p className="auth-feature-desc">Check-in systems and dashboard statistics</p>
              </div>
            </div>
          </div>

          <div className="d-none d-md-block text-white-50" style={{ fontSize: '0.75rem' }}>
            © 2026 Vinsup CRM Inc. All rights reserved.
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-split-right">
          <AnimatePresence mode="wait">
            {!forgotMode ? (
              <motion.div
                key="login-view"
                initial={{ x: -15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 15, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* On mobile, show logo/header layout since left panel is collapsed */}
                <div className="d-md-none auth-logo-header mb-4">
                  <div className="logo-wrapper bg-white p-2 rounded-3 shadow-sm d-inline-block">
                    <CompanyLogo height={50} theme="light" />
                  </div>
                  <h3 className="font-weight-bold mt-2 m-0 text-main">VINSUP CRM</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>Secure Staff Access Portal</p>
                </div>

                <div className="mb-4">
                  <h4 className="font-weight-bold text-main m-0">Welcome Back</h4>
                  <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Please enter details to access your dashboard</p>
                </div>

                {/* Role Toggle Switch */}
                <div className="d-flex bg-light-subtle rounded-3 p-1 mb-4 border border-glass">
                  <button
                    type="button"
                    onClick={() => setRole('employee')}
                    className={`btn w-50 py-2 border-0 ${role === 'employee' ? 'btn-premium text-white' : 'text-muted'}`}
                    style={{
                      background: role === 'employee' ? undefined : 'transparent',
                      boxShadow: role === 'employee' ? undefined : 'none',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: 600
                    }}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`btn w-50 py-2 border-0 ${role === 'admin' ? 'btn-premium text-white' : 'text-muted'}`}
                    style={{
                      background: role === 'admin' ? undefined : 'transparent',
                      boxShadow: role === 'admin' ? undefined : 'none',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      fontWeight: 600
                    }}
                  >
                    HR Admin
                  </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit(onLogin)} className="d-flex flex-column gap-3">
                  <div className="d-flex flex-column gap-1">
                    <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                    <div className="auth-input-wrapper">
                      <i className="bi bi-envelope auth-input-icon"></i>
                      <input
                        type="email"
                        className="form-control form-control-auth w-100"
                        placeholder="name@company.com"
                        defaultValue={localStorage.getItem('rememberedEmail') || ''}
                        {...registerLogin('email', { required: 'Email is required' })}
                      />
                    </div>
                    {loginErrors.email && <small className="text-danger mt-1">{loginErrors.email.message}</small>}
                  </div>

                  <div className="d-flex flex-column gap-1">
                    <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
                    <div className="auth-input-wrapper">
                      <i className="bi bi-shield-lock auth-input-icon"></i>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-auth w-100"
                        placeholder="••••••••"
                        {...registerLogin('password', { required: 'Password is required' })}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    {loginErrors.password && <small className="text-danger mt-1">{loginErrors.password.message}</small>}
                  </div>

                  {/* Actions & Utilities */}
                  <div className="d-flex justify-content-between align-items-center my-1">
                    <div className="form-check d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="rememberMe"
                        style={{ cursor: 'pointer' }}
                        {...registerLogin('rememberMe')}
                      />
                      <label className="form-check-label text-muted" htmlFor="rememberMe" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
                        Remember Me
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="btn btn-link p-0 text-decoration-none text-primary font-weight-medium"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-premium w-100 py-2.5 mt-2"
                    style={{ fontSize: '0.95rem', fontWeight: 600 }}
                  >
                    {loading ? 'Authenticating...' : `Log In as ${role === 'admin' ? 'Admin' : 'Employee'}`}
                  </button>

                  {role === 'employee' && (
                    <div className="text-center mt-2">
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                        New Staff member? <Link to="/signup" className="text-primary text-decoration-none font-weight-semibold">Register Profile</Link>
                      </span>
                    </div>
                  )}
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="forgot-view"
                initial={{ x: 15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -15, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {!otpSent ? (
                  <form onSubmit={handleForgotSubmit(onSendOTP)} className="d-flex flex-column gap-3">
                    <div className="mb-4">
                      <h4 className="font-weight-bold text-main m-0">Reset Password</h4>
                      <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Verify your email to request recovery</p>
                    </div>

                    <div className="d-flex flex-column gap-1">
                      <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                      <div className="auth-input-wrapper">
                        <i className="bi bi-envelope auth-input-icon"></i>
                        <input
                          type="email"
                          className="form-control form-control-auth w-100"
                          placeholder="name@company.com"
                          required
                          {...registerForgot('email')}
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setForgotMode(false)}
                        className="btn btn-outline-secondary w-50 py-2"
                        style={{ borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-premium w-50 py-2"
                        style={{ fontSize: '0.9rem', fontWeight: 600 }}
                      >
                        {loading ? 'Sending...' : 'Send OTP'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit(onReset)} className="d-flex flex-column gap-3">
                    <div className="mb-4">
                      <h4 className="font-weight-bold text-main m-0">Verify Identity</h4>
                      <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Enter security code sent to {otpEmail}</p>
                    </div>

                    <div className="d-flex flex-column gap-1">
                      <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>6-Digit OTP</label>
                      <input
                        type="text"
                        className="form-control form-control-glass text-center font-weight-bold"
                        style={{ letterSpacing: '4px', fontSize: '1.25rem', height: '48px', borderRadius: '10px' }}
                        placeholder="000000"
                        maxLength={6}
                        required
                        {...registerReset('otpCode')}
                      />
                    </div>

                    <div className="d-flex flex-column gap-1">
                      <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>New Password</label>
                      <div className="auth-input-wrapper">
                        <i className="bi bi-shield-lock auth-input-icon"></i>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control form-control-auth w-100"
                          placeholder="••••••••"
                          required
                          {...registerReset('newPassword')}
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password visibility"
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="d-flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="btn btn-outline-secondary w-50 py-2"
                        style={{ borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-premium w-50 py-2"
                        style={{ fontSize: '0.9rem', fontWeight: 600 }}
                      >
                        {loading ? 'Verifying...' : 'Reset Password'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
