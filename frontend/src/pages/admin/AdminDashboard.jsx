// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, List, Inbox, MessageSquare, AlertTriangle, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [pendingLandlords, setPendingLandlords] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch analytics
      const analyticRes = await api.get('/admin/analytics');
      setAnalytics(analyticRes.data?.analytics || null);

      // Fetch landlord verification queue
      const landlordRes = await api.get('/admin/landlords');
      setPendingLandlords(landlordRes.data?.landlords?.filter(l => l.verification_status === 'Pending') || []);

      // Fetch pending listings queue
      const listingRes = await api.get('/admin/listings');
      setPendingListings(listingRes.data?.listings?.filter(l => l.verification_status === 'Pending') || []);

      // Fetch flagged reviews (or all reviews, filtering by flagged)
      const reviewRes = await api.get('/admin/reviews');
      setFlaggedReviews(reviewRes.data?.reviews?.filter(r => r.is_flagged) || []);

    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLandlord = async (userId, action) => {
    try {
      await api.patch(`/admin/landlords/${userId}/verify`, { action });
      toast.success(`Landlord ${action === 'approve' ? 'Approved' : 'Rejected'}`);
      fetchDashboardData();
    } catch {
      toast.error('Verification update failed.');
    }
  };

  const handleModerateListing = async (propertyId, action) => {
    try {
      await api.patch(`/admin/listings/${propertyId}/moderate`, { action });
      toast.success(`Listing ${action === 'approve' ? 'Approved' : 'Rejected'}`);
      fetchDashboardData();
    } catch {
      toast.error('Moderation update failed.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-loader">
          <div className="spinner-ring"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <AdminSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">Admin Command Center</h2>
                <p className="text-muted-custom mb-0">Platform overview, moderation queues, and user activity dashboard</p>
              </div>
            </div>

            {/* Stats Summary Grid */}
            {analytics && (
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="stat-card orange">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="stat-number orange">{analytics.users?.total}</div>
                        <div className="stat-label">Total Users ({analytics.users?.landlords} landlords)</div>
                      </div>
                      <Users size={28} className="text-orange" opacity={0.6} />
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card green">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="stat-number green">{analytics.properties?.approved}</div>
                        <div className="stat-label">Approved Listings ({analytics.properties?.pending} pending)</div>
                      </div>
                      <List size={28} className="text-success" opacity={0.6} />
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card blue">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="stat-number blue">{analytics.bookings?.total}</div>
                        <div className="stat-label">Total Reservation holds ({analytics.bookings?.pending} active)</div>
                      </div>
                      <Inbox size={28} className="text-info" opacity={0.6} />
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card gold">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="stat-number gold">{analytics.reviews?.avg_rating || '—'}</div>
                        <div className="stat-label">Avg Rating ({analytics.reviews?.total} reviews, {analytics.reviews?.flagged} flagged)</div>
                      </div>
                      <MessageSquare size={28} className="text-warning" opacity={0.6} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Moderation Queues split grid */}
            <div className="row g-4">
              
              {/* Landlord Queue */}
              <div className="col-lg-6">
                <div className="card p-4 border-custom bg-surface rounded-custom h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 d-flex align-items-center gap-2">
                      <UserCheck size={18} className="text-orange" /> Landlord Verification Queue
                    </h5>
                    <Link to="/admin/verify" className="text-orange text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      View All <ArrowRight size={14} className="ms-1" />
                    </Link>
                  </div>
                  <hr className="divider-orange my-2" />
                  
                  {pendingLandlords.length === 0 ? (
                    <div className="text-center py-5 text-muted-custom" style={{ fontSize: '0.9rem' }}>
                      No landlords currently pending verification.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 mt-2">
                      {pendingLandlords.slice(0, 3).map(l => (
                        <div key={l.user_id} className="p-3 bg-surface-2 border-custom rounded-custom d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div>
                            <h6 className="mb-1" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{l.full_name}</h6>
                            <small className="text-muted-custom">{l.email} · {l.phone}</small>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-success btn-sm py-1 px-3" onClick={() => handleVerifyLandlord(l.user_id, 'approve')}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm py-1 px-3" onClick={() => handleVerifyLandlord(l.user_id, 'reject')}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Property Queue */}
              <div className="col-lg-6">
                <div className="card p-4 border-custom bg-surface rounded-custom h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 d-flex align-items-center gap-2">
                      <List size={18} className="text-orange" /> Property Approval Queue
                    </h5>
                    <Link to="/admin/listings" className="text-orange text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      View All <ArrowRight size={14} className="ms-1" />
                    </Link>
                  </div>
                  <hr className="divider-orange my-2" />
                  
                  {pendingListings.length === 0 ? (
                    <div className="text-center py-5 text-muted-custom" style={{ fontSize: '0.9rem' }}>
                      No listings currently pending approval.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 mt-2">
                      {pendingListings.slice(0, 3).map(p => (
                        <div key={p.property_id} className="p-3 bg-surface-2 border-custom rounded-custom d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <div>
                            <h6 className="mb-1" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.title}</h6>
                            <small className="text-muted-custom">📍 {p.neighborhood} · GHS {p.price_per_semester}</small>
                          </div>
                          <div className="d-flex gap-2">
                            <button className="btn btn-success btn-sm py-1 px-3" onClick={() => handleModerateListing(p.property_id, 'approve')}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm py-1 px-3" onClick={() => handleModerateListing(p.property_id, 'reject')}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Flagged Reviews Queue */}
              <div className="col-12 col-lg-6 mt-4">
                <div className="card p-4 border-custom bg-surface rounded-custom">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0 d-flex align-items-center gap-2">
                      <AlertTriangle size={18} className="text-danger" /> Flagged Reviews
                    </h5>
                    <Link to="/admin/reviews" className="text-orange text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Moderate <ArrowRight size={14} className="ms-1" />
                    </Link>
                  </div>
                  <hr className="divider-orange my-2" />
                  
                  {flaggedReviews.length === 0 ? (
                    <div className="text-center py-4 text-muted-custom" style={{ fontSize: '0.9rem' }}>
                      No reviews currently flagged.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2 mt-2">
                      {flaggedReviews.slice(0, 2).map(r => (
                        <div key={r.review_id} className="p-3 bg-surface-2 border-custom rounded-custom" style={{ fontSize: '0.85rem' }}>
                          <div className="d-flex justify-content-between mb-1">
                            <strong>{r.users?.full_name} ({r.properties?.title})</strong>
                            <span className="text-gold">★ {r.rating}</span>
                          </div>
                          <p className="text-muted-custom mb-0 font-italic">"{r.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
