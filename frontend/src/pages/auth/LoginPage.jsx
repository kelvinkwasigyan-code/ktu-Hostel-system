// src/pages/auth/LoginPage.jsx — UC-S02
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const fillAdmin = () => setForm({ email: 'admin@hostelportal.edu.gh', password: 'Admin@1234' });
  const fillStudent = () => setForm({ email: 'esi.quaye@ktu.edu.gh', password: 'Student@1' });
  const fillLandlord = () => setForm({ email: 'kwame.asante@gmail.com', password: 'Landlord@1' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.full_name.split(' ')[0]}!`);
      const role = res.data.user.role;
      if (role === 'Admin')    navigate('/admin');
      else if (role === 'Landlord') navigate('/landlord');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
      setForm(f => ({ ...f, password: '' }));
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
      padding: '2rem 0',
      overflow: 'hidden'
    }}>
      {/* Clearer Building Background Image */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "url('/hostel-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.45,
        zIndex: 0
      }} />

      {/* Subtle Overlay Gradient for Form Contrast */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(245, 245, 247, 0.75) 100%)',
        zIndex: 0
      }} />

      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">

            {/* Header */}
            <div className="text-center mb-4">
              <Link to="/" className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none">
                <img src="/logo.jpg" alt="Student Hostel Portal Logo" style={{ height: '75px', width: 'auto', borderRadius: '6px' }} />
              </Link>
              <h2 style={{ fontFamily:'Outfit,sans-serif',fontWeight:800,fontSize:'1.8rem' }}>Welcome Back</h2>
              <p style={{ color:'var(--text-muted)',fontSize:'0.9rem' }}>Sign in to your account</p>
            </div>

            {/* Card */}
            <div className="card p-4 shadow-lg" style={{
              background: 'rgba(10, 34, 64, 0.82)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 139, 206, 0.3)',
              borderRadius: '16px',
              color: '#fff'
            }}>

              {/* Demo Credentials (DEV environment only) */}
              {import.meta.env.DEV && (
                <div className="alert alert-info mb-4" style={{ fontSize:'0.82rem' }}>
                  <div className="fw-bold mb-1">Demo Quick Logins:</div>
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    <button type="button" className="btn btn-sm btn-outline-info py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={fillAdmin}>
                      👑 Fill Admin
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-info py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={fillStudent}>
                      🎓 Fill Student
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-info py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={fillLandlord}>
                      🏠 Fill Landlord
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="mb-3">
                  <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Email Address</label>
                  <input type="email" className="form-control bg-white text-dark" id="login-email"
                         placeholder="your@email.com"
                         value={form.email}
                         onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                         style={{ backgroundColor: '#ffffff', color: '#0a2240' }}
                         autoComplete="off"
                         required />
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    <label className="form-label" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Password</label>
                  </div>
                  <div className="position-relative">
                    <input type={showPw ? 'text' : 'password'} className="form-control bg-white text-dark" id="login-password"
                           placeholder="••••••••"
                           value={form.password}
                           onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                           style={{ backgroundColor: '#ffffff', color: '#0a2240' }}
                           autoComplete="new-password"
                           required />
                    <button type="button" className="btn position-absolute"
                            style={{ right:8, top:'50%', transform:'translateY(-50%)', color:'#64748b', padding:'2px 6px', border:'none', background:'none' }}
                            onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2 mb-3" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"/> : <LogIn size={16} className="me-2"/>}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1 border-secondary m-0" />
                <span className="px-2 text-muted-custom" style={{ fontSize: '0.8rem' }}>OR</span>
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
                      toast.success(`Welcome back, ${firstName}!`);
                      const role = res.data.user.role;
                      if (role === 'Admin')    navigate('/admin');
                      else if (role === 'Landlord') navigate('/landlord');
                      else navigate('/student');
                    } catch (err) {
                      toast.error(err.response?.data?.error || 'Google Sign-In failed. Please try again.');
                    }
                  }}
                  onError={() => {
                    toast.error('Google Sign-In failed.');
                  }}
                  useOneTap
                />
              </div>
            </div>

            <p className="text-center mt-3" style={{ color:'rgba(255,255,255,0.75)',fontSize:'0.9rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color:'var(--brand-orange)',fontWeight:600 }}>Register here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
