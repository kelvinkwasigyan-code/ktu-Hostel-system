// src/pages/admin/VerifyLandlordsPage.jsx
import { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, XCircle, Clock, FileText, Phone, Mail } from 'lucide-react';
import Navbar from '../../components/Navbar';
import PortalFooter from '../../components/PortalFooter';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function VerifyLandlordsPage() {
  const [landlords, setLandlords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  useEffect(() => {
    fetchLandlords();
  }, []);

  const fetchLandlords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/landlords');
      setLandlords(res.data.landlords || []);
    } catch (err) {
      console.error('Error fetching landlords:', err);
      toast.error('Failed to load landlord list.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId, action) => {
    if (action === 'reject') {
      const landlord = landlords.find(l => l.user_id === userId);
      setSelectedLandlord(landlord);
      setRejectReason('');
      setShowRejectModal(true);
      return;
    }

    try {
      await api.patch(`/admin/landlords/${userId}/verify`, { action });
      toast.success(`Landlord successfully approved!`);
      // Update state
      setLandlords(prev => prev.map(l =>
        l.user_id === userId ? { ...l, verification_status: 'Approved' } : l
      ));
    } catch (err) {
      toast.error('Failed to update verification status.');
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedLandlord) return;

    try {
      setSubmittingReject(true);
      await api.patch(`/admin/landlords/${selectedLandlord.user_id}/verify`, {
        action: 'reject',
        reason: rejectReason
      });
      toast.success('Landlord registration rejected.');
      setShowRejectModal(false);
      setSelectedLandlord(null);
      fetchLandlords(); // Refresh data
    } catch (err) {
      toast.error('Failed to submit rejection.');
    } finally {
      setSubmittingReject(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      Approved: { bg: 'rgba(46, 204, 113, 0.15)', text: 'var(--success)', icon: <ShieldCheck size={14} /> },
      Pending: { bg: 'rgba(245, 166, 35, 0.15)', text: 'var(--brand-gold)', icon: <Clock size={14} /> },
      Rejected: { bg: 'rgba(231, 76, 60, 0.15)', text: 'var(--danger)', icon: <XCircle size={14} /> }
    };
    const c = configs[status] || { bg: 'var(--surface-2)', text: 'var(--text-primary)', icon: null };
    return (
      <span className="badge d-inline-flex align-items-center gap-1 p-2" style={{ backgroundColor: c.bg, color: c.text, fontSize: '0.8rem', fontWeight: 600 }}>
        {c.icon} {status}
      </span>
    );
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
              <h2 className="mb-1">Landlord Verifications</h2>
              <p className="text-muted-custom mb-0">Approve or reject landlord registration requests based on ID documentation</p>
            </div>

            <hr className="divider-orange mb-4" />

            {loading ? (
              <div className="page-loader">
                <div className="spinner-ring"></div>
              </div>
            ) : landlords.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <h5 className="mb-2">No Landlords Found</h5>
                <p className="text-muted-custom mx-auto mb-0" style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                  No landlord users have registered on the platform yet.
                </p>
              </div>
            ) : (
              <div className="card border-custom bg-surface rounded-custom overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover mb-0" style={{ color: 'var(--text-primary)', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Landlord</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Contact</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>ID Document</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Status</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem', width: '200px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody style={{ verticalAlign: 'middle' }}>
                      {landlords.map(l => (
                        <tr key={l.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="p-3">
                            <h6 className="mb-1" style={{ fontSize: '0.92rem', fontWeight: 600 }}>{l.full_name}</h6>
                            <small className="text-muted-custom">
                              Registered: {new Date(l.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </small>
                          </td>
                          <td className="p-3" style={{ fontSize: '0.85rem' }}>
                            <div className="d-flex align-items-center gap-1 mb-1">
                              <Mail size={12} className="text-orange" />
                              <span>{l.email}</span>
                            </div>
                            <div className="d-flex align-items-center gap-1 text-muted-custom">
                              <Phone size={12} />
                              <span>{l.phone}</span>
                            </div>
                          </td>
                          <td className="p-3" style={{ fontSize: '0.85rem' }}>
                            {l.id_document_path ? (
                              <a
                                href={l.id_document_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="d-inline-flex align-items-center gap-1 text-decoration-none text-orange fw-bold"
                              >
                                <FileText size={14} /> View ID Document
                              </a>
                            ) : (
                              <span className="text-muted-custom">No file uploaded</span>
                            )}
                          </td>
                          <td className="p-3">{getStatusBadge(l.verification_status)}</td>
                          <td className="p-3">
                            {l.verification_status === 'Pending' ? (
                              <div className="d-flex gap-2">
                                <button className="btn btn-success btn-sm py-1 px-3" onClick={() => handleVerify(l.user_id, 'approve')}>
                                  Approve
                                </button>
                                <button className="btn btn-danger btn-sm py-1 px-3" onClick={() => handleVerify(l.user_id, 'reject')}>
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-custom">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Rejection Modal */}
            {showRejectModal && selectedLandlord && (
              <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000 }}>
                <div className="card p-4 border-custom bg-surface rounded-custom" style={{ width: '100%', maxWidth: '440px', animation: 'slideDown 0.15s ease' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 text-danger" style={{ fontFamily: 'Outfit,sans-serif' }}>Reject Verification</h5>
                    <button className="btn btn-close btn-close-white p-1" onClick={() => setShowRejectModal(false)}></button>
                  </div>
                  <hr className="border-custom my-2" />

                  <form onSubmit={handleConfirmReject}>
                    <p style={{ fontSize: '0.85rem' }} className="text-muted-custom mb-3">
                      Please state the reason for rejecting verification of landlord <strong>{selectedLandlord.full_name}</strong>.
                    </p>

                    <div className="mb-3">
                      <label className="form-label">Rejection Reason</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="e.g. Uploaded document is blurred, ID expired..."
                        required
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="d-flex gap-2 justify-content-end">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                      <button type="submit" className="btn btn-danger" disabled={submittingReject}>
                        {submittingReject ? 'Submitting...' : 'Reject Landlord'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
          <PortalFooter />
        </main>
      </div>
    </>
  );
}
