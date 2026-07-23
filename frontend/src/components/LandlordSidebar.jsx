// src/components/LandlordSidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, List, Inbox, User } from 'lucide-react';

export default function LandlordSidebar() {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/landlord', icon: <Home size={18} /> },
    { name: 'Add Listing', path: '/landlord/create', icon: <PlusSquare size={18} /> },
    { name: 'Manage Listings', path: '/landlord/listings', icon: <List size={18} /> },
    { name: 'Hold Requests', path: '/landlord/requests', icon: <Inbox size={18} /> },
    { name: 'Profile Settings', path: '/landlord/profile', icon: <User size={18} /> }
  ];

  return (
    <aside className="sidebar">
      <div className="d-flex flex-column h-100 justify-content-between">
        <div>
          <div className="px-4 py-2 mb-3 text-muted-custom" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Landlord Portal
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
  );
}
