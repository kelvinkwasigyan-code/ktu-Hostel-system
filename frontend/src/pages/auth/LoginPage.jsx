import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Eye, EyeOff, LogIn, X } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const fillAdmin = () => setForm({ email: 'admin@ktu.edu.gh', password: 'Admin@123' });
  const fillStudent = () => setForm({ email: 'esi.quaye@ktu.edu.gh', password: 'Student@1' });
  const fillLandlord = () => setForm({ email: 'kwame.asante@gmail.com', password: 'Landlord@1' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.full_name.split(' ')[0]}!`);
      const role = (res.data.user.role || '').toLowerCase();
      if (role === 'admin')    navigate('/admin');
      else if (role === 'landlord') navigate('/landlord');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid email or password. Please try again.');
      setForm(f => ({ ...f, password: '' }));
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
          maxWidth: '430px', 
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
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.15rem' }}>
              Welcome Back
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
              Sign in to manage hostelling and bookings
            </p>
          </div>

          {/* Demo Logins */}
          {import.meta.env.DEV && (
            <div className="p-2 mb-3 rounded-3" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div className="fw-semibold mb-1" style={{ fontSize: '0.75rem', color: '#0369a1' }}>⚡ Demo Logins:</div>
              <div className="d-flex flex-wrap gap-1">
                <button type="button" className="btn btn-sm btn-outline-primary py-0 px-1.5" style={{ fontSize: '0.7rem', borderRadius: '4px' }} onClick={fillAdmin}>
                  👑 Admin
                </button>
                <button type="button" className="btn btn-sm btn-outline-primary py-0 px-1.5" style={{ fontSize: '0.7rem', borderRadius: '4px' }} onClick={fillStudent}>
                  🎓 Student
                </button>
                <button type="button" className="btn btn-sm btn-outline-primary py-0 px-1.5" style={{ fontSize: '0.7rem', borderRadius: '4px' }} onClick={fillLandlord}>
                  🏠 Landlord
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-3">
              <label className="form-label mb-1" style={{ color: '#334155', fontWeight: 600, fontSize: '0.82rem' }}>Email Address</label>
              <input 
                type="text"
                inputMode="email"
                className="form-control form-control-sm" 
                id="login-email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value.trim() }))}
                style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', padding: '0.45rem 0.75rem', fontSize: '0.88rem' }}
                autoComplete="username"
                spellCheck={false}
                required 
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1" style={{ color: '#334155', fontWeight: 600, fontSize: '0.82rem' }}>Password</label>
              <div className="position-relative">
                <input 
                  type={showPw ? 'text' : 'password'} 
                  className="form-control form-control-sm" 
                  id="login-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#cbd5e1', padding: '0.45rem 0.75rem', fontSize: '0.88rem' }}
                  autoComplete="current-password"
                  required 
                />
                <button 
                  type="button" 
                  className="btn position-absolute"
                  style={{ right: 6, top: '50%', transform: 'translateY(-50%)', color: '#64748b', padding: '2px 4px', border: 'none', background: 'none' }}
                  onClick={() => setShowPw(v => !v)}
                >
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2 font-semibold" style={{ fontSize: '0.88rem', borderRadius: '8px' }} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm me-2"/> : <LogIn size={15} className="me-1.5"/>}
              {loading ? 'Signing in...' : 'Sign In'}
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
                  const firstName = res.data.user.full_name?.split(' ')[0] || 'there';
                  toast.success(`Welcome back, ${firstName}!`);
                  const role = res.data.user.role;
                  if (role === 'Admin')    navigate('/admin');
                  else if (role === 'Landlord') navigate('/landlord');
                  else navigate('/student');
                } catch (err) {
                  toast.error(err.response?.data?.error || 'Google Sign-In failed.');
                }
              }}
              onError={() => { toast.error('Google Sign-In failed.'); }}
              useOneTap
            />
          </div>

          <p className="text-center mt-3 mb-0" style={{ color: '#64748b', fontSize: '0.82rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--brand-orange, #d97706)', fontWeight: 600 }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
