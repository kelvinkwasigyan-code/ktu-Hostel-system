import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Home, Search, Map, LogOut, PlusSquare, Menu, X } from 'lucide-react';
import api from '../services/api';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
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

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = showMobileNav ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileNav]);

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
      await api.patch('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
    } catch { /* silent */ }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'Admin') return '/admin';
    if (user.role === 'Landlord') return '/landlord';
    return '/student';
  };

  const notifIcon = (type) => {
    const icons = {
      BookingRequest: '🏠', BookingAccepted: '✅', BookingDeclined: '❌',
      VacancyAlert: '🔔', VerificationResult: '🎫', System: 'ℹ️'
    };
    return icons[type] || '🔔';
  };

  const isNavActive = (path) => location.pathname === path;

  const navLinks = [
    { label: 'Browse', path: '/search', icon: <Search size={15} /> },
    { label: 'Map', path: '/map', icon: <Map size={15} /> },
    { label: 'FAQ', path: '/faq', icon: null },
    { label: 'Contact', path: '/contact', icon: null },
  ];

  return (
    <>
      <nav className="navbar-hostel">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between w-100">

            {/* Logo */}
            <Link to="/" className="navbar-brand-logo text-decoration-none d-flex align-items-center gap-2">
              <img src="/logo.jpg" alt="Student Hostel Portal Logo" style={{ height: '54px', width: 'auto', borderRadius: '6px' }} />
            </Link>

            {/* Desktop Nav Links */}
            <div className="d-none d-lg-flex align-items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link d-flex align-items-center gap-1 ${isNavActive(link.path) ? 'active' : ''}`}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
              {user && (
                <Link to={getDashboardLink()} className={`nav-link d-flex align-items-center gap-1 ${isNavActive(getDashboardLink()) ? 'active' : ''}`}>
                  <Home size={15} /> Dashboard
                </Link>
              )}
            </div>

            {/* Right: Auth + Notifications + Theme + Hamburger */}
            <div className="d-flex align-items-center gap-2">
              <ThemeToggle />

              {user ? (
                <>
                  {/* Notification Bell */}
                  <div className="position-relative" ref={notifRef}>
                    <div className="notif-bell" onClick={() => setShowNotif(v => !v)}>
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      )}
                    </div>

                    {showNotif && (
                      <div className="notif-dropdown">
                        <div className="d-flex justify-content-between align-items-center p-3"
                             style={{ borderBottom: '1px solid var(--border)' }}>
                          <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                          {unreadCount > 0 && (
                            <button className="btn btn-sm" style={{ color: 'var(--brand-orange)', fontSize: '0.8rem' }}
                                    onClick={handleMarkAllRead}>
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
                              <div key={n.notification_id}
                                   className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
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

                  {/* User Menu — desktop only */}
                  <div className="position-relative d-none d-sm-block" ref={userMenuRef}>
                    <button
                      className="btn d-flex align-items-center gap-2"
                      style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        color: 'var(--text-primary)', borderRadius: '10px', padding: '0.4rem 0.8rem'
                      }}
                      onClick={() => setShowUserMenu(v => !v)}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-gold))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700
                      }}>
                        {user.full_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="d-none d-sm-inline" style={{ fontSize: '0.85rem', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.full_name?.split(' ')[0]}
                      </span>
                    </button>

                    {showUserMenu && (
                      <div style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: '12px', minWidth: 180, zIndex: 2000,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                        animation: 'slideDown 0.15s ease'
                      }}
                      onMouseLeave={() => setShowUserMenu(false)}>
                        <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Signed in as</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.full_name}</div>
                          <span className="badge" style={{ background: 'rgba(255,107,53,0.15)', color: 'var(--brand-orange)', fontSize: '0.7rem' }}>
                            {user.role}
                          </span>
                        </div>
                        <div className="p-1">
                          <Link to={getDashboardLink()} className="d-flex align-items-center gap-2 notif-item"
                                style={{ color: 'var(--text-secondary)', borderRadius: '8px' }}
                                onClick={() => setShowUserMenu(false)}>
                            <Home size={15} /> Dashboard
                          </Link>
                          {user.role === 'Landlord' && (
                            <Link to="/landlord/create" className="d-flex align-items-center gap-2 notif-item"
                                  style={{ color: 'var(--text-secondary)', borderRadius: '8px' }}
                                  onClick={() => setShowUserMenu(false)}>
                              <PlusSquare size={15} /> New Listing
                            </Link>
                          )}
                          <div className="d-flex align-items-center gap-2 notif-item"
                               style={{ color: 'var(--danger)', cursor: 'pointer', borderRadius: '8px' }}
                               onClick={logout}>
                            <LogOut size={15} /> Sign Out
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="d-flex gap-2">
                  <Link to="/login" className="btn btn-outline-primary btn-sm">Sign In</Link>
                  <Link to="/register" className="btn btn-primary btn-sm d-none d-sm-inline-flex">Register</Link>
                </div>
              )}

              {/* Mobile hamburger — opens drawer */}
              <button
                className="d-lg-none btn p-2"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}
                onClick={() => setShowMobileNav(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Nav Drawer ──────────────────────────────────────────────── */}
      {showMobileNav && (
        <>
          {/* Backdrop */}
          <div className="mobile-nav-backdrop" onClick={() => setShowMobileNav(false)} />

          {/* Drawer */}
          <div className="mobile-nav-drawer">
            {/* Header */}
            <div className="mobile-nav-drawer-header">
              <Link to="/" onClick={() => setShowMobileNav(false)}>
                <img src="/logo.jpg" alt="KTU Hostel Portal" style={{ height: '40px', borderRadius: '6px' }} />
              </Link>
              <button className="mobile-nav-drawer-close" onClick={() => setShowMobileNav(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>

            {/* Nav Links */}
            <div className="mobile-nav-drawer-links">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-drawer-link ${isNavActive(link.path) ? 'active' : ''}`}
                  onClick={() => setShowMobileNav(false)}
                >
                  {link.icon && <span style={{ opacity: 0.7 }}>{link.icon}</span>}
                  {link.label}
                </Link>
              ))}

              {user && (
                <>
                  <div className="mobile-nav-drawer-divider" />
                  <Link
                    to={getDashboardLink()}
                    className={`mobile-nav-drawer-link ${isNavActive(getDashboardLink()) ? 'active' : ''}`}
                    onClick={() => setShowMobileNav(false)}
                  >
                    <Home size={15} style={{ opacity: 0.7 }} /> Dashboard
                  </Link>
                  {user.role === 'Landlord' && (
                    <Link to="/landlord/create" className="mobile-nav-drawer-link" onClick={() => setShowMobileNav(false)}>
                      <PlusSquare size={15} style={{ opacity: 0.7 }} /> New Listing
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Footer: user info + sign out / sign in */}
            <div className="mobile-nav-drawer-footer">
              {user ? (
                <div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-gold))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem', fontWeight: 700, color: '#fff'
                    }}>
                      {user.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.full_name}</div>
                      <span className="badge" style={{ background: 'rgba(255,107,53,0.15)', color: 'var(--brand-orange)', fontSize: '0.7rem' }}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => { logout(); setShowMobileNav(false); }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  <Link to="/login" className="btn btn-outline-primary btn-sm w-100" onClick={() => setShowMobileNav(false)}>Sign In</Link>
                  <Link to="/register" className="btn btn-primary btn-sm w-100" onClick={() => setShowMobileNav(false)}>Register</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
