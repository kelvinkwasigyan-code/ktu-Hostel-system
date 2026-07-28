import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, MapPin, HelpCircle, PhoneCall,
  LayoutDashboard, Bell, LogOut, Menu, X,
  Home, PlusSquare
} from 'lucide-react';
import api from '../services/api';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotif,     setShowNotif]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const notifRef   = useRef(null);
  const userMenuRef = useRef(null);

  // Close mobile nav on route change
  useEffect(() => { setShowMobileNav(false); }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = showMobileNav ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileNav]);

  // Poll notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const iv = setInterval(fetchNotifications, 30000);
      return () => clearInterval(iv);
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setShowNotif(false);
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
      setNotifications([]); setUnreadCount(0);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    const r = (user.role || '').toLowerCase();
    if (r === 'admin')    return '/admin';
    if (r === 'landlord') return '/landlord';
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

  const isActive = (path) => location.pathname === path;

  /* ─── inline style tokens ─────────────────────────────────────── */
  const NAV_LINK = (active) => ({
    textDecoration: 'none',
    color: active ? 'var(--brand-orange)' : 'var(--text-secondary, #475569)',
    fontWeight: active ? 600 : 500,
    fontSize: '0.9rem',
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    transition: 'color 0.15s',
  });

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      backgroundColor: 'var(--surface-glass, rgba(255,255,255,0.97))',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border, #e2e8f0)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {/* ── Main bar ──────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 1rem', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* LEFT: Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <img
            src="/logo.jpg"
            alt="KTU Housing Portal"
            style={{ height: 40, width: 'auto', maxWidth: 40, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }}
          />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary, #0f172a)', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            KTU <span style={{ color: 'var(--brand-orange, #d97706)' }}>Housing Portal</span>
          </span>
        </Link>

        {/* CENTER: Desktop nav — hidden on mobile via inline media-like wrapper */}
        <nav className="d-none d-md-flex" style={{ alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/search"  style={NAV_LINK(isActive('/search'))} ><Building2 size={15}/> Browse Hostels</Link>
          <Link to="/map"     style={NAV_LINK(isActive('/map'))}    ><MapPin size={15}/>    Map View</Link>
          <Link to="/faq"     style={NAV_LINK(isActive('/faq'))}    ><HelpCircle size={15}/>FAQ</Link>
          <Link to="/contact" style={NAV_LINK(isActive('/contact'))} ><PhoneCall size={15}/>Contact Us</Link>
        </nav>

        {/* RIGHT: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          {/* Dashboard link — desktop only */}
          {user ? (
            <Link to={getDashboardLink()} className="d-none d-md-inline-flex" style={{
              alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem',
              fontWeight: 600, padding: '0.4rem 0.85rem', borderRadius: 8,
              backgroundColor: 'var(--surface-2, #f1f5f9)',
              color: 'var(--text-primary, #1e293b)', textDecoration: 'none',
            }}>
              <LayoutDashboard size={14}/> My Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm d-none d-md-inline-flex" style={{ fontWeight: 600 }}>
              Sign In
            </Link>
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications bell */}
          {user && (
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotif(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0.4rem', color: 'var(--text-secondary, #64748b)',
                  position: 'relative',
                }}
                aria-label="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 15, height: 15, borderRadius: '50%',
                    backgroundColor: '#ef4444', color: '#fff',
                    fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="notif-dropdown">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                    {unreadCount > 0 && (
                      <button className="btn btn-sm" style={{ color: 'var(--brand-orange)', fontSize: '0.8rem' }} onClick={handleMarkAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications yet</div>
                    ) : notifications.slice(0, 10).map(n => (
                      <div key={n.notification_id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span>{notifIcon(n.type)}</span>
                          <div>
                            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.4 }}>{n.message}</p>
                            <small style={{ color: 'var(--text-muted)' }}>
                              {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User avatar + dropdown — desktop */}
          {user && (
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderLeft: '1px solid var(--border, #e2e8f0)',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: 'var(--brand-orange)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem',
                }}>
                  {(user.full_name || 'U')[0].toUpperCase()}
                </div>
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  minWidth: 180, backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 1050, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{user.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</div>
                  </div>
                  <Link to={getDashboardLink()} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                    <Home size={14}/> Dashboard
                  </Link>
                  {user.role === 'Landlord' && (
                    <Link to="/landlord/create" className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                      <PlusSquare size={14}/> Add Property
                    </Link>
                  )}
                  <button onClick={logout} className="dropdown-item text-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.85rem', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <LogOut size={14}/> Log Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger — ONLY on mobile */}
          <button
            type="button"
            className="d-md-none"
            onClick={() => setShowMobileNav(v => !v)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: 'var(--text-primary)' }}
          >
            {showMobileNav ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ──────────────────────────────────────────── */}
      {showMobileNav && (
        <div className="d-md-none" style={{
          backgroundColor: 'var(--surface, #fff)',
          borderTop: '1px solid var(--border, #e2e8f0)',
          padding: '0.5rem 0.75rem 1rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        }}>
          {/* Nav links */}
          {[
            { to: '/search',  icon: <Building2 size={17}/>, label: 'Browse Hostels' },
            { to: '/map',     icon: <MapPin size={17}/>,    label: 'Map View' },
            { to: '/faq',     icon: <HelpCircle size={17}/>,label: 'FAQ' },
            { to: '/contact', icon: <PhoneCall size={17}/>, label: 'Contact Us' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setShowMobileNav(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.65rem 0.75rem', borderRadius: 8, textDecoration: 'none',
                color: isActive(item.to) ? 'var(--brand-orange)' : 'var(--text-primary, #1e293b)',
                fontWeight: isActive(item.to) ? 600 : 500,
                fontSize: '0.95rem',
                backgroundColor: isActive(item.to) ? 'rgba(255,107,53,0.08)' : 'transparent',
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}

          {/* Divider + user actions */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setShowMobileNav(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.65rem 0.75rem', borderRadius: 8, textDecoration: 'none',
                    color: 'var(--brand-orange)', fontWeight: 700, fontSize: '0.95rem',
                  }}
                >
                  <LayoutDashboard size={17}/> My Dashboard
                </Link>
                <button
                  onClick={() => { logout(); setShowMobileNav(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.65rem 0.75rem', borderRadius: 8, width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#ef4444', fontWeight: 500, fontSize: '0.95rem',
                  }}
                >
                  <LogOut size={17}/> Log Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setShowMobileNav(false)}
                className="btn btn-primary w-100 mt-1"
                style={{ fontWeight: 700 }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
