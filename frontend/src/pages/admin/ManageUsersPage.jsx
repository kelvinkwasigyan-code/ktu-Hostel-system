// src/pages/admin/ManageUsersPage.jsx
import { useState, useEffect } from 'react';
import { Users, Search, Shield, UserCheck, UserX, GraduationCap, BriefcaseBusiness, Trash2, Ban, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import PortalFooter from '../../components/PortalFooter';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  Student: { color: 'var(--info)', bg: 'rgba(23,162,184,0.15)', icon: <GraduationCap size={13} /> },
  Landlord: { color: 'var(--brand-orange)', bg: 'rgba(255,140,0,0.15)', icon: <BriefcaseBusiness size={13} /> },
  Admin: { color: 'var(--brand-gold)', bg: 'rgba(245,166,35,0.15)', icon: <Shield size={13} /> },
};

const VERIF_CONFIG = {
  Approved: { color: 'var(--success)', bg: 'rgba(46,204,113,0.15)', label: 'Verified' },
  Pending: { color: 'var(--brand-gold)', bg: 'rgba(245,166,35,0.15)', label: 'Pending' },
  Rejected: { color: 'var(--danger)', bg: 'rgba(231,76,60,0.15)', label: 'Rejected' },
  N_A: { color: 'var(--text-muted)', bg: 'var(--surface-2)', label: 'N/A' },
};

function RoleBadge({ role }) {
  const c = ROLE_CONFIG[role] || { color: 'var(--text-muted)', bg: 'var(--surface-2)', icon: null };
  return (
    <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1"
      style={{ background: c.bg, color: c.color, fontSize: '0.78rem', fontWeight: 600 }}>
      {c.icon} {role}
    </span>
  );
}

