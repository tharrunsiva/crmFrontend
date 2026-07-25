import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { submitOnboarding } from '../../services/profileService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Dedicated FileUploader React Sub-component
const FileUploader = ({ fieldName, label, uploadedFiles, previews, setUploadedFiles, setPreviews }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;

      // Size check: Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds the 5MB limit.');
        return;
      }

      // File validation
      if (fieldName === 'profilePhoto') {
        if (!file.type.startsWith('image/')) {
          toast.error('Profile photo must be an image (JPEG/JPG/PNG).');
          return;
        }
      } else if (fieldName === 'resume') {
        if (file.type !== 'application/pdf') {
          toast.error('Resume must be a PDF document.');
          return;
        }
      } else {
        // Aadhar, Pan
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          toast.error('File must be a PDF or an image.');
          return;
        }
      }

      setUploadedFiles((prev) => ({ ...prev, [fieldName]: file }));
      setPreviews((prev) => ({
        ...prev,
        [fieldName]: file.type.startsWith('image/') ? URL.createObjectURL(file) : 'pdf',
      }));
      toast.success(`${label} file attached`);
    },
    multiple: false,
    accept: fieldName === 'profilePhoto'
      ? { 'image/*': [] }
      : { 'image/*': [], 'application/pdf': [] },
  });

  const fileState = uploadedFiles[fieldName];
  const previewState = previews[fieldName];

  if (fieldName === 'profilePhoto') {
    return (
      <div className="col-12 mb-4 text-center">
        <label className="form-label text-muted d-block">
          {label} <span className="text-danger">*</span>
        </label>
        <div className="d-flex flex-column align-items-center justify-content-center">
          <div
            {...getRootProps()}
            className={`position-relative rounded-circle overflow-hidden mb-3 border border-2 border-dashed cursor-pointer transition-all ${
              isDragActive ? 'border-primary bg-primary-subtle' : 'border-glass bg-light-subtle'
            }`}
            style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
          >
            <input {...getInputProps()} />
            {fileState && previewState && previewState !== 'pdf' ? (
              <img
                src={previewState}
                alt="Profile Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div className="text-center">
                <i className="bi bi-camera-fill text-muted" style={{ fontSize: '2rem' }}></i>
                <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>Upload Photo</span>
              </div>
            )}
          </div>
          {fileState && (
            <small className="text-success font-weight-medium d-block mb-2">
              {fileState.name} ({(fileState.size / (1024 * 1024)).toFixed(2)} MB)
            </small>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="col-md-4 mb-3">
      <label className="form-label text-muted">
        {label} <span className="text-danger">*</span>
      </label>
      <div
        {...getRootProps()}
        className={`border border-2 border-dashed rounded-3 p-3 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-primary bg-primary-subtle' : 'border-glass bg-light-subtle'
        }`}
        style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer' }}
      >
        <input {...getInputProps()} />
        {fileState ? (
          <div className="d-flex align-items-center justify-content-center gap-3">
            {previewState && previewState !== 'pdf' ? (
              <img
                src={previewState}
                alt="preview"
                className="rounded"
                style={{ width: '56px', height: '56px', objectFit: 'cover' }}
              />
            ) : (
              <div className="bg-danger text-white rounded p-2" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                <i className="bi bi-file-earmark-pdf-fill"></i>
              </div>
            )}
            <div className="text-start">
              <span className="d-block text-main text-truncate font-weight-medium" style={{ maxWidth: '100px', fontSize: '0.85rem' }}>
                {fileState.name}
              </span>
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                {(fileState.size / (1024 * 1024)).toFixed(2)} MB
              </small>
            </div>
          </div>
        ) : (
          <div>
            <i className="bi bi-cloud-arrow-up-fill text-primary" style={{ fontSize: '1.6rem' }}></i>
            <small className="d-block text-muted mt-1" style={{ fontSize: '0.8rem' }}>
              Drag & drop or Click
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

const Onboarding = () => {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  // Document files cache
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [previews, setPreviews] = useState({});

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      employeeId: user?.employeeId || '',
      phone: user?.phone || '',
      department: user?.department || '',
      designation: user?.designation || '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
    },
  });

  const validateStep1 = () => {
    const requiredFields = [
      { name: 'dob', label: 'Date of Birth' },
      { name: 'bloodGroup', label: 'Blood Group' },
      { name: 'gender', label: 'Gender' },
      { name: 'phone', label: 'Phone Number' },
      { name: 'address', label: 'Complete Address' },
      { name: 'city', label: 'City' },
      { name: 'state', label: 'State' },
      { name: 'country', label: 'Country' },
      { name: 'pincode', label: 'Pincode' },
    ];
    for (const f of requiredFields) {
      const val = watch(f.name);
      if (!val || String(val).trim() === '') {
        toast.error(`${f.label} is required`);
        return false;
      }
    }
    if (!uploadedFiles['profilePhoto']) {
      toast.error('Profile Photo is required.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const requiredDocs = [
      { name: 'resume', label: 'Resume' },
      { name: 'aadhar', label: 'Aadhaar Card' },
      { name: 'pan', label: 'PAN Card' },
    ];
    for (const doc of requiredDocs) {
      if (!uploadedFiles[doc.name]) {
        toast.error(`${doc.label} is required`);
        return false;
      }
    }
    const requiredFields = [
      { name: 'emergencyName', label: 'Emergency Contact Name' },
      { name: 'emergencyRelation', label: 'Relationship' },
      { name: 'emergencyPhone', label: 'Emergency Contact Number' },
    ];
    for (const f of requiredFields) {
      const val = watch(f.name);
      if (!val || String(val).trim() === '') {
        toast.error(`${f.label} is required`);
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (data) => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    const formData = new FormData();

    // Append text inputs
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    // Append document binaries
    Object.keys(uploadedFiles).forEach((key) => {
      formData.append(key, uploadedFiles[key]);
    });

    try {
      const res = await submitOnboarding(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      if (res.success) {
        toast.success('Onboarding details submitted successfully!', { duration: 6000 });
        const updatedUser = { ...user, status: 'pending', onboardingStep: 1 };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.href = '/';
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Onboarding submission failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setLoading(false);
    }
  };

  const progressPercent = step === 1 ? 50 : 100;

  const isSubmitDisabled =
    !uploadedFiles['profilePhoto'] ||
    !uploadedFiles['resume'] ||
    !uploadedFiles['aadhar'] ||
    !uploadedFiles['pan'] ||
    !watch('emergencyName')?.trim() ||
    !watch('emergencyRelation')?.trim() ||
    !watch('emergencyPhone')?.trim();

  return (
    <div
      className="min-vh-100 p-4 d-flex align-items-center justify-content-center"
      style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(79, 70, 229, 0.04) 100%)',
      }}
    >
      <div className="w-100" style={{ maxWidth: '780px' }}>
        {/* Progress Header */}
        <div className="glass-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h4 className="m-0 font-weight-bold text-main">Vinsup Onboarding Portal</h4>
              <small className="text-muted">Section {step} of 2</small>
            </div>
            <button onClick={logout} className="btn btn-outline-danger btn-sm rounded-pill px-3">
              Sign Out
            </button>
          </div>
          <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
            <div
              className="progress-bar bg-primary"
              style={{ width: `${progressPercent}%`, transition: 'width 0.4s ease' }}
            ></div>
          </div>
        </div>

        {/* Upload progress indicator */}
        {isUploading && (
          <div className="glass-card p-4 mb-4">
            <h6 className="text-main font-weight-bold mb-2">Uploading Onboarding Documents... {uploadProgress}%</h6>
            <div className="progress" style={{ height: '10px', borderRadius: '5px' }}>
              <div
                className="progress-bar bg-success progress-bar-striped progress-bar-animated"
                style={{ width: `${uploadProgress}%`, transition: 'width 0.1s ease' }}
              ></div>
            </div>
          </div>
        )}

        {/* Form Panel */}
        {user?.status === 'changes_requested' && (
          <div className="alert alert-warning border-warning-subtle shadow-sm mb-4 p-3 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Action Required:</strong> The administrator has requested corrections to your onboarding details. Please review your information, update the fields/documents, and re-submit for review.
          </div>
        )}

        <div className="glass-card p-5">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (step === 1) {
              if (validateStep1()) setStep(2);
            } else {
              if (validateStep2()) handleSubmit(onSubmit)(e);
            }
          }}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="row g-3"
                >
                  <h5 className="text-main font-weight-bold mb-3 border-bottom pb-2 border-glass">
                    Section 1: Personal Information
                  </h5>

                  {/* Profile Photo */}
                  <FileUploader
                    fieldName="profilePhoto"
                    label="Profile Photo (COMPULSORY)"
                    uploadedFiles={uploadedFiles}
                    previews={previews}
                    setUploadedFiles={setUploadedFiles}
                    setPreviews={setPreviews}
                  />

                  {/* Prefilled Account Credentials */}
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Full Name</label>
                    <input type="text" className="form-control form-control-glass" disabled {...register('name')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Email Address</label>
                    <input type="email" className="form-control form-control-glass" disabled {...register('email')} />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label text-muted small">Employee ID</label>
                    <input type="text" className="form-control form-control-glass" disabled {...register('employeeId')} />
                  </div>

                  {/* Personal Inputs */}
                  <div className="col-md-4 mt-4">
                    <label className="form-label text-muted">Date of Birth <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control form-control-glass"
                      required
                      {...register('dob', { required: 'Date of Birth is required' })}
                    />
                  </div>
                  <div className="col-md-4 mt-4">
                    <label className="form-label text-muted">Blood Group <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-glass"
                      placeholder="e.g. O+ or A-"
                      required
                      {...register('bloodGroup', { required: 'Blood Group is required' })}
                    />
                  </div>
                  <div className="col-md-4 mt-4">
                    <label className="form-label text-muted">Phone Number <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-glass"
                      placeholder="e.g. +91 9876543210"
                      required
                      {...register('phone', { required: 'Phone Number is required' })}
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label text-muted">Gender <span className="text-danger">*</span></label>
                    <select className="form-select form-control-glass" required {...register('gender', { required: 'Gender is required' })}>
                      <option value="">Choose Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Address info */}
                  <h6 className="text-main font-weight-semibold mt-4 mb-2">Complete Address Details</h6>
                  <div className="col-12">
                    <label className="form-label text-muted">Street Address <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-glass" placeholder="Apartment, block, street details..." required {...register('address')} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted">City <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-glass" required {...register('city')} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted">State <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-glass" required {...register('state')} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted">Country <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-glass" required {...register('country')} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label text-muted">Pincode <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-glass" required {...register('pincode')} />
                  </div>

                  <div className="d-flex justify-content-end mt-5">
                    <button type="button" onClick={() => { if (validateStep1()) setStep(2); }} className="btn btn-premium px-5">
                      Next: Documents & Info <i className="bi bi-arrow-right"></i>
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="row g-3"
                >
                  <h5 className="text-main font-weight-bold mb-4 border-bottom pb-2 border-glass">
                    Section 2: Documents & Emergency Contact
                  </h5>

                  {/* Required Documents */}
                  <FileUploader
                    fieldName="resume"
                    label="Resume (Required PDF)"
                    uploadedFiles={uploadedFiles}
                    previews={previews}
                    setUploadedFiles={setUploadedFiles}
                    setPreviews={setPreviews}
                  />
                  <FileUploader
                    fieldName="aadhar"
                    label="Aadhaar Card (Required PDF/Image)"
                    uploadedFiles={uploadedFiles}
                    previews={previews}
                    setUploadedFiles={setUploadedFiles}
                    setPreviews={setPreviews}
                  />
                  <FileUploader
                    fieldName="pan"
                    label="PAN Card (Required PDF/Image)"
                    uploadedFiles={uploadedFiles}
                    previews={previews}
                    setUploadedFiles={setUploadedFiles}
                    setPreviews={setPreviews}
                  />

                  {/* Emergency Contact */}
                  <h6 className="text-main font-weight-semibold mt-4 mb-2">Emergency Contact Details</h6>
                  <div className="col-md-4">
                    <label className="form-label text-muted">Emergency Contact Name <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-glass" required {...register('emergencyName')} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted">Relationship <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-glass" placeholder="e.g. Father or Spouse" required {...register('emergencyRelation')} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted">Emergency Contact Number <span className="text-danger">*</span></label>
                    <input type="text" className="form-control form-control-glass" required {...register('emergencyPhone')} />
                  </div>

                  <div className="d-flex justify-content-between mt-5">
                    <button type="button" onClick={() => setStep(1)} className="btn btn-outline-secondary px-4 py-2" style={{ borderRadius: '10px' }}>
                      Previous
                    </button>
                    <button type="submit" disabled={isSubmitDisabled || loading} className="btn btn-premium px-5">
                      {loading ? 'Submitting Details...' : 'Submit Onboarding'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
