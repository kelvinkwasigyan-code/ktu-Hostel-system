import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, MapPin, HelpCircle, PhoneCall, LayoutDashboard, Bell, LogOut, Menu, X, Home, PlusSquare } from 'lucide-react';
import api from '../services/api';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close mobile nav on route change
  useEffect(() => { setShowMobileNav(false); }, [location.pathname]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.notifications || []);
      setUnreadCount(res.data?.unread_count || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleLogout = () => {
    // Let context clear its state (setUser(null))
    logout();
    
    // Clear tokens/user data
    localStorage.clear(); 
    sessionStorage.clear();
    
    // Use replace: true so /admin is wiped from history
    navigate('/login', { replace: true });
  };


  const getDashboardLink = () => {
    if (!user) return '/login';
    const roleLower = (user.role || '').toLowerCase();
    if (roleLower === 'admin') return '/admin';
    if (roleLower === 'landlord') return '/landlord';
    return '/student';
  };

  const notifIcon = (type) => {
    switch (type) {
      case 'BookingRequest':     return '📩';
      case 'BookingAccepted':    return '✅';
      case 'BookingDeclined':    return '❌';
      case 'VerificationResult': return '🛡️';
      default:                   return '🔔';
    }
  };

  const isNavActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur" style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'var(--surface-glass, rgba(255, 255, 255, 0.95))', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center gap-2 text-decoration-none" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/logo.jpg" alt="KTU Housing Logo" style={{ height: '48px', width: 'auto', borderRadius: '8px' }} />
          <span className="font-bold text-gray-900 hidden sm:inline" style={{ fontWeight: 800, color: 'var(--text-primary, #0f172a)', fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>
            KTU <span style={{ color: 'var(--brand-orange, #d97706)' }}>Housing Portal</span>
          </span>
        </Link>

        {/* Center: Primary Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
          <Link 
            to="/search" 
            className={`hover:text-amber-600 transition nav-link p-0 d-flex align-items-center gap-1.5 ${isNavActive('/search') ? 'active fw-semibold text-orange' : ''}`} 
            style={{ color: isNavActive('/search') ? 'var(--brand-orange)' : 'var(--text-secondary, #475569)', transition: 'color 0.2s', textDecoration: 'none' }}
          >
            <Building2 size={16} /> Browse Hostels
          </Link>
          <Link 
            to="/map" 
            className={`hover:text-amber-600 transition nav-link p-0 d-flex align-items-center gap-1.5 ${isNavActive('/map') ? 'active fw-semibold text-orange' : ''}`} 
            style={{ color: isNavActive('/map') ? 'var(--brand-orange)' : 'var(--text-secondary, #475569)', transition: 'color 0.2s', textDecoration: 'none' }}
          >
            <MapPin size={16} /> Map View
          </Link>
          <Link 
            to="/faq" 
            className={`hover:text-amber-600 transition nav-link p-0 d-flex align-items-center gap-1.5 ${isNavActive('/faq') ? 'active fw-semibold text-orange' : ''}`} 
            style={{ color: isNavActive('/faq') ? 'var(--brand-orange)' : 'var(--text-secondary, #475569)', transition: 'color 0.2s', textDecoration: 'none' }}
          >
            <HelpCircle size={16} /> FAQ
          </Link>
          <Link 
            to="/contact" 
            className={`hover:text-amber-600 transition nav-link p-0 d-flex align-items-center gap-1.5 ${isNavActive('/contact') ? 'active fw-semibold text-orange' : ''}`} 
            style={{ color: isNavActive('/contact') ? 'var(--brand-orange)' : 'var(--text-secondary, #475569)', transition: 'color 0.2s', textDecoration: 'none' }}
          >
            <PhoneCall size={16} /> Contact Us
          </Link>
        </nav>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Dashboard Shortcut */}
          {user ? (
            <Link 
              to={getDashboardLink()} 
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-decoration-none"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem', fontSize: '0.82rem', fontWeight: 600, padding: '0.45rem 0.85rem', borderRadius: '8px', backgroundColor: 'var(--surface-2, #f1f5f9)', color: 'var(--text-primary, #1e293b)' }}
            >
              <LayoutDashboard size={15} />
              My Dashboard
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="btn btn-sm btn-primary px-3 py-1.5 rounded-lg font-semibold"
              style={{ fontSize: '0.82rem' }}
            >
              Sign In
            </Link>
          )}

          {/* Utilities - desktop only */}
          <div className="d-none d-md-block">
            <ThemeToggle />
          </div>

          {user && (
            <div className="position-relative" ref={notifRef}>
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 relative border-0 bg-transparent"
                onClick={() => setShowNotif(v => !v)}
                style={{ position: 'relative', padding: '0.45rem', color: 'var(--text-secondary, #64748b)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center" style={{ position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px', backgroundColor: '#ef4444', color: '#ffffff', fontSize: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="notif-dropdown">
                  <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                    {unreadCount > 0 && (
                      <button className="btn btn-sm" style={{ color: 'var(--brand-orange)', fontSize: '0.8rem' }} onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div key={n.notification_id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                          <div className="d-flex gap-2">
                            <span>{notifIcon(n.type)}</span>
                            <div>
                              <p className="mb-0" style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                {n.message}
                              </p>
                              <small style={{ color: 'var(--text-muted)' }}>
                                {new Date(n.created_at).toLocaleDateString('en-GB', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile — desktop */}
          {user && (
            <div className="d-none d-md-block position-relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2 pl-2 border-l border-gray-200 border-0 bg-transparent cursor-pointer"
                onClick={() => setShowUserMenu(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border, #e2e8f0)' }}
              >
                <div className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--brand-orange, #d97706)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  {(user.full_name || 'U')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800 hidden lg:inline" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>
                  {(user.full_name || '').split(' ')[0]}
                </span>
              </button>

              {showUserMenu && (
                <div 
                  className="position-absolute end-0 mt-2 py-2 bg-white rounded-3 shadow-lg"
                  style={{
                    position: 'absolute', right: 0, marginTop: '0.5rem', minWidth: '180px',
                    backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '8px', zIndex: 1050, boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                >
                  <div className="px-3 py-2 border-bottom" style={{ borderColor: 'var(--border)', padding: '0.5rem 1rem' }}>
                    <div className="fw-bold text-truncate" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{user.full_name}</div>
                    <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>{user.role}</div>
                  </div>
                  <Link to={getDashboardLink()} className="dropdown-item px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                    <Home size={15} /> Dashboard
                  </Link>
                  {user.role === 'Landlord' && (
                    <Link to="/landlord/listings/create" className="dropdown-item px-3 py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                      <PlusSquare size={15} /> Add Property
                    </Link>
                  )}
                  <button 
                    className="dropdown-item px-3 py-2 text-danger d-flex align-items-center gap-2 w-100 text-start"
                    style={{ fontSize: '0.85rem' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={15} /> Log Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Nav Toggle */}
          <button
            type="button"
            className="btn d-md-none"
            style={{
              background: showMobileNav ? 'rgba(217, 119, 6, 0.12)' : 'var(--surface-2, #f1f5f9)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 8,
              cursor: 'pointer',
              padding: '0.45rem 0.6rem',
              color: showMobileNav ? 'var(--brand-orange, #d97706)' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setShowMobileNav(v => !v)}
            aria-label="Toggle menu"
          >
            {showMobileNav ? <X size={22} /> : <Menu size={22} />}
          </button>

        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {showMobileNav && (
        <div 
          className="d-md-none border-top"
          style={{
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            padding: '1rem',
            boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            maxHeight: 'calc(100vh - 65px)',
            overflowY: 'auto'
          }}
        >
          {/* User Info Card (if logged in) */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 0.9rem',
              borderRadius: 10,
              backgroundColor: 'var(--surface-2, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
              marginBottom: '0.2rem'
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                backgroundColor: 'var(--brand-orange)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.95rem', flexShrink: 0
              }}>
                {(user.full_name || 'U')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {user.role}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.5rem 0.2rem' }}>
              Navigation
            </div>
            <Link to="/search" onClick={() => setShowMobileNav(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 10, textDecoration: 'none', color: isNavActive('/search') ? 'var(--brand-orange)' : 'var(--text-primary)', fontWeight: isNavActive('/search') ? 600 : 500, fontSize: '0.95rem', backgroundColor: isNavActive('/search') ? 'rgba(217,119,6,0.1)' : 'transparent' }}><Building2 size={18} /> Browse Hostels</Link>
            <Link to="/map" onClick={() => setShowMobileNav(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 10, textDecoration: 'none', color: isNavActive('/map') ? 'var(--brand-orange)' : 'var(--text-primary)', fontWeight: isNavActive('/map') ? 600 : 500, fontSize: '0.95rem', backgroundColor: isNavActive('/map') ? 'rgba(217,119,6,0.1)' : 'transparent' }}><MapPin size={18} /> Map View</Link>
            <Link to="/faq" onClick={() => setShowMobileNav(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 10, textDecoration: 'none', color: isNavActive('/faq') ? 'var(--brand-orange)' : 'var(--text-primary)', fontWeight: isNavActive('/faq') ? 600 : 500, fontSize: '0.95rem', backgroundColor: isNavActive('/faq') ? 'rgba(217,119,6,0.1)' : 'transparent' }}><HelpCircle size={18} /> FAQ</Link>
            <Link to="/contact" onClick={() => setShowMobileNav(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 10, textDecoration: 'none', color: isNavActive('/contact') ? 'var(--brand-orange)' : 'var(--text-primary)', fontWeight: isNavActive('/contact') ? 600 : 500, fontSize: '0.95rem', backgroundColor: isNavActive('/contact') ? 'rgba(217,119,6,0.1)' : 'transparent' }}><PhoneCall size={18} /> Contact Us</Link>
          </div>

          {/* Preferences Section: Dark Mode Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.5rem 0.2rem' }}>
              Preferences
            </div>
            <ThemeToggle showLabel={true} />
          </div>

          {/* Account Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
            {user ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setShowMobileNav(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 10, textDecoration: 'none', color: 'var(--brand-orange)', fontWeight: 700, fontSize: '0.95rem', backgroundColor: 'rgba(217,119,6,0.08)' }}>
                  <LayoutDashboard size={18} /> My Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setShowMobileNav(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', borderRadius: 10, width: '100%', background: 'none', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', color: '#ef4444', fontWeight: 600, fontSize: '0.95rem' }}>
                  <LogOut size={18} /> Log Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setShowMobileNav(false)} className="btn btn-primary w-100" style={{ fontWeight: 700, padding: '0.75rem', borderRadius: 10, fontSize: '0.95rem' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
