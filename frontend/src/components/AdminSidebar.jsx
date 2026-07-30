// src/components/AdminSidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { Home, ShieldCheck, ListCheck, MessageSquare, BarChart2, Users, Database } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard',          path: '/admin',            icon: <Home size={18} /> },
  { name: 'Verify Landlords',   path: '/admin/verify',     icon: <ShieldCheck size={18} /> },
  { name: 'Moderate Listings',  path: '/admin/listings',   icon: <ListCheck size={18} /> },
  { name: 'Moderate Reviews',   path: '/admin/reviews',    icon: <MessageSquare size={18} /> },
  { name: 'Platform Analytics', path: '/admin/analytics',  icon: <BarChart2 size={18} /> },
  { name: 'Manage Users',       path: '/admin/users',      icon: <Users size={18} /> },
  { name: 'Audit Logs',         path: '/admin/audit-logs', icon: <Database size={18} /> },
];

const mobileTabItems = [
  { name: 'Home',      path: '/admin',            icon: <Home size={20} /> },
  { name: 'Verify',   path: '/admin/verify',     icon: <ShieldCheck size={20} /> },
  { name: 'Listings', path: '/admin/listings',   icon: <ListCheck size={20} /> },
  { name: 'Audit',    path: '/admin/audit-logs', icon: <Database size={20} /> },
  { name: 'Users',    path: '/admin/users',      icon: <Users size={20} /> },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar d-none d-lg-flex flex-column">
        <div className="d-flex flex-column h-100 justify-content-between">
          <div>
            <div className="px-4 py-2 mb-3 text-muted-custom" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Admin Portal
            </div>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`sidebar-item text-decoration-none ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Tab Bar ────────────────────────────────────────── */}
      <nav className="mobile-bottom-nav d-lg-none" aria-label="Admin mobile navigation">
        <div className="mobile-bottom-nav-inner">
          {mobileTabItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`mobile-tab-item ${isActive ? 'active' : ''}`}
                aria-label={item.name}
              >
                {item.icon}
                <span className="mobile-tab-label">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
