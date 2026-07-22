// src/pages/auth/RegisterPage.jsx — UC-S01 (Student) + UC-L01 (Landlord)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
    <div style={{ minHeight:'100vh', background:'var(--dark-navy)', display:'flex', alignItems:'center', padding:'2rem 0' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">

            <div className="text-center mb-4">
              <Link to="/" className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none">
                <img src="/logo.jpg" alt="Student Hostel Portal Logo" style={{ height: '75px', width: 'auto', borderRadius: '6px' }} />
              </Link>
              <h2 style={{ fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'1.8rem' }}>Create Account</h2>
              <p style={{ color:'var(--text-muted)',fontSize:'0.9rem' }}>Join thousands of KTU students</p>
            </div>

            <div className="card p-4">
              {/* Role Selector */}
              <div className="mb-4">
                <label className="form-label">I am a...</label>
                <div className="d-flex gap-3">
                  {['Student', 'Landlord'].map(r => (
                    <div key={r}
                         className="flex-1 text-center p-3"
                         style={{
                           background: form.role === r ? 'rgba(255,107,53,0.12)' : 'var(--surface-2)',
                           border: `2px solid ${form.role === r ? 'var(--brand-orange)' : 'var(--border)'}`,
                           borderRadius: '10px', cursor: 'pointer', flex: 1,
                           transition: 'all 0.2s'
                         }}
                         onClick={() => setForm(f => ({ ...f, role: r }))}>
                      <div style={{ fontSize: '1.4rem' }}>{r === 'Student' ? '🎓' : '🏠'}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: form.role === r ? 'var(--brand-orange)' : 'var(--text-secondary)' }}>{r}</div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" id="reg-name" placeholder="e.g. Esi Adjoa Quaye"
                         value={form.full_name}
                         onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                         required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" id="reg-email"
                         placeholder={form.role === 'Student' ? 'name@ktu.edu.gh' : 'your@gmail.com'}
                         value={form.email}
                         onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                         required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-control" id="reg-phone" placeholder="+233 244 123 456"
                         value={form.phone}
                         onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                         required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <div className="position-relative">
                    <input type={showPw ? 'text' : 'password'} className="form-control" id="reg-password"
                           placeholder="Min. 6 characters"
                           value={form.password}
                           onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                           required />
                    <button type="button" className="btn position-absolute"
                            style={{ right:8,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)',padding:'2px 6px',border:'none',background:'none' }}
                            onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                {/* Landlord ID Document */}
                {form.role === 'Landlord' && (
                  <div className="mb-3">
                    <label className="form-label">
                      ID Document (Ghana Card / Voter ID)
                    </label>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control" id="reg-id-doc"
                             placeholder="Upload scan or paste document URL"
                             value={form.id_document_path}
                             onChange={e => setForm(f => ({ ...f, id_document_path: e.target.value }))} />
                      <label className="btn btn-outline-secondary d-flex align-items-center gap-1 cursor-pointer" style={{ minWidth: '110px' }}>
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
                    <small style={{ color:'var(--text-muted)',fontSize:'0.78rem' }}>
                      Upload an image or document scan of your identity card for admin verification.
                    </small>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 py-2 mt-2" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"/> : <UserPlus size={16} className="me-2"/>}
                  {loading ? 'Creating account...' : `Register as ${form.role}`}
                </button>
              </form>
            </div>

            <p className="text-center mt-3" style={{ color:'var(--text-muted)',fontSize:'0.9rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color:'var(--brand-orange)',fontWeight:600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
