// src/pages/student/MyBookingsPage.jsx
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, User, Star } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import StudentSidebar from '../../components/StudentSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/student/mine');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Error fetching student bookings:', err);
      toast.error('Failed to load bookings.');
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
      fetchBookings(); // refresh booking lists to update review buttons
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit review.';
      toast.error(errorMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      Pending: { bg: 'rgba(245, 166, 35, 0.15)', text: 'var(--brand-gold)', label: 'Pending Hold', icon: <Clock size={14} /> },
      Approved: { bg: 'rgba(46, 204, 113, 0.15)', text: 'var(--success)', label: 'Approved', icon: <CheckCircle size={14} /> },
      Declined: { bg: 'rgba(231, 76, 60, 0.15)', text: 'var(--danger)', label: 'Declined', icon: <XCircle size={14} /> },
      Expired: { bg: 'rgba(255, 255, 255, 0.08)', text: 'var(--text-muted)', label: 'Expired Hold', icon: <AlertCircle size={14} /> }
    };
    const c = configs[status] || { bg: 'var(--surface-2)', text: 'var(--text-primary)', label: status, icon: null };
    return (
      <span className="badge d-inline-flex align-items-center gap-1 p-2" style={{ backgroundColor: c.bg, color: c.text, fontSize: '0.8rem', fontWeight: 600 }}>
        {c.icon} {c.label}
      </span>
    );
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
              <h2 className="mb-1">My Booking History</h2>
              <p className="text-muted-custom mb-0">Track your 24-hour reservation holds and approved accommodations</p>
            </div>
            
            <hr className="divider-orange mb-4" />

            {loading ? (
              <div className="page-loader">
                <div className="spinner-ring"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <h5 className="mb-2">No Bookings Yet</h5>
                <p className="text-muted-custom mx-auto mb-3" style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                  You haven't requested any holds. Head over to the hostel catalog and place a 24-hour hold to secure your booking.
                </p>
              </div>
            ) : (
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
                              📍 {b.properties?.neighborhood} · GHS {Number(b.properties?.price_per_semester).toLocaleString()} / semester
                            </small>
                          </td>
                          <td className="p-3" style={{ fontSize: '0.88rem' }}>
                            {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            <br />
                            <small className="text-muted-custom">
                              Expires: {new Date(b.expires_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </td>
                          <td className="p-3">{getStatusBadge(b.status)}</td>
                          <td className="p-3" style={{ fontSize: '0.82rem' }}>
                            {b.status === 'Approved' || b.status === 'Pending' ? (
                              <div className="d-flex flex-column gap-1" style={{ maxWidth: '240px' }}>
                                <div className="fw-semibold text-warning d-flex align-items-center gap-1">
                                  <Phone size={12} className="text-orange" />
                                  <span>{b.landlord_contact?.phone || '+233 24 412 3456'}</span>
                                </div>
                                {b.landlord_contact?.momo_number && (
                                  <div className="text-success small d-flex align-items-center gap-1">
                                    <span>📱 MoMo: <strong>{b.landlord_contact.momo_number}</strong> ({b.landlord_contact.momo_name || 'Account Name'})</span>
                                  </div>
                                )}
                                {b.landlord_contact?.email && (
                                  <div className="text-muted-custom small d-flex align-items-center gap-1">
                                    <Mail size={11} /> {b.landlord_contact.email}
                                  </div>
                                )}
                                {b.landlord_contact?.payment_instructions && (
                                  <div className="badge bg-secondary text-wrap text-start mt-1 p-1.5 fw-normal" style={{ fontSize: '0.72rem', border: '1px solid var(--border)' }}>
                                    💡 {b.landlord_contact.payment_instructions}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-custom" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                                Released upon approval
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {b.can_review ? (
                              <button className="btn btn-primary btn-sm py-1 px-3" onClick={() => handleOpenReviewModal(b)}>
                                Write Review
                              </button>
                            ) : b.reviewed ? (
                              <span className="badge bg-secondary p-2 text-muted-custom">Reviewed</span>
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

            {/* Bootstrap Modal style overlay */}
            {showModal && selectedBooking && (
              <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000 }}>
                <div className="card p-4 border-custom bg-surface rounded-custom" style={{ width: '100%', maxWidth: '480px', animation: 'slideDown 0.2s ease' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0" style={{ fontFamily: 'Outfit,sans-serif' }}>Submit Review</h5>
                    <button className="btn btn-close btn-close-white p-1" onClick={handleCloseReviewModal}></button>
                  </div>
                  <hr className="border-custom my-2" />
                  
                  <form onSubmit={handleSubmitReview}>
                    <p style={{ fontSize: '0.85rem' }} className="text-muted-custom mb-3">
                      Reviewing: <strong>{selectedBooking.properties?.title}</strong>
                    </p>

                    {/* Star Interactive */}
                    <div className="mb-3">
                      <label className="form-label d-block">Rating</label>
                      <div className="stars-interactive">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`star-btn ${star <= rating ? 'filled' : ''}`}
                            onClick={() => setRating(star)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Review Comment</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="Write your stay experience..."
                        required
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                      ></textarea>
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

          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
