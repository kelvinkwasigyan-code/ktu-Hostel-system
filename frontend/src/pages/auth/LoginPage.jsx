// src/pages/auth/LoginPage.jsx — UC-S02
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div style={{ minHeight: '100vh', background: 'var(--dark-navy)', display: 'flex', alignItems: 'center' }}>
      <div className="container">
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
            <div className="card p-4">

              {/* Demo Credentials */}
              <div className="alert alert-info mb-4" style={{ fontSize:'0.82rem' }}>
                <div className="fw-bold mb-1">Demo Quick Logins:</div>
                <div className="d-flex flex-wrap gap-1 mt-2">
                  <button type="button" className="btn btn-sm btn-outline-info py-0 px-2" style={{ fontSize: '0.75rem' }}
                          onClick={() => setForm({ email: 'admin@hostelportal.edu.gh', password: 'Admin@1234' })}>
                    👑 Fill Admin
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-info py-0 px-2" style={{ fontSize: '0.75rem' }}
                          onClick={() => setForm({ email: 'esi.quaye@ktu.edu.gh', password: 'Student@1' })}>
                    🎓 Fill Student
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-info py-0 px-2" style={{ fontSize: '0.75rem' }}
                          onClick={() => setForm({ email: 'kwame.asante@gmail.com', password: 'Landlord@1' })}>
                    🏠 Fill Landlord
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" id="login-email"
                         placeholder="your@email.com"
                         value={form.email}
                         onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                         required />
                </div>
                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    <label className="form-label">Password</label>
                  </div>
                  <div className="position-relative">
                    <input type={showPw ? 'text' : 'password'} className="form-control" id="login-password"
                           placeholder="••••••••"
                           value={form.password}
                           onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                           required />
                    <button type="button" className="btn position-absolute"
                            style={{ right:8, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', padding:'2px 6px', border:'none', background:'none' }}
                            onClick={() => setShowPw(v => !v)}>
                      {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2"/> : <LogIn size={16} className="me-2"/>}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>

            <p className="text-center mt-3" style={{ color:'var(--text-muted)',fontSize:'0.9rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color:'var(--brand-orange)',fontWeight:600 }}>Register here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
