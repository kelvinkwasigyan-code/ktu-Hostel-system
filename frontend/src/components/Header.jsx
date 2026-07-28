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

          {/* Utilities */}
          <ThemeToggle />

          {user && (
            <div className="position-relative" ref={notifRef}>
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 relative border-0 bg-transparent"
                onClick={() => setShowNotif(v => !v)}
                style={{ position: 'relative', padding: '0.5rem', color: 'var(--text-secondary, #64748b)', cursor: 'pointer' }}
                aria-label="Notifications"
              >
                🔔
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

          {/* Profile */}
          {user && (
            <div className="position-relative" ref={userMenuRef}>
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
                    onClick={logout}
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
            className="btn d-md-none p-1"
            style={{ color: 'var(--text-primary)' }}
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
          className="d-md-none border-top px-4 py-3"
          style={{
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div className="d-flex flex-column gap-2">
            <Link to="/search" className="nav-link py-2 d-flex align-items-center gap-2"><Building2 size={16} /> Browse Hostels</Link>
            <Link to="/map" className="nav-link py-2 d-flex align-items-center gap-2"><MapPin size={16} /> Map View</Link>
            <Link to="/faq" className="nav-link py-2 d-flex align-items-center gap-2"><HelpCircle size={16} /> FAQ</Link>
            <Link to="/contact" className="nav-link py-2 d-flex align-items-center gap-2"><PhoneCall size={16} /> Contact Us</Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="nav-link py-2 fw-bold text-orange d-flex align-items-center gap-2">
                  <LayoutDashboard size={16} /> My Dashboard
                </Link>
                <button onClick={logout} className="btn btn-outline-danger btn-sm text-start py-2 mt-2">
                  <LogOut size={16} className="me-2" /> Log Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary w-100 mt-2">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
