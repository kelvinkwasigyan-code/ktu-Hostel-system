// src/pages/auth/RegisterPage.jsx — UC-S01 (Student) + UC-L01 (Landlord)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { UserPlus, Eye, EyeOff, Upload } from 'lucide-react';

import { processAndUploadFile } from '../../utils/fileUpload';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', role: 'Student',
    id_document_path: ''
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleIdDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const loadingToast = toast.loading('Uploading document...');
    try {
      const url = await processAndUploadFile(file, 'documents');
      setForm(f => ({ ...f, id_document_path: url }));
      toast.dismiss(loadingToast);
      toast.success('ID document attached successfully!');
    } catch (err) {
      console.error('Doc upload error:', err);
      toast.dismiss(loadingToast);
      toast.error('Failed to upload document.');
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters.');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      toast.success(res.data.message);
      const role = res.data.user.role;
      if (role === 'Landlord') navigate('/landlord');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: 'var(--dark-navy)',
      display: 'flex',
      alignItems: 'center',
      padding: '2.5rem 0',
      overflow: 'hidden'
    }}>
      {/* Faded Building Background Image */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "url('/hostel-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        filter: 'blur(1px)',
        transform: 'scale(1.03)',
        zIndex: 0
      }} />

      {/* Radial Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at center, transparent 20%, var(--dark-navy) 90%)',
        zIndex: 0
      }} />

      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">

            <div className="text-center mb-4">
              <Link to="/" className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none">
                <img src="/logo.jpg" alt="Student Hostel Portal Logo" style={{ height: '75px', width: 'auto', borderRadius: '6px' }} />
              </Link>
              <h2 style={{ fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'1.8rem' }}>Create Account</h2>
              <p style={{ color:'var(--text-muted)',fontSize:'0.9rem' }}>Join thousands of KTU students</p>
            </div>

            <div className="card p-4 shadow-lg" style={{
              background: 'rgba(10, 34, 64, 0.82)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 139, 206, 0.3)',
              borderRadius: '16px',
              color: '#fff'
            }}>
              {/* Role Selector */}
              <div className="mb-4">
                <label className="form-label" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>I am a...</label>
                <div className="d-flex gap-3">
                  {['Student', 'Landlord'].map(r => (
                    <div key={r}
                         className="flex-1 text-center p-3"
                         style={{
                           background: form.role === r ? 'rgba(255,107,53,0.22)' : 'rgba(255,255,255,0.06)',
                           border: `2px solid ${form.role === r ? 'var(--brand-orange)' : 'rgba(255,255,255,0.2)'}`,
                           borderRadius: '10px', cursor: 'pointer', flex: 1,
                           transition: 'all 0.2s'
                         }}
                         onClick={() => setForm(f => ({ ...f, role: r }))}>
                      <div style={{ fontSize: '1.4rem' }}>{r === 'Student' ? '🎓' : '🏠'}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: form.role === r ? '#ff9d76' : 'rgba(255,255,255,0.85)' }}>{r}</div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Full Name</label>
                  <input type="text" className="form-control bg-white text-dark" id="reg-name" placeholder="e.g. Esi Adjoa Quaye"
                         value={form.full_name}
                         onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                         style={{ backgroundColor: '#ffffff', color: '#0a2240' }}
                         autoComplete="off"
                         required />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Email Address</label>
                  <input type="email" className="form-control bg-white text-dark" id="reg-email"
                         placeholder={form.role === 'Student' ? 'name@ktu.edu.gh' : 'your@gmail.com'}
                         value={form.email}
                         onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                         style={{ backgroundColor: '#ffffff', color: '#0a2240' }}
                         autoComplete="off"
                         required />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Phone Number</label>
                  <input type="tel" className="form-control bg-white text-dark" id="reg-phone" placeholder="+233 244 123 456"
                         value={form.phone}
                         onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                         style={{ backgroundColor: '#ffffff', color: '#0a2240' }}
                         autoComplete="off"
                         required />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Password</label>
                  <div className="position-relative">
                    <input type={showPw ? 'text' : 'password'} className="form-control bg-white text-dark" id="reg-password"
                           placeholder="Min. 6 characters"
                           value={form.password}
                           onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                           style={{ backgroundColor: '#ffffff', color: '#0a2240' }}
                           autoComplete="new-password"
                           required />
                    <button type="button" className="btn position-absolute"
                            style={{ right:8,top:'50%',transform:'translateY(-50%)',color:'#64748b',padding:'2px 6px',border:'none',background:'none' }}
                            onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                {/* Landlord ID Document */}
                {form.role === 'Landlord' && (
                  <div className="mb-3">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      ID Document (Ghana Card / Voter ID)
                    </label>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control bg-white text-dark" id="reg-id-doc"
                             placeholder="Upload scan or paste document URL"
                             value={form.id_document_path}
                             onChange={e => setForm(f => ({ ...f, id_document_path: e.target.value }))}
                             style={{ backgroundColor: '#ffffff', color: '#0a2240' }} />
                      <label className="btn btn-outline-light d-flex align-items-center gap-1 cursor-pointer" style={{ minWidth: '110px' }}>
                        {uploadingDoc ? (
                          <span className="spinner-border spinner-border-sm" role="status" />
                        ) : (
                          <>
                            <Upload size={14} /> Upload
                          </>
                        )}
                        <input type="file" accept="image/*,.pdf" className="d-none" disabled={uploadingDoc} onChange={handleIdDocUpload} />
                      </label>
                    </div>
                    <small style={{ color:'rgba(255,255,255,0.65)',fontSize:'0.78rem' }}>
                      Upload an image or document scan of your identity card for admin verification.
                    </small>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 py-2 mt-2 mb-3" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"/> : <UserPlus size={16} className="me-2"/>}
                  {loading ? 'Creating account...' : `Register as ${form.role}`}
                </button>
              </form>

              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1 border-secondary m-0" />
                <span className="px-2 text-muted-custom" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>OR</span>
                <hr className="flex-grow-1 border-secondary m-0" />
              </div>

              <div className="d-flex justify-content-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const res = await api.post('/auth/google', {
                        credential: credentialResponse.credential
                      });
                      login(res.data.user, res.data.token);
                      const firstName = res.data.user.full_name?.split(' ')[0] || 'there';
                      toast.success(`Welcome, ${firstName}!`);
                      const role = res.data.user.role;
                      if (role === 'Admin')    navigate('/admin');
                      else if (role === 'Landlord') navigate('/landlord');
                      else navigate('/student');
                    } catch (err) {
                      toast.error(err.response?.data?.error || 'Google Sign-Up failed. Please try again.');
                    }
                  }}
                  onError={() => {
                    toast.error('Google Sign-Up failed.');
                  }}
                />
              </div>
            </div>

            <p className="text-center mt-3" style={{ color:'rgba(255,255,255,0.75)',fontSize:'0.9rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color:'var(--brand-orange)',fontWeight:600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
