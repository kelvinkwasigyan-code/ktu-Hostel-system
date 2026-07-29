import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import toast from 'react-hot-toast';
import api from '../../services/api';
import { Eye, EyeOff, LogIn, X } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Always reset form on mount (clears stale values after logout)
  useEffect(() => {
    setForm({ email: '', password: '' });
  }, []);
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
                autoComplete="off"
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
                  autoComplete="new-password"
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
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              <p className="text-center mb-2" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Demo Quick Logins (DEV ONLY)
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button type="button" className="btn btn-sm" style={{ backgroundColor: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', border: 'none' }} onClick={() => setForm({ email: 'admin@ktu.edu.gh', password: 'Admin123!' })}>Admin</button>
                <button type="button" className="btn btn-sm" style={{ backgroundColor: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', border: 'none' }} onClick={() => setForm({ email: 'esi.quaye@ktu.edu.gh', password: 'Student@1' })}>Student</button>
                <button type="button" className="btn btn-sm" style={{ backgroundColor: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', border: 'none' }} onClick={() => setForm({ email: 'kwame.asante@gmail.com', password: 'Landlord@1' })}>Landlord</button>
              </div>
            </div>
          )}
          <p className="text-center mt-3 mb-0" style={{ color: '#64748b', fontSize: '0.82rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--brand-orange, #d97706)', fontWeight: 600 }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
