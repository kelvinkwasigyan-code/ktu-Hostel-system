// src/pages/admin/ModerateListingsPage.jsx
import { useState, useEffect } from 'react';
import { List, CheckCircle, XCircle, Clock, MapPin, DollarSign, Home, Image, Eye } from 'lucide-react';
import Navbar from '../../components/Navbar';
import PortalFooter from '../../components/PortalFooter';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  Approved: { bg: 'rgba(46,204,113,0.15)', color: 'var(--success)', icon: <CheckCircle size={13} /> },
  Pending: { bg: 'rgba(245,166,35,0.15)', color: 'var(--brand-gold)', icon: <Clock size={13} /> },
  Rejected: { bg: 'rgba(231,76,60,0.15)', color: 'var(--danger)', icon: <XCircle size={13} /> },
};

export default function ModerateListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilter] = useState('all');

  // Detail drawer
  const [selected, setSelected] = useState(null);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchListings(); }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/listings');
      setListings(res.data.listings || []);
    } catch {
      toast.error('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (propertyId) => {
    try {
      await api.patch(`/admin/listings/${propertyId}/moderate`, { action: 'approve' });
      toast.success('Listing approved and published!');
      setListings(prev => prev.map(l =>
        l.property_id === propertyId ? { ...l, verification_status: 'Approved' } : l
      ));
      if (selected?.property_id === propertyId) setSelected(s => ({ ...s, verification_status: 'Approved' }));
    } catch {
      toast.error('Failed to approve listing.');
    }
  };

  const openRejectModal = (listing) => {
    setRejectTarget(listing);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;
    try {
      setSubmitting(true);
      await api.patch(`/admin/listings/${rejectTarget.property_id}/moderate`, {
        action: 'reject',
        reason: rejectReason,
      });
      toast.success('Listing rejected.');
      setListings(prev => prev.map(l =>
        l.property_id === rejectTarget.property_id ? { ...l, verification_status: 'Rejected' } : l
      ));
      if (selected?.property_id === rejectTarget.property_id) setSelected(s => ({ ...s, verification_status: 'Rejected' }));
      setShowRejectModal(false);
    } catch {
      toast.error('Failed to reject listing.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const c = STATUS_CONFIG[status] || { bg: 'var(--surface-2)', color: 'var(--text-primary)', icon: null };
    return (
      <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1"
        style={{ backgroundColor: c.bg, color: c.color, fontSize: '0.78rem', fontWeight: 600 }}>
        {c.icon} {status}
      </span>
    );
  };

  const filtered = filterStatus === 'all' ? listings : listings.filter(l => l.verification_status === filterStatus);

  const counts = {
    all: listings.length,
    Pending: listings.filter(l => l.verification_status === 'Pending').length,
    Approved: listings.filter(l => l.verification_status === 'Approved').length,
    Rejected: listings.filter(l => l.verification_status === 'Rejected').length,
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
              <h2 className="mb-1">Moderate Listings</h2>
              <p className="text-muted-custom mb-0">Review and approve or reject property listings submitted by landlords</p>
            </div>
            <hr className="divider-orange mb-4" />

            {/* Filter tabs */}
            <div className="d-flex gap-2 mb-4 flex-wrap">
              {[
                { key: 'all', label: 'All' },
                { key: 'Pending', label: 'Pending' },
                { key: 'Approved', label: 'Approved' },
                { key: 'Rejected', label: 'Rejected' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className="btn btn-sm"
                  style={{
                    background: filterStatus === tab.key ? 'var(--brand-orange)' : 'var(--surface-2)',
                    color: filterStatus === tab.key ? '#fff' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label} <span style={{ opacity: 0.75 }}>({counts[tab.key]})</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="page-loader"><div className="spinner-ring"></div></div>
            ) : filtered.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <List size={40} className="text-muted-custom mx-auto mb-3" style={{ opacity: 0.4 }} />
                <h5 className="mb-1">No Listings</h5>
                <p className="text-muted-custom mb-0" style={{ fontSize: '0.9rem' }}>
                  No listings match the selected filter.
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {filtered.map(listing => (
                  <div key={listing.property_id} className="col-12">
                    <div className="card border-custom bg-surface rounded-custom p-0 overflow-hidden"
                      style={{ transition: 'box-shadow 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,140,0,0.09)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                      <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-0">

                        {/* Photo thumbnail */}
                        <div style={{ width: '120px', minHeight: '100px', background: 'var(--surface-2)', flexShrink: 0 }}
                          className="d-flex align-items-center justify-content-center d-none d-sm-flex">
                          {(() => {
                            const imgs = listing.property_images || [];
                            const sorted = [...imgs].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
                            const src = sorted[0]?.image_path;
                            return src ? (
                              <img src={src} alt={listing.title}
                                style={{ width: '120px', height: '100px', objectFit: 'cover' }} />
                            ) : (
                              <Image size={28} style={{ opacity: 0.3, color: 'var(--text-muted)' }} />
                            );
                          })()}
                        </div>
                        {/* Mobile Photo thumbnail (full width) */}
                        <div style={{ width: '100%', height: '180px', background: 'var(--surface-2)', flexShrink: 0 }}
                          className="d-flex align-items-center justify-content-center d-sm-none">
                          {(() => {
                            const imgs = listing.property_images || [];
                            const sorted = [...imgs].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
                            const src = sorted[0]?.image_path;
                            return src ? (
                              <img src={src} alt={listing.title}
                                style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            ) : (
                              <Image size={36} style={{ opacity: 0.3, color: 'var(--text-muted)' }} />
                            );
                          })()}
                        </div>

                        {/* Info */}
                        <div className="flex-grow-1 p-3">
                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                            <div>
                              <h6 className="mb-1 fw-bold" style={{ fontSize: '0.95rem' }}>{listing.title}</h6>
                              <div className="d-flex gap-3 flex-wrap" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                <span><MapPin size={12} className="me-1" />{listing.neighborhood}, {listing.city}</span>
                                <span><Home size={12} className="me-1" />{listing.property_type}</span>
                                <span><DollarSign size={12} className="me-1" />GHS {Number(listing.price_per_semester).toLocaleString()} / {((listing.payment_frequency) || 'Semester').toLowerCase()}</span>
                              </div>
                              <div className="mt-1" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Landlord: <strong style={{ color: 'var(--text-primary)' }}>{listing.users?.full_name}</strong>
                                &nbsp;·&nbsp;Submitted: {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                            <div className="d-none d-md-block">{getStatusBadge(listing.verification_status)}</div>
                          </div>
                          {/* Mobile status badge */}
                          <div className="d-md-none mt-2">
                            {getStatusBadge(listing.verification_status)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="d-flex gap-2 align-items-center p-3 flex-wrap flex-sm-nowrap border-top border-sm-top-0" style={{ borderLeft: '1px solid var(--border)' }}>
                          <button
                            className="btn btn-sm w-100"
                            style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                            onClick={() => setSelected(selected?.property_id === listing.property_id ? null : listing)}
                          >
                            <Eye size={14} className="me-1" /> Details
                          </button>
                          {listing.verification_status === 'Pending' && (
                            <>
                              <button className="btn btn-success btn-sm flex-grow-1 px-3" onClick={() => handleApprove(listing.property_id)}>Approve</button>
                              <button className="btn btn-danger btn-sm flex-grow-1 px-3" onClick={() => openRejectModal(listing)}>Reject</button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expandable detail panel */}
                      {selected?.property_id === listing.property_id && (
                        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)', padding: '1rem 1.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', animation: 'slideDown 0.15s ease' }}>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <p className="mb-1"><strong style={{ color: 'var(--text-primary)' }}>Description:</strong></p>
                              <p className="mb-0" style={{ lineHeight: 1.6 }}>{listing.description || 'No description provided.'}</p>
                            </div>
                            <div className="col-md-3">
                              <p className="mb-1"><strong style={{ color: 'var(--text-primary)' }}>Amenities:</strong></p>
                              {listing.amenities?.length > 0 ? (
                                <ul className="mb-0 ps-3" style={{ fontSize: '0.82rem' }}>
                                  {listing.amenities.map((a, i) => <li key={i}>{a}</li>)}
                                </ul>
                              ) : <span>None specified</span>}
                            </div>
                            <div className="col-md-3">
                              <p className="mb-1"><strong style={{ color: 'var(--text-primary)' }}>Capacity / Rooms:</strong></p>
                              <p className="mb-0">{listing.rooms_available || '—'} room(s)</p>
                              <p className="mb-0 mt-1"><strong style={{ color: 'var(--text-primary)' }}>Gender Policy:</strong> {listing.gender_policy || 'Any'}</p>
                              <p className="mb-0 mt-1"><strong style={{ color: 'var(--text-primary)' }}>Latitude/Long:</strong> {listing.latitude ? `${listing.latitude}, ${listing.longitude}` : 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <PortalFooter />
        </main>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && rejectTarget && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000 }}>
          <div className="card p-4 border-custom bg-surface rounded-custom"
            style={{ width: '100%', maxWidth: '440px', animation: 'slideDown 0.15s ease' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-danger" style={{ fontFamily: 'Outfit,sans-serif' }}>Reject Listing</h5>
              <button className="btn btn-close btn-close-white p-1" onClick={() => setShowRejectModal(false)} />
            </div>
            <hr className="border-custom my-2" />
            <form onSubmit={handleConfirmReject}>
              <p style={{ fontSize: '0.85rem' }} className="text-muted-custom mb-3">
                Please state the reason for rejecting <strong>{rejectTarget.title}</strong>.
              </p>
              <div className="mb-3">
                <label className="form-label">Rejection Reason</label>
                <textarea
                  className="form-control"
                  rows="3"
                  required
                  placeholder="e.g. Photos not clear, price seems unreasonable, location mismatch..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Reject Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
    </>
  );
}
