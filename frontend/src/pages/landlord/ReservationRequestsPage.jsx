// src/pages/landlord/ReservationRequestsPage.jsx
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LandlordSidebar from '../../components/LandlordSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ReservationRequestsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/landlord/mine');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Error fetching landlord bookings:', err);
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToHold = async (bookingId, action) => {
    try {
      const res = await api.patch(`/bookings/${bookingId}/respond`, { action });
      toast.success(res.data.message || `Hold request successfully ${action}ed!`);
      // Update list
      setBookings(prevBookings => prevBookings.map(b => 
        b.booking_id === bookingId 
          ? { ...b, status: action === 'accept' ? 'Approved' : 'Declined' } 
          : b
      ));
    } catch (err) {
      const errorMsg = err.response?.data?.error || `Failed to ${action} request.`;
      toast.error(errorMsg);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      Pending: { bg: 'rgba(245, 166, 35, 0.15)', text: 'var(--brand-gold)', label: 'Pending Response' },
      Approved: { bg: 'rgba(46, 204, 113, 0.15)', text: 'var(--success)', label: 'Approved & Released' },
      Declined: { bg: 'rgba(231, 76, 60, 0.15)', text: 'var(--danger)', label: 'Declined' },
      Expired: { bg: 'rgba(255, 255, 255, 0.08)', text: 'var(--text-muted)', label: 'Expired' }
    };
    const c = configs[status] || { bg: 'var(--surface-2)', text: 'var(--text-primary)', label: status };
    return (
      <span className="badge" style={{ backgroundColor: c.bg, color: c.text, fontSize: '0.75rem', fontWeight: 600 }}>
        {c.label}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <LandlordSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">
            
            {/* Page Header */}
            <div className="mb-4">
              <h2 className="mb-1">Reservation Hold Requests</h2>
              <p className="text-muted-custom mb-0">Respond to student reservation holds within their 24-hour expiration window</p>
            </div>
            
            <hr className="divider-orange mb-4" />

            {loading ? (
              <div className="page-loader">
                <div className="spinner-ring"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <h5 className="mb-2">No Requests Received</h5>
                <p className="text-muted-custom mx-auto" style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                  You haven't received any reservation hold requests on your listings yet. Make sure your rooms are set to 'Available' and have admin approval.
                </p>
              </div>
            ) : (
              <div className="card border-custom bg-surface rounded-custom overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover mb-0" style={{ color: 'var(--text-primary)', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Student Details</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Property</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Expiry Window</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem' }}>Status</th>
                        <th className="p-3 text-muted-custom" style={{ fontSize: '0.85rem', width: '200px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody style={{ verticalAlign: 'middle' }}>
                      {bookings.map(b => (
                        <tr key={b.booking_id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="p-3">
                            <h6 className="mb-1" style={{ fontSize: '0.92rem', fontWeight: 600 }}>{b.users?.full_name}</h6>
                            <div className="d-flex flex-column gap-1 text-muted-custom" style={{ fontSize: '0.78rem' }}>
                              <span className="d-flex align-items-center gap-1"><Phone size={11} className="text-orange" /> {b.users?.phone}</span>
                              <span className="d-flex align-items-center gap-1"><Mail size={11} /> {b.users?.email}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.properties?.title}</span>
                            {b.selected_room_type && (
                              <div>
                                <span className="badge bg-secondary border-custom text-warning mt-1" style={{ fontSize: '0.74rem' }}>
                                  Option: {b.selected_room_type} ({b.agreed_price ? `GHS ${b.agreed_price}` : ''})
                                </span>
                              </div>
                            )}
                            <small className="text-muted-custom d-block mt-0.5">📍 {b.properties?.neighborhood}</small>
                          </td>
                          <td className="p-3" style={{ fontSize: '0.82rem' }}>
                            <div className="d-flex align-items-center gap-1 mb-1">
                              <Clock size={12} className="text-orange" />
                              <span>{new Date(b.expires_at).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                            </div>
                            <small className="text-muted-custom">
                              Placed: {new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </small>
                          </td>
                          <td className="p-3">{getStatusBadge(b.status)}</td>
                          <td className="p-3">
                            {b.status === 'Pending' ? (
                              <div className="d-flex gap-2">
                                <button className="btn btn-success btn-sm py-1 px-3" onClick={() => handleRespondToHold(b.booking_id, 'accept')}>
                                  Accept
                                </button>
                                <button className="btn btn-danger btn-sm py-1 px-3" onClick={() => handleRespondToHold(b.booking_id, 'decline')}>
                                  Decline
                                </button>
                              </div>
                            ) : b.status === 'Approved' ? (
                              <span className="text-success d-flex align-items-center gap-1" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                <ShieldCheck size={14} /> Contact Released
                              </span>
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

          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
