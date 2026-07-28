// src/pages/student/MyBookingsPage.jsx
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, Star, Calendar, MapPin, Upload } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import StudentSidebar from '../../components/StudentSidebar';
import SubmitPayment from '../../components/SubmitPayment';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [viewings, setViewings] = useState([]);
  const [activeTab, setActiveTab] = useState('holds');
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [bRes, vRes] = await Promise.all([
        api.get('/bookings/student/mine'),
        api.get('/viewings/student')
      ]);
      setBookings(bRes.data.bookings || []);
      setViewings(vRes.data.requests || []);
    } catch (err) {
      console.error('Error fetching student portal data:', err);
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setShowModal(true);
  };

  const handleCloseReviewModal = () => {
    setSelectedBooking(null);
    setShowModal(false);
  };

  const handleOpenPaymentModal = (booking) => {
    setPaymentBooking(booking);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentBooking(null);
    setShowPaymentModal(false);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      setSubmittingReview(true);
      await api.post('/reviews', {
        property_id: selectedBooking.property_id,
        booking_id: selectedBooking.booking_id,
        rating,
        comment
      });
      toast.success('Review submitted successfully!');
      handleCloseReviewModal();
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const statusConfig = {
    Pending:  { bg: 'rgba(245,166,35,0.15)',  text: 'var(--brand-gold)',   label: 'Pending Hold',  icon: <Clock size={13} /> },
    Approved: { bg: 'rgba(46,204,113,0.15)',  text: 'var(--success)',      label: 'Approved',       icon: <CheckCircle size={13} /> },
    Declined: { bg: 'rgba(231,76,60,0.15)',   text: 'var(--danger)',       label: 'Declined',       icon: <XCircle size={13} /> },
    Expired:  { bg: 'rgba(148,163,184,0.15)', text: 'var(--text-muted)',   label: 'Expired Hold',   icon: <AlertCircle size={13} /> },
  };

  const StatusBadge = ({ status }) => {
    const c = statusConfig[status] || { bg: 'var(--surface-2)', text: 'var(--text-primary)', label: status, icon: null };
    return (
      <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1"
            style={{ background: c.bg, color: c.text, fontSize: '0.78rem', fontWeight: 600, borderRadius: '6px' }}>
        {c.icon} {c.label}
      </span>
    );
  };

  const LandlordContact = ({ b }) => {
    if (b.status !== 'Approved' && b.status !== 'Pending') {
      return <span className="text-muted-custom" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>Released upon approval</span>;
    }
    return (
      <div className="d-flex flex-column gap-1" style={{ fontSize: '0.82rem' }}>
        <div className="fw-semibold d-flex align-items-center gap-1" style={{ color: 'var(--brand-orange)' }}>
          <Phone size={12} /> {b.landlord_contact?.phone || 'N/A'}
        </div>
        {b.landlord_contact?.momo_number && (
          <div className="text-success small">
            📱 MoMo: <strong>{b.landlord_contact.momo_number}</strong> ({b.landlord_contact.momo_name || 'Account Name'})
          </div>
        )}
        {b.landlord_contact?.email && (
          <div className="text-muted-custom small d-flex align-items-center gap-1">
            <Mail size={11} /> {b.landlord_contact.email}
          </div>
        )}
        {b.landlord_contact?.payment_instructions && (
          <div className="mt-1 p-2 rounded" style={{ background: 'var(--surface-2)', fontSize: '0.72rem', border: '1px solid var(--border)' }}>
            💡 {b.landlord_contact.payment_instructions}
          </div>
        )}
      </div>
    );
  };

  const ActionButton = ({ b }) => {
    if (b.status === 'Approved') return (
      <button className="btn btn-success btn-sm text-white" onClick={() => handleOpenPaymentModal(b)}>
        <Upload size={13} className="me-1" /> Pay / Receipt
      </button>
    );
    if (b.can_review) return (
      <button className="btn btn-primary btn-sm" onClick={() => handleOpenReviewModal(b)}>
        <Star size={13} className="me-1" /> Write Review
      </button>
    );
    if (b.reviewed) return <span className="badge p-2" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>✓ Reviewed</span>;
    return <span className="text-muted-custom">—</span>;
  };

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <StudentSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">

            {/* Page Header */}
            <div className="mb-4">
              <h2 className="mb-1">My Accommodations & Viewings</h2>
              <p className="text-muted-custom mb-0">Track your 24-hour reservation holds and physical viewing requests</p>
            </div>

            {/* Tab Navigation */}
            <div className="d-flex gap-2 mb-4">
              <button 
                className={`btn btn-sm ${activeTab === 'holds' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('holds')}
                style={{ fontWeight: 600 }}
              >
                ⏱️ Reservation Holds ({bookings.length})
              </button>
              <button 
                className={`btn btn-sm ${activeTab === 'viewings' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('viewings')}
                style={{ fontWeight: 600 }}
              >
                📅 Scheduled Viewings ({viewings.length})
              </button>
            </div>

            <hr className="divider-orange mb-4" />

            {/* ── Loading ─────────────────────────────────────────────────── */}
            {loading && (
              <div className="page-loader"><div className="spinner-ring" /></div>
            )}

            {/* ── Active Tab: Holds ─────────────────────────────────────── */}
            {!loading && activeTab === 'holds' && (
              bookings.length === 0 ? (
                <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                  <div className="mb-3" style={{ fontSize: '2.5rem' }}>📭</div>
                  <h5 className="mb-2">No Bookings Yet</h5>
                  <p className="text-muted-custom mx-auto mb-0" style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                    You haven't requested any holds. Head over to the hostel catalog and place a 24-hour hold to secure your booking.
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Desktop Table (hidden on mobile) ───────────────────── */}
                  <div className="d-none d-md-block">
                    <div className="card border-custom bg-surface rounded-custom overflow-hidden">
                      <div className="table-responsive">
                        <table className="table table-hover mb-0" style={{ color: 'var(--text-primary)', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                              <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Property Details</th>
                              <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Date Requested</th>
                              <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Status</th>
                              <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Landlord Contact</th>
                              <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody style={{ verticalAlign: 'middle' }}>
                            {bookings.map(b => (
                              <tr key={b.booking_id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td className="p-3">
                                  <h6 className="mb-1" style={{ fontSize: '0.92rem', fontWeight: 600 }}>{b.properties?.title}</h6>
                                  <small className="text-muted-custom">
                                    📍 {b.properties?.neighborhood} · GHS {Number(b.properties?.price_per_semester).toLocaleString()} / {((b.properties?.payment_frequency) || 'Semester').toLowerCase()}
                                  </small>
                                </td>
                                <td className="p-3" style={{ fontSize: '0.88rem' }}>
                                  {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  <br />
                                  <small className="text-muted-custom">
                                    Expires: {new Date(b.expires_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  </small>
                                </td>
                                <td className="p-3"><StatusBadge status={b.status} /></td>
                                <td className="p-3"><LandlordContact b={b} /></td>
                                <td className="p-3"><ActionButton b={b} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* ── Mobile Card List (hidden on desktop) ───────────────── */}
                  <div className="d-md-none d-flex flex-column gap-3">
                    {bookings.map(b => (
                      <div key={b.booking_id} className="card border-custom bg-surface rounded-custom p-3">

                        {/* Card top: title + status */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0 me-2" style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3 }}>
                            {b.properties?.title}
                          </h6>
                          <StatusBadge status={b.status} />
                        </div>

                        {/* Location + Price */}
                        <div className="d-flex align-items-center gap-1 text-muted-custom mb-2" style={{ fontSize: '0.82rem' }}>
                          <MapPin size={12} />
                          <span>{b.properties?.neighborhood}</span>
                          <span className="ms-2 fw-semibold" style={{ color: 'var(--brand-orange)' }}>
                            GHS {Number(b.properties?.price_per_semester).toLocaleString()}/{((b.properties?.payment_frequency) || 'Semester').toLowerCase()}
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="d-flex align-items-center gap-1 text-muted-custom mb-3" style={{ fontSize: '0.8rem' }}>
                          <Calendar size={12} />
                          <span>
                            Requested {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}Expires {new Date(b.expires_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Landlord contact — shown when Approved or Pending */}
                        {(b.status === 'Approved' || b.status === 'Pending') && (
                          <div className="p-2 rounded-custom mb-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                            <div className="text-muted-custom mb-1" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Landlord Contact
                            </div>
                            <LandlordContact b={b} />
                          </div>
                        )}

                        {/* Action button */}
                        <div className="d-flex justify-content-end">
                          <ActionButton b={b} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}

            {/* ── Active Tab: Viewings ───────────────────────────────────── */}
            {!loading && activeTab === 'viewings' && (
              viewings.length === 0 ? (
                <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                  <div className="mb-3" style={{ fontSize: '2.5rem' }}>📅</div>
                  <h5 className="mb-2">No Scheduled Viewings</h5>
                  <p className="text-muted-custom mx-auto mb-0" style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                    You haven't requested any property viewings yet. Click "Schedule Inspection" on any hostel detail page to request a visit.
                  </p>
                </div>
              ) : (
                <div className="card border-custom bg-surface rounded-custom p-3">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0" style={{ color: 'var(--text-primary)' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-2)' }}>
                          <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Property</th>
                          <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Preferred Date</th>
                          <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Status</th>
                          <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Submitted On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewings.map(v => (
                          <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td className="p-3 fw-semibold">
                              {v.properties?.title}
                              <div className="text-muted-custom small font-normal">📍 {v.properties?.address}, {v.properties?.neighborhood}</div>
                            </td>
                            <td className="p-3 fw-bold text-orange">{v.preferred_date}</td>
                            <td className="p-3">
                              <span className={`badge px-2 py-1 ${
                                v.status === 'approved' ? 'bg-success text-white' :
                                v.status === 'completed' ? 'bg-info text-dark' :
                                v.status === 'rejected' ? 'bg-danger text-white' : 'bg-warning text-dark'
                              }`} style={{ textTransform: 'capitalize' }}>
                                {v.status}
                              </span>
                            </td>
                            <td className="p-3 text-muted-custom small">
                              {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* ── Review Modal ─────────────────────────────────────────────── */}
            {showModal && selectedBooking && (
              <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
                   style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000 }}>
                <div className="card p-4 border-custom bg-surface rounded-custom w-100"
                     style={{ maxWidth: '480px', animation: 'slideDown 0.2s ease' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ fontFamily: 'Outfit,sans-serif' }}>Submit Review</h5>
                    <button className="btn btn-close btn-close-white p-1" onClick={handleCloseReviewModal} />
                  </div>
                  <hr className="border-custom my-2" />

                  <form onSubmit={handleSubmitReview}>
                    <p style={{ fontSize: '0.85rem' }} className="text-muted-custom mb-3">
                      Reviewing: <strong>{selectedBooking.properties?.title}</strong>
                    </p>

                    <div className="mb-3">
                      <label className="form-label d-block">Rating</label>
                      <div className="stars-interactive">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} type="button"
                                  className={`star-btn ${star <= rating ? 'filled' : ''}`}
                                  onClick={() => setRating(star)}>★</button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Review Comment</label>
                      <textarea className="form-control" rows="4"
                                placeholder="Write your stay experience..."
                                required value={comment}
                                onChange={e => setComment(e.target.value)} />
                    </div>

                    <div className="d-flex gap-2 justify-content-end">
                      <button type="button" className="btn btn-secondary" onClick={handleCloseReviewModal}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {/* Payment Modal */}
            {showPaymentModal && paymentBooking && (
              <div className="position-fixed inset-0 d-flex align-items-center justify-content-center p-3"
                   style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000, top: 0, left: 0, width: '100vw', height: '100vh' }}>
                <div className="card p-4 border-custom bg-surface rounded-custom w-100"
                     style={{ maxWidth: '480px', animation: 'slideDown 0.2s ease' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ fontFamily: 'Outfit,sans-serif' }}>Upload Payment Receipt</h5>
                    <button className="btn btn-close btn-close-white p-1" onClick={handleClosePaymentModal} />
                  </div>
                  <hr className="border-custom my-2" />
                  
                  <p style={{ fontSize: '0.85rem' }} className="text-muted-custom mb-3">
                    Paying for: <strong>{paymentBooking.properties?.title}</strong><br/>
                    Amount Due: GHS {Number(paymentBooking.properties?.price_per_semester).toLocaleString()}
                  </p>

                  <SubmitPayment 
                    hostelId={paymentBooking.property_id}
                    landlordId={paymentBooking.properties?.landlord_id}
                    amount={paymentBooking.properties?.price_per_semester}
                    studentId={paymentBooking.student_id}
                    onSuccess={() => {
                      handleClosePaymentModal();
                      fetchBookings();
                    }}
                  />
                  
                  <div className="d-flex justify-content-end mt-2">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleClosePaymentModal}>Close</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
