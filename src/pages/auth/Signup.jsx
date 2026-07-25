import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import CompanyLogo from '../../components/common/CompanyLogo.jsx';

const Signup = () => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register: registerForm,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    const res = await register({
      name: data.name,
      email: data.email,
      employeeId: data.employeeId,
      password: data.password,
    });
    setLoading(false);

    if (res.success) {
      toast.success('Registration successful. Welcome!', { duration: 6000 });
      navigate('/employee/onboarding');
    } else {
      toast.error(res.message || 'Registration failed');
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
        className="auth-centered-box-split-reverse"
      >
        {/* Left branding panel (renders on the right on desktop, top on mobile) */}
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
                <i className="bi bi-person-plus auth-feature-icon"></i>
              </div>
              <div>
                <h6 className="auth-feature-title">Profile Onboarding</h6>
                <p className="auth-feature-desc">Complete your core details and documents submission</p>
              </div>
            </div>
            <div className="auth-feature-card">
              <div className="auth-feature-icon-wrapper">
                <i className="bi bi-card-image auth-feature-icon"></i>
              </div>
              <div>
                <h6 className="auth-feature-title">Digital ID Card</h6>
                <p className="auth-feature-desc">Generate your official employee badge automatically</p>
              </div>
            </div>
            <div className="auth-feature-card">
              <div className="auth-feature-icon-wrapper">
                <i className="bi bi-briefcase auth-feature-icon"></i>
              </div>
              <div>
                <h6 className="auth-feature-title">Staff Portal Access</h6>
                <p className="auth-feature-desc">Access your check-in sheets, leave records, and payslips</p>
              </div>
            </div>
          </div>

          <div className="d-none d-md-block text-white-50" style={{ fontSize: '0.75rem' }}>
            © 2026 Vinsup CRM Inc. All rights reserved.
          </div>
        </div>

        {/* Right Form Panel (renders on the left on desktop) */}
        <div className="auth-split-right">
          {/* On mobile, show logo/header layout since branding panel is collapsed */}
          <div className="d-md-none auth-logo-header mb-4">
            <div className="logo-wrapper bg-white p-2 rounded-3 shadow-sm d-inline-block">
              <CompanyLogo height={50} theme="light" />
            </div>
            <h3 className="font-weight-bold mt-2 m-0 text-main">VINSUP CRM</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Secure Staff Access Portal</p>
          </div>

          <div className="mb-4">
            <h4 className="font-weight-bold text-main m-0">Join Our Team</h4>
            <p className="text-muted m-0" style={{ fontSize: '0.85rem' }}>Set up your portal credentials to get started</p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="row g-3">
            {/* Full Name */}
            <div className="col-12 d-flex flex-column gap-1">
              <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
              <div className="auth-input-wrapper">
                <i className="bi bi-person auth-input-icon"></i>
                <input
                  type="text"
                  className="form-control form-control-auth w-100"
                  placeholder="John Doe"
                  {...registerForm('name', { required: 'Full Name is required' })}
                />
              </div>
              {errors.name && <small className="text-danger mt-1">{errors.name.message}</small>}
            </div>

            {/* Email Address */}
            <div className="col-md-6 d-flex flex-column gap-1">
              <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
              <div className="auth-input-wrapper">
                <i className="bi bi-envelope auth-input-icon"></i>
                <input
                  type="email"
                  className="form-control form-control-auth w-100"
                  placeholder="john@company.com"
                  {...registerForm('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                  })}
                />
              </div>
              {errors.email && <small className="text-danger mt-1">{errors.email.message}</small>}
            </div>

            {/* Employee ID */}
            <div className="col-md-6 d-flex flex-column gap-1">
              <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Employee ID</label>
              <div className="auth-input-wrapper">
                <i className="bi bi-card-text auth-input-icon"></i>
                <input
                  type="text"
                  className="form-control form-control-auth w-100"
                  placeholder="EMP-101"
                  {...registerForm('employeeId', { required: 'Employee ID is required' })}
                />
              </div>
              {errors.employeeId && <small className="text-danger mt-1">{errors.employeeId.message}</small>}
            </div>

            {/* Password */}
            <div className="col-md-6 d-flex flex-column gap-1">
              <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
              <div className="auth-input-wrapper">
                <i className="bi bi-lock auth-input-icon"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-auth w-100"
                  placeholder="••••••••"
                  {...registerForm('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Must be at least 6 characters' },
                  })}
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
              {errors.password && <small className="text-danger mt-1">{errors.password.message}</small>}
            </div>

            {/* Confirm Password */}
            <div className="col-md-6 d-flex flex-column gap-1">
              <label className="form-label text-muted m-0" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Confirm Password</label>
              <div className="auth-input-wrapper">
                <i className="bi bi-lock auth-input-icon"></i>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control form-control-auth w-100"
                  placeholder="••••••••"
                  {...registerForm('confirmPassword', {
                    required: 'Confirm Password is required',
                    validate: (val) => val === passwordVal || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && <small className="text-danger mt-1">{errors.confirmPassword.message}</small>}
            </div>

            {/* Actions */}
            <div className="col-12 mt-3 text-center">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-premium w-100 py-2.5 mb-2"
                style={{ fontSize: '0.95rem', fontWeight: 600 }}
              >
                {loading ? 'Creating Account...' : 'Register Employee Profile'}
              </button>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                Already registered? <Link to="/login" className="text-primary text-decoration-none font-weight-semibold">Log In</Link>
              </span>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
