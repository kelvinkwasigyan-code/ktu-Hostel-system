import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Lock, User, Phone, Image, FileText, CheckCircle, AlertCircle, Save, Sparkles, Key } from 'lucide-react';
import Navbar from '../../components/Navbar';
import OtpVerification from '../../components/OtpVerification';
import Footer from '../../components/Footer';
import LandlordSidebar from '../../components/LandlordSidebar';
import StudentSidebar from '../../components/StudentSidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { processAndUploadFile } from '../../utils/fileUpload';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form fields (editable non-sensitive info)
  const [formData, setFormData] = useState({
    phone: '',
    profile_picture: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Locked user info (fetched from server)
  const [profileInfo, setProfileInfo] = useState({
    full_name: '',
    email: '',
    role: 'Student',
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
        role: u.role || 'Student',
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
      console.error('Failed to load profile:', err);
      // Fallback to auth context
      if (user) {
        setProfileInfo({
          full_name: user.full_name || '',
          email: user.email || '',
          role: user.role || 'Student',
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await processAndUploadFile(file, 'profile-pictures');
      setFormData(p => ({ ...p, profile_picture: url }));
      setSuccessMsg('Profile picture uploaded successfully! Click "Save Profile Changes" to save.');
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorMsg('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.phone || !formData.phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    if (formData.bio && formData.bio.length > 500) {
      setErrorMsg('Bio cannot exceed 500 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.put('/auth/profile', {
        phone: formData.phone.trim(),
        profile_picture: formData.profile_picture ? formData.profile_picture.trim() : null,
        bio: formData.bio ? formData.bio.trim() : null
      });

      setSuccessMsg(res.data?.message || 'Profile information updated successfully! Redirecting...');
      if (res.data?.user) updateUser(res.data.user);

      setTimeout(() => {
        navigate(user.role === 'Student' ? '/dashboard' : '/landlord/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      return setPasswordError('New passwords do not match.');
    }
    if (passwordData.new_password.length < 6) {
      return setPasswordError('New password must be at least 6 characters.');
    }

    try {
      setSubmittingPassword(true);
      const res = await api.put('/auth/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setPasswordSuccess(res.data?.message || 'Password changed successfully!');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-loader"><div className="spinner-ring"></div></div>
      </>
    );
  }

  const isVerified = profileInfo.verification_status === 'Approved';
  const isLandlord = profileInfo.role === 'Landlord';

  return (
    <>
      <Navbar />
      <div className="d-flex">
        {isLandlord ? <LandlordSidebar /> : <StudentSidebar />}
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0" style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            <div className="mb-4">
              <h2 className="mb-1">Account Settings</h2>
              <p className="text-muted-custom mb-0">Update your contact info, profile picture, and password.</p>
            </div>
            
            <div className="row g-4">
              {/* Left Column: Profile Card */}
              <div className="col-lg-4">
                <div className="card p-4 border-custom bg-surface rounded-custom h-100 text-center">
                  <div className="position-relative d-inline-block mx-auto mb-3">
                    <img
                      src={formData.profile_picture || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'}
                      alt={profileInfo.full_name}
                      className="rounded-circle shadow-sm"
                      style={{ width: '130px', height: '130px', objectFit: 'cover', border: '4px solid var(--surface-2)' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'; }}
                    />
                    <span className={`position-absolute bottom-0 end-0 badge rounded-pill p-2 ${isVerified ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {isVerified ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                    </span>
                  </div>

                  <h4 className="mb-1 font-outfit fw-bold">{profileInfo.full_name}</h4>
                  <p className="text-muted-custom small mb-2">{profileInfo.email}</p>
                  
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    <span className="badge bg-navy-subtle text-navy px-3 py-1 rounded-pill"><User size={13} className="me-1" /> {profileInfo.role}</span>
                  </div>
                  
                  {isLandlord && (
                    <div className="text-start">
                      <label className="form-label small fw-semibold text-muted-custom mb-2"><Sparkles size={14} className="me-1 text-orange" /> Select Sample Avatar:</label>
                      <div className="d-flex justify-content-around">
                        {DEFAULT_AVATARS.map((url, idx) => (
                          <img key={idx} src={url} alt={`Avatar ${idx+1}`} width={40} height={40} onClick={() => setFormData(p => ({ ...p, profile_picture: url }))} className={`rounded-circle cursor-pointer border ${formData.profile_picture === url ? 'border-primary border-3' : 'border-light'}`} style={{ objectFit: 'cover' }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Forms */}
              <div className="col-lg-8">
                <div className="card p-4 border-custom bg-surface rounded-custom mb-4">
                  <h5 className="mb-3 d-flex align-items-center gap-2"><User size={20} className="text-orange" /> Edit Profile Details</h5>
                  {successMsg && <div className="alert alert-success d-flex align-items-center gap-2" role="alert"><CheckCircle size={18} /> {successMsg}</div>}
                  {errorMsg && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><AlertCircle size={18} /> {errorMsg}</div>}
                  
                  <form onSubmit={handleSubmitProfile}>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Full Name <small className="text-muted">(Locked)</small></label>
                        <input type="text" className="form-control bg-surface-2 text-muted" value={profileInfo.full_name} disabled />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email Address <small className="text-muted">(Locked)</small></label>
                        <input type="email" className="form-control bg-surface-2 text-muted" value={profileInfo.email} disabled />
                      </div>
                    </div>
                    
                    <div className="row g-3 mb-3">
                      <div className="col-md-12">
                        <label className="form-label">Profile Photo</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="form-control" 
                          onChange={handleImageUpload} 
                          disabled={uploadingImage}
                        />
                        {uploadingImage && <small className="text-muted d-block mt-1">Uploading...</small>}
                        {formData.profile_picture && (
                          <div className="mt-2 d-flex align-items-center gap-2">
                            <img src={formData.profile_picture} alt="Profile Preview" className="rounded border" style={{width: 50, height: 50, objectFit: 'cover'}} />
                            <small className="text-success">Image ready. Save changes below.</small>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                        <input type="text" className="form-control" required value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      {isLandlord && (
                        <div className="col-12">
                          <label className="form-label">Public Bio / Description <small className="text-muted">(Optional)</small></label>
                          <textarea className="form-control" rows="3" maxLength="500" value={formData.bio} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} placeholder="Tell students about yourself and your properties..."></textarea>
                        </div>
                      )}
                    </div>
                    
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <Save size={18} className="me-2" />}
                      {submitting ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </form>

                  {isLandlord && !profileInfo.is_phone_verified && (
                    <OtpVerification 
                      phoneNumber={profileInfo.phone} 
                      landlordId={profileInfo.user_id} 
                      onVerified={fetchProfile} 
                    />
                  )}
                </div>
                
                {/* Change Password Card */}
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <h5 className="mb-3 d-flex align-items-center gap-2"><Key size={20} className="text-danger" /> Change Password</h5>
                  {passwordSuccess && <div className="alert alert-success d-flex align-items-center gap-2" role="alert"><CheckCircle size={18} /> {passwordSuccess}</div>}
                  {passwordError && <div className="alert alert-danger d-flex align-items-center gap-2" role="alert"><AlertCircle size={18} /> {passwordError}</div>}
                  
                  <form onSubmit={handlePasswordChange}>
                    <div className="mb-3">
                      <label className="form-label">Current Password</label>
                      <input type="password" className="form-control" required value={passwordData.current_password} onChange={(e) => setPasswordData(p => ({ ...p, current_password: e.target.value }))} />
                    </div>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label">New Password</label>
                        <input type="password" className="form-control" required minLength="6" value={passwordData.new_password} onChange={(e) => setPasswordData(p => ({ ...p, new_password: e.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Confirm New Password</label>
                        <input type="password" className="form-control" required minLength="6" value={passwordData.confirm_password} onChange={(e) => setPasswordData(p => ({ ...p, confirm_password: e.target.value }))} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-outline-danger" disabled={submittingPassword}>
                      {submittingPassword ? 'Changing Password...' : 'Update Password'}
                    </button>
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
