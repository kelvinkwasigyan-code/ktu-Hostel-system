import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Eye, EyeOff, UserPlus, X } from 'lucide-react';
import SecureIDUpload from '../../components/SecureIDUpload';
import { uploadLandlordID } from '../../utils/idUploader';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Student',
  });
  const [idFile, setIdFile] = useState(null);
  const [idType, setIdType] = useState('ghana_card');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let id_document_path = null;

      if (form.role === 'Landlord' && idFile) {
        try {
          const tempId = 'landlord_' + Date.now();
          id_document_path = await uploadLandlordID(idFile, tempId);
        } catch (uploadErr) {
          console.warn('ID Upload storage fallback:', uploadErr);
          id_document_path = `id-documents/${idFile.name}`;
        }
      }

      const payload = {
        ...form,
        id_document_path,
        id_type: idType
      };

      const res = await api.post('/auth/register', payload);
      login(res.data.user, res.data.token);

      if (form.role === 'Landlord') {
        toast.success(`Account submitted for verification! Welcome, ${res.data.user.full_name.split(' ')[0]}`);
      } else {
        toast.success(`Account created! Welcome, ${res.data.user.full_name.split(' ')[0]}`);
      }

      const role = res.data.user.role;
      if (role === 'Admin') navigate('/admin');
      else if (role === 'Landlord') navigate('/landlord');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      background: 'var(--dark-navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: '0.75rem'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "url('/hostel-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.18,
        zIndex: 0
      }} />

      {/* Overlay Gradient */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, rgba(10, 34, 64, 0.88) 0%, rgba(5, 20, 40, 0.96) 100%)',
        zIndex: 0
      }} />

      {/* Main Container Card */}
      <div 
        className="card border-0 shadow-2xl position-relative w-100" 
        style={{ 
          maxWidth: '470px', 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          zIndex: 1, 
          maxHeight: '96vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflowY: 'auto'
        }}
      >
        {/* Card Header */}
        <div className="px-4 pt-3 pb-2 border-bottom position-relative d-flex align-items-center justify-content-between" style={{ borderColor: '#f1f5f9' }}>
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <img src="/logo.jpg" alt="KTU Housing Logo" style={{ height: '36px', width: 'auto', borderRadius: '6px' }} />
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif' }}>
              KTU <span style={{ color: 'var(--brand-orange, #d97706)' }}>Housing</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn p-1 text-secondary border-0 bg-transparent"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 pt-3">
          <div className="text-center mb-3">
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: '#0f172a', marginBottom: '0.15rem' }}>
              Create Your Account
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
              Join thousands of verified KTU students & managers
            </p>
          </div>

          {/* Role Selector */}
          <div className="mb-3">
            <label className="form-label mb-1" style={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem' }}>I am a...</label>
            <div className="d-flex gap-2">
              {['Student', 'Landlord'].map(r => (
                <div key={r}
                     className="flex-1 text-center py-2 px-3"
                     style={{
                       background: form.role === r ? 'rgba(255,107,53,0.08)' : '#f8fafc',
                       border: `2px solid ${form.role === r ? 'var(--brand-orange)' : '#e2e8f0'}`,
                       borderRadius: '8px', cursor: 'pointer', flex: 1,
                       transition: 'all 0.2s'
                     }}
                     onClick={() => setForm(f => ({ ...f, role: r }))}>
                  <div style={{ fontSize: '1.1rem' }}>{r === 'Student' ? '🎓' : '🏠'}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: form.role === r ? 'var(--brand-orange)' : '#475569' }}>{r}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-2">
              <label className="form-label mb-1" style={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem' }}>Full Name</label>
              <input type="text" className="form-control form-control-sm" id="reg-name" placeholder="e.g. Esi Adjoa Quaye"
                     value={form.full_name}
                     onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                     style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                     autoComplete="off"
                     required />
            </div>

            <div className="mb-2">
              <label className="form-label mb-1" style={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem' }}>Email Address</label>
              <input type="email" className="form-control form-control-sm" id="reg-email"
                     placeholder={form.role === 'Student' ? 'name@ktu.edu.gh' : 'your@gmail.com'}
                     value={form.email}
                     onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                     style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                     autoComplete="off"
                     required />
            </div>

            <div className="mb-2">
              <label className="form-label mb-1" style={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem' }}>Phone Number</label>
              <input type="tel" className="form-control form-control-sm" id="reg-phone" placeholder="+233 244 123 456"
                     value={form.phone}
                     onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                     style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                     autoComplete="off"
                     required />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1" style={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem' }}>Password</label>
              <div className="position-relative">
                <input type={showPw ? 'text' : 'password'} className="form-control form-control-sm" id="reg-password"
                       placeholder="Min. 6 characters"
                       value={form.password}
                       onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                       style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                       autoComplete="new-password"
                       required />
                <button type="button" className="btn position-absolute"
                        style={{ right: 6, top: '50%', transform: 'translateY(-50%)', color: '#64748b', padding: '2px 4px', border: 'none', background: 'none' }}
                        onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* Secure ID Upload Section (Landlords only) */}
            {form.role === 'Landlord' && (
              <div className="mb-3">
                <SecureIDUpload onFileSelect={(selectedFile, selectedType) => {
                  setIdFile(selectedFile);
                  if (selectedType) setIdType(selectedType);
                }} />
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 py-2 font-semibold" style={{ fontSize: '0.88rem', borderRadius: '8px' }} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"/> : <UserPlus size={15} className="me-1.5"/>}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="d-flex align-items-center my-2.5">
            <hr className="flex-grow-1 border-secondary opacity-25 m-0" />
            <span className="px-2 text-muted" style={{ fontSize: '0.75rem' }}>OR</span>
            <hr className="flex-grow-1 border-secondary opacity-25 m-0" />
          </div>

          <div className="d-flex justify-content-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const res = await api.post('/auth/google', {
                    credential: credentialResponse.credential
                  });
                  login(res.data.user, res.data.token);
                  toast.success('Account created with Google!');
                  const role = res.data.user.role;
                  if (role === 'Admin') navigate('/admin');
                  else if (role === 'Landlord') navigate('/landlord');
                  else navigate('/student');
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Google Sign-Up failed.');
                }
              }}
              onError={() => { toast.error('Google Sign-Up failed.'); }}
              useOneTap
            />
          </div>

          <p className="text-center mt-3 mb-0" style={{ color: '#64748b', fontSize: '0.82rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brand-orange, #d97706)', fontWeight: 600 }}>Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