function VerifBadge({ status }) {
  const c = VERIF_CONFIG[status] || VERIF_CONFIG['N_A'];
  return (
    <span className="badge px-2 py-1"
      style={{ background: c.bg, color: c.color, fontSize: '0.75rem', fontWeight: 600 }}>
      {c.label}
    </span>
  );
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Action modals
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!deactivateTarget) return;
    try {
      setActionSubmitting(true);
      const newStatus = deactivateTarget.is_active ? 'deactivate' : 'activate';
      await api.patch(`/admin/users/${deactivateTarget.user_id}/status`, { action: newStatus });
      toast.success(`User ${newStatus === 'deactivate' ? 'deactivated' : 'reactivated'} successfully.`);
      setUsers(prev => prev.map(u =>
        u.user_id === deactivateTarget.user_id ? { ...u, is_active: !u.is_active } : u
      ));
      setDeactivateTarget(null);
    } catch {
      toast.error('Failed to update user status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      setActionSubmitting(true);
      await api.delete(`/admin/users/${deleteTarget.user_id}`);
      toast.success('User account deleted permanently.');
      setUsers(prev => prev.filter(u => u.user_id !== deleteTarget.user_id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete user.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !searchQuery ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    all: users.length,
    Student: users.filter(u => u.role === 'Student').length,
    Landlord: users.filter(u => u.role === 'Landlord').length,
    Admin: users.filter(u => u.role === 'Admin').length,
  };

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <AdminSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">

            {/* Header */}
            <div className="mb-4">
              <h2 className="mb-1">Manage Users</h2>
              <p className="text-muted-custom mb-0">View, search, deactivate, or remove user accounts across all roles</p>
            </div>
            <hr className="divider-orange mb-4" />

            {/* Controls row */}
            <div className="d-flex gap-3 mb-4 flex-wrap align-items-center">
              {/* Search */}
              <div className="position-relative flex-grow-1" style={{ maxWidth: '360px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email or phone…"
                  style={{ paddingLeft: '38px' }}
                  value={searchQuery}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Role filter buttons */}
              <div className="d-flex gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'Student', label: 'Students' },
                  { key: 'Landlord', label: 'Landlords' },
                  { key: 'Admin', label: 'Admins' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setRoleFilter(tab.key)}
                    className="btn btn-sm"
                    style={{
                      background: roleFilter === tab.key ? 'var(--brand-orange)' : 'var(--surface-2)',
                      color: roleFilter === tab.key ? '#fff' : 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                    }}
                  >
                    {tab.label} <span style={{ opacity: 0.7 }}>({counts[tab.key]})</span>
                  </button>
                ))}
              </div>

              {/* Refresh */}
              <button
                className="btn btn-sm ms-auto"
                onClick={fetchUsers}
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              >
                <RefreshCw size={14} className="me-1" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="page-loader"><div className="spinner-ring"></div></div>
            ) : filtered.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <Users size={40} className="text-muted-custom mx-auto mb-3" style={{ opacity: 0.4 }} />
                <h5 className="mb-1">No Users Found</h5>
                <p className="text-muted-custom mb-0" style={{ fontSize: '0.9rem' }}>
                  {searchQuery ? 'No users match your search.' : 'No users registered yet.'}
                </p>
              </div>
            ) : (
              <div className="card border-custom bg-surface rounded-custom overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover mb-0" style={{ color: 'var(--text-primary)', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.82rem' }}>User</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.82rem' }}>Email / Phone</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.82rem' }}>Role</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.82rem' }}>Verification</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.82rem' }}>Status</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.82rem' }}>Joined</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.82rem', width: '180px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody style={{ verticalAlign: 'middle' }}>
                      {filtered.map(user => (
                        <tr key={user.user_id} style={{ borderBottom: '1px solid var(--border)', opacity: user.is_active === false ? 0.55 : 1 }}>
                          <td className="p-3">
                            <div className="d-flex align-items-center gap-2">
                              {/* Avatar initials */}
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-gold))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.82rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                              }}>
                                {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user.full_name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <div>{user.email}</div>
                            <div>{user.phone || '—'}</div>
                          </td>
                          <td className="p-3"><RoleBadge role={user.role} /></td>
                          <td className="p-3">
                            {user.role === 'Landlord'
                              ? <VerifBadge status={user.verification_status || 'Pending'} />
                              : <VerifBadge status="N_A" />}
                          </td>
                          <td className="p-3">
                            <span className="badge px-2 py-1"
                              style={{
                                background: user.is_active !== false ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)',
                                color: user.is_active !== false ? 'var(--success)' : 'var(--danger)',
                                fontSize: '0.75rem', fontWeight: 600,
                              }}>
                              {user.is_active !== false ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="p-3" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-3">
                            {user.role !== 'Admin' && (
                              <div className="d-flex gap-2 flex-wrap">
                                <button
                                  className={`btn btn-sm px-2 ${user.is_active !== false ? 'btn-warning' : 'btn-success'}`}
                                  title={user.is_active !== false ? 'Deactivate Account' : 'Reactivate Account'}
                                  onClick={() => setDeactivateTarget(user)}
                                >
                                  {user.is_active !== false
                                    ? <><Ban size={12} className="me-1" /> Deactivate</>
                                    : <><RefreshCw size={12} className="me-1" /> Reactivate</>}
                                </button>
                                <button
                                  className="btn btn-danger btn-sm px-2"
                                  title="Delete Account"
                                  onClick={() => setDeleteTarget(user)}
                                >
                                  <Trash2 size={12} className="me-1" /> Delete
                                </button>
                              </div>
                            )}
                            {user.role === 'Admin' && (
                              <span className="text-muted-custom" style={{ fontSize: '0.78rem' }}>Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
          <PortalFooter />
        </main>
      </div>

      {/* Deactivate / Reactivate Modal */}
      {deactivateTarget && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000 }}>
          <div className="card p-4 border-custom bg-surface rounded-custom"
            style={{ width: '100%', maxWidth: '420px', animation: 'slideDown 0.15s ease' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0" style={{ fontFamily: 'Outfit,sans-serif', color: deactivateTarget.is_active !== false ? 'var(--warning)' : 'var(--success)' }}>
                {deactivateTarget.is_active !== false ? 'Deactivate Account' : 'Reactivate Account'}
              </h5>
              <button className="btn btn-close btn-close-white p-1" onClick={() => setDeactivateTarget(null)} />
            </div>
            <hr className="border-custom my-2" />
            <p className="text-muted-custom mb-3" style={{ fontSize: '0.88rem' }}>
              {deactivateTarget.is_active !== false
                ? <>Are you sure you want to deactivate the account of <strong>{deactivateTarget.full_name}</strong>? They will not be able to log in until reactivated.</>
                : <>Reactivate <strong>{deactivateTarget.full_name}</strong>'s account? They will regain full platform access.</>
              }
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-secondary" onClick={() => setDeactivateTarget(null)}>Cancel</button>
              <button
                className={`btn ${deactivateTarget.is_active !== false ? 'btn-warning' : 'btn-success'}`}
                disabled={actionSubmitting}
                onClick={handleToggleActive}
              >
                {actionSubmitting ? 'Processing...' : (deactivateTarget.is_active !== false ? 'Deactivate' : 'Reactivate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000 }}>
          <div className="card p-4 border-custom bg-surface rounded-custom"
            style={{ width: '100%', maxWidth: '420px', animation: 'slideDown 0.15s ease' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-danger" style={{ fontFamily: 'Outfit,sans-serif' }}>Delete User</h5>
              <button className="btn btn-close btn-close-white p-1" onClick={() => setDeleteTarget(null)} />
            </div>
            <hr className="border-custom my-2" />
            <p className="text-muted-custom mb-3" style={{ fontSize: '0.88rem' }}>
              Permanently delete <strong>{deleteTarget.full_name}</strong>'s account? All their data (listings, bookings, reviews) will be removed. This cannot be undone.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={actionSubmitting} onClick={handleDeleteUser}>
                {actionSubmitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
}
