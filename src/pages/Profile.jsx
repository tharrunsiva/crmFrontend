import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/common/Navbar.jsx';
import { getMyProfile, updateMyProfile } from '../services/profileService.js';
import { useForm } from 'react-hook-form';
import { Row, Col, Button, Form, ProgressBar } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '../config.js';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const loadProfile = useCallback(async () => {
    try {
      const res = await getMyProfile();
      if (res.success) {
        setProfile(res.data);
        // Pre-fill form
        reset({
          phone: res.data.user.phone,
          address: res.data.address,
          city: res.data.city,
          state: res.data.state,
          country: res.data.country,
          pincode: res.data.pincode,
          skills: res.data.skills?.join(', '),
          emergencyName: res.data.emergencyContact?.name,
          emergencyRelationship: res.data.emergencyContact?.relationship,
          emergencyPhone: res.data.emergencyContact?.phone,
        });
      }
    } catch (err) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onSubmit = async (data) => {
    setBtnLoading(true);
    try {
      // Format skills comma list to array
      const skillsArr = data.skills
        ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        skills: skillsArr,
        emergencyContact: {
          name: data.emergencyName,
          relationship: data.emergencyRelationship,
          phone: data.emergencyPhone,
        },
      };

      const res = await updateMyProfile(payload);
      if (res.success) {
        toast.success(res.message);
        loadProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
        <Navbar pageTitle="My Profile Record" />
        <div className="text-center py-5 text-muted">Retrieving profile...</div>
      </div>
    );
  }

  const { user, profileCompletion } = profile;

  return (
    <div className="p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
      <Navbar pageTitle="My Personal Profile" />

      {/* Completion Bar banner */}
      <div className="glass-card p-4 mb-4">
        <Row className="align-items-center">
          <Col sm={8}>
            <h5 className="text-main font-weight-bold m-0 mb-1">Profile Completeness</h5>
            <small className="text-muted">Ensure all fields are entered for full record audits</small>
            <ProgressBar now={profileCompletion} label={`${profileCompletion}%`} variant="success" className="mt-3" style={{ height: '20px', borderRadius: '10px' }} />
          </Col>
          <Col sm={4} className="text-center mt-3 mt-sm-0">
            {profile.documents?.profilePhoto ? (
              <img
                src={`${BACKEND_URL}${profile.documents.profilePhoto.startsWith('/') ? '' : '/'}${profile.documents.profilePhoto}`}
                alt="Avatar"
                className="shadow"
                style={{ width: '130px', height: '130px', objectFit: 'cover', border: '1.5px solid #000000', borderRadius: '14px' }}
              />
            ) : (
              <div className="bg-secondary text-white d-inline-flex align-items-center justify-content-center shadow" style={{ width: '130px', height: '130px', fontSize: '2.5rem', fontWeight: 'bold', borderRadius: '14px' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </Col>
        </Row>
      </div>

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row className="g-4">
          {/* Main Info */}
          <Col lg={8}>
            <div className="glass-card p-4 d-flex flex-column gap-3 mb-4">
              <h5 className="text-main font-weight-bold mb-3 border-bottom pb-2 border-glass">Contact Information</h5>
              <Row className="g-3">
                <Col sm={6}>
                  <Form.Group>
                    <Form.Label className="text-muted">Mobile Phone</Form.Label>
                    <Form.Control type="text" className="form-control-glass" {...register('phone')} />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group>
                    <Form.Label className="text-muted">Personal Email (Read-Only)</Form.Label>
                    <Form.Control type="email" className="form-control-glass" value={user.email} disabled />
                  </Form.Group>
                </Col>
                <Col sm={12}>
                  <Form.Group>
                    <Form.Label className="text-muted">Street Address</Form.Label>
                    <Form.Control type="text" className="form-control-glass" {...register('address')} />
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  <Form.Group>
                    <Form.Label className="text-muted">City</Form.Label>
                    <Form.Control type="text" className="form-control-glass" {...register('city')} />
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  <Form.Group>
                    <Form.Label className="text-muted">State</Form.Label>
                    <Form.Control type="text" className="form-control-glass" {...register('state')} />
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  <Form.Group>
                    <Form.Label className="text-muted">Pincode</Form.Label>
                    <Form.Control type="text" className="form-control-glass" {...register('pincode')} />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            {/* Emergency Contacts */}
            <div className="glass-card p-4 d-flex flex-column gap-3">
              <h5 className="text-main font-weight-bold mb-3 border-bottom pb-2 border-glass">Emergency Contact</h5>
              <Row className="g-3">
                <Col sm={4}>
                  <Form.Group>
                    <Form.Label className="text-muted">Contact Name</Form.Label>
                    <Form.Control type="text" className="form-control-glass" {...register('emergencyName')} />
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  <Form.Group>
                    <Form.Label className="text-muted">Relationship</Form.Label>
                    <Form.Control type="text" className="form-control-glass" {...register('emergencyRelationship')} />
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  <Form.Group>
                    <Form.Label className="text-muted">Phone Number</Form.Label>
                    <Form.Control type="text" className="form-control-glass" {...register('emergencyPhone')} />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Col>

          {/* Sidebar parameters */}
          <Col lg={4}>
            <div className="glass-card p-4 mb-4 d-flex flex-column gap-3">
              <h5 className="text-main font-weight-bold border-bottom pb-2 border-glass">Employment Details</h5>
              <div>
                <strong className="text-muted d-block small">Employee ID</strong>
                <span className="text-main font-weight-medium">{user.employeeId || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-muted d-block small">Department</strong>
                <span className="text-main font-weight-medium">{user.department || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-muted d-block small">Designation</strong>
                <span className="text-main font-weight-medium">{user.designation || 'N/A'}</span>
              </div>
              <div>
                <strong className="text-muted d-block small">Joining Date</strong>
                <span className="text-main font-weight-medium">{new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="glass-card p-4 mb-4 d-flex flex-column gap-3">
              <h5 className="text-main font-weight-bold border-bottom pb-2 border-glass">Skills inventory</h5>
              <Form.Group>
                <Form.Label className="text-muted small">Skills (comma separated)</Form.Label>
                <Form.Control as="textarea" rows={3} className="form-control-glass" {...register('skills')} placeholder="e.g. JavaScript, Python, CSS" />
              </Form.Group>
            </div>

            {/* Uploaded Onboarding Documents Section */}
            <div className="glass-card p-4 mb-4 d-flex flex-column gap-3">
              <h5 className="text-main font-weight-bold border-bottom pb-2 border-glass">My Onboarding Documents</h5>
              <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
                <div>
                  <strong className="text-muted d-block small">Resume / CV</strong>
                  {profile.documents?.resume ? (
                    <a
                      href={`${BACKEND_URL}${profile.documents.resume}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-decoration-none font-weight-medium d-inline-flex align-items-center gap-1 mt-1"
                    >
                      <i className="bi bi-file-earmark-pdf"></i> View Resume
                    </a>
                  ) : (
                    <span className="text-muted">Not Uploaded</span>
                  )}
                </div>
                <div className="mt-2">
                  <strong className="text-muted d-block small">Aadhar Card</strong>
                  {profile.documents?.aadhar ? (
                    <a
                      href={`${BACKEND_URL}${profile.documents.aadhar}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-decoration-none font-weight-medium d-inline-flex align-items-center gap-1 mt-1"
                    >
                      <i className="bi bi-file-earmark-pdf"></i> View Aadhar Card
                    </a>
                  ) : (
                    <span className="text-muted">Not Uploaded</span>
                  )}
                </div>
                <div className="mt-2">
                  <strong className="text-muted d-block small">PAN Card</strong>
                  {profile.documents?.pan ? (
                    <a
                      href={`${BACKEND_URL}${profile.documents.pan}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-decoration-none font-weight-medium d-inline-flex align-items-center gap-1 mt-1"
                    >
                      <i className="bi bi-file-earmark-pdf"></i> View PAN Card
                    </a>
                  ) : (
                    <span className="text-muted">Not Uploaded</span>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="btn-premium w-100 py-3" disabled={btnLoading}>
              {btnLoading ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default Profile;
// Completed
