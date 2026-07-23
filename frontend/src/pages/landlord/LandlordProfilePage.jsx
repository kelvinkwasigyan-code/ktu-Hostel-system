// src/pages/landlord/LandlordProfilePage.jsx
import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Lock, User, Phone, Image, FileText, CheckCircle, AlertCircle, Save, Sparkles } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LandlordSidebar from '../../components/LandlordSidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
];

export default function LandlordProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields (editable non-sensitive info)
  const [formData, setFormData] = useState({
    phone: '',
    profile_picture: '',
    bio: ''
  });

  // Locked user info (fetched from server)
  const [profileInfo, setProfileInfo] = useState({
    full_name: '',
    email: '',
    role: 'Landlord',
    verification_status: 'Pending',
    id_document_path: null,
    created_at: null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/auth/profile');
      const u = res.data?.user || user;
      
      setProfileInfo({
        full_name: u.full_name || user?.full_name || '',
        email: u.email || user?.email || '',
        role: u.role || 'Landlord',
        verification_status: u.verification_status || 'Pending',
        id_document_path: u.id_document_path || null,
        created_at: u.created_at || null
      });

      setFormData({
        phone: u.phone || user?.phone || '',
        profile_picture: u.profile_picture || '',
        bio: u.bio || ''
      });
    } catch (err) {
      console.error('Failed to load landlord profile:', err);
      // Fallback to auth context
      if (user) {
        setProfileInfo({
          full_name: user.full_name || '',
          email: user.email || '',
          role: user.role || 'Landlord',
          verification_status: user.verification_status || 'Pending',
          id_document_path: user.id_document_path || null,
          created_at: user.created_at || null
        });
        setFormData({
          phone: user.phone || '',
          profile_picture: user.profile_picture || '',
          bio: user.bio || ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Frontend validation
    if (!formData.phone || !formData.phone.trim()) {
      setErrorMsg('Phone number is required so students can contact you.');
      return;
    }

    if (formData.bio && formData.bio.length > 500) {
      setErrorMsg('Landlord bio cannot exceed 500 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.put('/auth/profile', {
        phone: formData.phone.trim(),
        profile_picture: formData.profile_picture ? formData.profile_picture.trim() : null,
        bio: formData.bio ? formData.bio.trim() : null
      });

      setSuccessMsg(res.data?.message || 'Profile information updated successfully!');
      
      if (res.data?.user) {
        updateUser(res.data.user);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarSelect = (url) => {
    setFormData(prev => ({ ...prev, profile_picture: url }));
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-loader">
          <div className="spinner-ring"></div>
        </div>
      </>
    );
  }

  const isVerified = profileInfo.verification_status === 'Approved';

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <LandlordSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">Landlord Profile Settings</h2>
                <p className="text-muted-custom mb-0">Update your public contact info, profile picture, and landlord biography.</p>
              </div>
            </div>

            {/* Success / Error Alerts */}
            {successMsg && (
              <div className="alert alert-success d-flex align-items-center gap-2 mb-4 rounded-custom border-0 shadow-sm" role="alert">
                <CheckCircle size={20} className="flex-shrink-0" />
                <div>{successMsg}</div>
              </div>
            )}

            {errorMsg && (
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 rounded-custom border-0 shadow-sm" role="alert">
                <AlertCircle size={20} className="flex-shrink-0" />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Lock Notice Banner */}
            <div className="card p-4 mb-4 border-0 rounded-custom" style={{
              background: 'linear-gradient(135deg, rgba(10, 34, 64, 0.06) 0%, rgba(224, 109, 6, 0.05) 100%)',
              borderLeft: '4px solid var(--logo-navy)'
            }}>
              <div className="d-flex gap-3 align-items-start">
                <div className="p-2 rounded-circle bg-white text-navy shadow-sm flex-shrink-0">
                  <Lock size={24} style={{ color: 'var(--logo-navy)' }} />
                </div>
                <div>
                  <h5 className="mb-1" style={{ color: 'var(--logo-navy)', fontWeight: 700 }}>
                    Security & Verification Integrity Notice
                  </h5>
                  <p className="text-muted-custom mb-0" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                    Primary identity credentials (<strong>Legal Name, Email Address, and Govt ID Verification Document</strong>) are permanently locked to preserve the integrity of our admin verification system and protect KTU students against identity spoofing. 
                    If you need to change your official legal name, please contact campus platform administration.
                  </p>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {/* Left Column: Profile Card & Preview */}
              <div className="col-lg-4">
                <div className="card p-4 border-custom bg-surface rounded-custom h-100 text-center">
                  <div className="position-relative d-inline-block mx-auto mb-3">
                    <img
                      src={formData.profile_picture || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'}
                      alt={profileInfo.full_name}
                      className="rounded-circle shadow-sm"
                      style={{
                        width: '130px',
                        height: '130px',
                        objectFit: 'cover',
                        border: '4px solid var(--surface-2)'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400';
                      }}
                    />
                    <span className={`position-absolute bottom-0 end-0 badge rounded-pill p-2 ${isVerified ? 'bg-success' : 'bg-warning text-dark'}`}
                          title={`Verification Status: ${profileInfo.verification_status}`}>
                      {isVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    </span>
                  </div>

                  <h4 className="mb-1 font-outfit fw-bold">{profileInfo.full_name}</h4>
                  <p className="text-muted-custom small mb-2">{profileInfo.email}</p>

                  <div className="d-flex justify-content-center gap-2 mb-3">
                    <span className="badge bg-navy-subtle text-navy px-3 py-1 rounded-pill" style={{ fontSize: '0.78rem' }}>
                      <User size={13} className="me-1" /> {profileInfo.role}
                    </span>
                    <span className={`badge px-3 py-1 rounded-pill ${isVerified ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`} style={{ fontSize: '0.78rem' }}>
                      {isVerified ? '✓ Verified Landlord' : '⏳ Verification Pending'}
                    </span>
                  </div>

                  {formData.bio && (
                    <div className="p-3 bg-surface-2 rounded-custom text-start mb-3" style={{ fontSize: '0.85rem' }}>
                      <strong className="d-block text-muted-custom mb-1" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Public Bio Preview:</strong>
                      <p className="mb-0 text-secondary" style={{ fontStyle: 'italic', lineHeight: '1.4' }}>"{formData.bio}"</p>
                    </div>
                  )}

                  <hr className="my-3 text-border" />

                  {/* Preset Avatar Selection */}
                  <div className="text-start">
                    <label className="form-label small fw-semibold text-muted-custom mb-2">
                      <Sparkles size={14} className="me-1 text-orange" /> Select Sample Avatar:
                    </label>
                    <div className="d-flex justify-content-around">
                      {DEFAULT_AVATARS.map((avatarUrl, idx) => (
                        <img
                          key={idx}
                          src={avatarUrl}
                          alt={`Preset avatar ${idx + 1}`}
                          className={`rounded-circle cursor-pointer border ${formData.profile_picture === avatarUrl ? 'border-primary border-3' : 'border-light'}`}
                          style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                          onClick={() => handleAvatarSelect(avatarUrl)}
                          title="Click to use this avatar photo"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Edit Form */}
              <div className="col-lg-8">
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <h4 className="mb-4 font-outfit fw-bold d-flex align-items-center gap-2">
                    <User size={22} className="text-orange" /> Edit Profile Details
                  </h4>

                  <form onSubmit={handleSubmit}>
                    {/* Section 1: Locked Identity Fields */}
                    <div className="mb-4">
                      <h6 className="text-uppercase text-muted-custom fw-bold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        🔒 Locked Primary Credentials (Read-Only)
                      </h6>

                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-muted-custom small">Full Name</label>
                          <div className="input-group">
                            <span className="input-group-text bg-surface-2 text-muted-custom"><Lock size={16} /></span>
                            <input
                              type="text"
                              className="form-control bg-surface-2 text-muted-custom"
                              value={profileInfo.full_name}
                              disabled
                              readOnly
                            />
                          </div>
                          <small className="form-text text-muted-custom" style={{ fontSize: '0.72rem' }}>Must match govt ID document</small>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-muted-custom small">Email Address</label>
                          <div className="input-group">
                            <span className="input-group-text bg-surface-2 text-muted-custom"><Lock size={16} /></span>
                            <input
                              type="email"
                              className="form-control bg-surface-2 text-muted-custom"
                              value={profileInfo.email}
                              disabled
                              readOnly
                            />
                          </div>
                          <small className="form-text text-muted-custom" style={{ fontSize: '0.72rem' }}>Used for account logins and notifications</small>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-muted-custom small">Account Role</label>
                          <div className="input-group">
                            <span className="input-group-text bg-surface-2 text-muted-custom"><Lock size={16} /></span>
                            <input
                              type="text"
                              className="form-control bg-surface-2 text-muted-custom"
                              value={profileInfo.role}
                              disabled
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold text-muted-custom small">Govt ID Verification Status</label>
                          <div className="input-group">
                            <span className="input-group-text bg-surface-2 text-muted-custom"><Lock size={16} /></span>
                            <input
                              type="text"
                              className="form-control bg-surface-2 text-muted-custom"
                              value={profileInfo.verification_status}
                              disabled
                              readOnly
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="my-4 text-border" />

                    {/* Section 2: Editable Non-Sensitive Fields */}
                    <div className="mb-4">
                      <h6 className="text-uppercase text-orange fw-bold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        ✏️ Editable Contact & Bio Info
                      </h6>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          <Phone size={16} className="me-1 text-orange" /> Contact Phone Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. +233 24 412 3456"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                        <small className="form-text text-muted-custom">
                          This phone number is shared with students after you approve their 24-hour reservation holds.
                        </small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          <Image size={16} className="me-1 text-orange" /> Profile Photo Image URL
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://example.com/avatar.jpg"
                          value={formData.profile_picture}
                          onChange={(e) => setFormData(prev => ({ ...prev, profile_picture: e.target.value }))}
                        />
                        <small className="form-text text-muted-custom">
                          Paste an image link or select one of the sample avatars on the left card.
                        </small>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="form-label fw-semibold mb-0">
                            <FileText size={16} className="me-1 text-orange" /> Landlord Bio / Description
                          </label>
                          <span className="small text-muted-custom" style={{ fontSize: '0.75rem' }}>
                            {formData.bio.length} / 500 chars
                          </span>
                        </div>
                        <textarea
                          className="form-control"
                          rows="4"
                          maxLength="500"
                          placeholder="Introduce yourself to KTU students (e.g. 'Landlord of Sunrise Hostel. Over 5 years providing safe and reliable student accommodations with 24/7 security near KTU main campus.')"
                          value={formData.bio}
                          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        ></textarea>
                        <small className="form-text text-muted-custom">
                          Shown on your property listing pages so students can learn about their prospective landlord.
                        </small>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 pt-2">
                      <button
                        type="submit"
                        className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save size={18} /> Save Profile Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
