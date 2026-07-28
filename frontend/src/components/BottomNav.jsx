import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Search, Map, LayoutDashboard, User } from 'lucide-react';

/**
 * BottomNav — Fixed bottom navigation bar shown only on mobile (<768px).
 * Styled via .bottom-nav in index.css.
 */
export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const isActive = (href) => path === href || path.startsWith(href + '/');

  const getDashLink = () => {
    if (!user) return '/login';
    const role = (user.role || '').toLowerCase();
    if (role === 'admin')    return '/admin';
    if (role === 'landlord') return '/landlord';
    return '/student';
  };

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <Link to="/" className={isActive('/') && path === '/' ? 'active' : ''}>
        <Home size={22} />
        <span>Home</span>
      </Link>

      <Link to="/search" className={isActive('/search') ? 'active' : ''}>
        <Search size={22} />
        <span>Search</span>
      </Link>

      <Link to="/map" className={isActive('/map') ? 'active' : ''}>
        <Map size={22} />
        <span>Map</span>
      </Link>

      <Link to={getDashLink()} className={isActive('/student') || isActive('/landlord') || isActive('/admin') ? 'active' : ''}>
        <LayoutDashboard size={22} />
        <span>Dashboard</span>
      </Link>

      {user ? (
        <Link to="/settings" className={isActive('/settings') ? 'active' : ''}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            backgroundColor: 'var(--brand-orange)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700
          }}>
            {(user.full_name || 'U')[0].toUpperCase()}
          </div>
          <span>Profile</span>
        </Link>
      ) : (
        <Link to="/login" className={isActive('/login') ? 'active' : ''}>
          <User size={22} />
          <span>Sign In</span>
        </Link>
      )}
    </nav>
  );
}
