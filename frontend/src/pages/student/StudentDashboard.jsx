// src/pages/student/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Calendar, Clock, Star, Bell, ArrowRight, ShieldCheck, PhoneCall } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import StudentSidebar from '../../components/StudentSidebar';
import api from '../../services/api';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    reviews: 0
  });
  const [activeHold, setActiveHold] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update countdown timer for active hold
  useEffect(() => {
    if (!activeHold?.expires_at) return;

    const updateTimer = () => {
      const diff = new Date(activeHold.expires_at) - new Date();
      if (diff <= 0) {
        setTimeLeft('Hold Expired');
        setActiveHold(null);
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeHold]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch student bookings
      const bookingsRes = await api.get('/bookings/student/mine');
      const bookings = bookingsRes.data?.bookings || [];

      // Fetch reviews
      const reviewsRes = await api.get('/reviews/mine');
      const reviews = reviewsRes.data?.reviews || [];

      // Fetch notifications
      const notifRes = await api.get('/notifications');
      const notifs = notifRes.data?.notifications || [];

      // Calculate stats
      const approved = bookings.filter(b => b.status === 'Approved').length;
      const pendingHold = bookings.find(b => b.status === 'Pending');
      
      setStats({
        total: bookings.length,
        approved,
        pending: pendingHold ? 1 : 0,
        reviews: reviews.length
      });

      if (pendingHold) {
        setActiveHold(pendingHold);
      }

      setNotifications(notifs.slice(0, 5));
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
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
        <StudentSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">Student Dashboard</h2>
                <p className="text-muted-custom mb-0">Welcome back to your KTU Hostel Portal workspace</p>
              </div>
              <span className="text-muted-custom" style={{ fontSize: '0.85rem' }}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            {/* Hold Banner Callout */}
            {activeHold ? (
              <div className="card p-4 mb-4 border-0 rounded-custom" style={{
                background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(245, 166, 35, 0.08) 100%)',
                border: '1px solid rgba(255, 107, 53, 0.25) !important'
              }}>
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-warning">Active Hold Request</span>
                      <span className="text-gold d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        <Clock size={14} /> Time remaining: {timeLeft}
                      </span>
                    </div>
                    <h4 className="mb-2">{activeHold.properties?.title}</h4>
                    <p className="text-muted-custom mb-3 mb-md-0" style={{ fontSize: '0.9rem' }}>
                      📍 {activeHold.properties?.address}, {activeHold.properties?.neighborhood} • 💰 GHS {activeHold.properties?.price_per_semester}/semester
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <Link to="/student/bookings" className="btn btn-primary">
                      Manage Hold Request <ArrowRight size={16} className="ms-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-4 mb-4 border-custom rounded-custom bg-surface text-center">
                <div className="mb-3 text-orange"><Home size={32} /></div>
                <h5>No Active Hold Reservation</h5>
                <p className="text-muted-custom mx-auto mb-3" style={{ maxWidth: '450px', fontSize: '0.9rem' }}>
                  You do not have any properties currently reserved. Explore available hostels around campus and secure a 24-hour hold.
                </p>
                <div>
                  <Link to="/search" className="btn btn-primary">
                    Find Hostels Now
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="stat-card orange">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="stat-number orange">{stats.total}</div>
                      <div className="stat-label">Total Booking Attempts</div>
                    </div>
                    <Calendar size={28} className="text-orange" opacity={0.6} />
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card green">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="stat-number green">{stats.approved}</div>
                      <div className="stat-label">Approved Reservations</div>
                    </div>
                    <ShieldCheck size={28} className="text-success" opacity={0.6} />
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card blue">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="stat-number blue">{stats.pending}</div>
                      <div className="stat-label">Active Hold Requests</div>
                    </div>
                    <Clock size={28} className="text-info" opacity={0.6} />
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card gold">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="stat-number gold">{stats.reviews}</div>
                      <div className="stat-label">Reviews Submitted</div>
                    </div>
                    <Star size={28} className="text-warning" opacity={0.6} />
                  </div>
                </div>
              </div>
            </div>

            {/* Main content split */}
            <div className="row g-4">
              {/* Left Column: Recent approved bookings or recommendations */}
              <div className="col-lg-7">
                <div className="card p-4 h-100 border-custom rounded-custom bg-surface">
                  <h5 className="mb-3">Getting Started Guide</h5>
                  <hr className="divider-orange my-2" />
                  <div className="d-flex gap-3 align-items-start mb-4">
                    <div style={{ background: 'rgba(255,107,53,0.1)', padding: '10px', borderRadius: '10px' }} className="text-orange">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h6>Secure Accommodations Offline</h6>
                      <p className="text-muted-custom mb-0" style={{ fontSize: '0.85rem' }}>
                        Ensure you review listings and place a 24-hour hold. Do not send mobile money to anyone before physically checking the premises or visiting the landlord.
                      </p>
                    </div>
                  </div>
                  <div className="d-flex gap-3 align-items-start mb-4">
                    <div style={{ background: 'rgba(245,166,35,0.1)', padding: '10px', borderRadius: '10px' }} className="text-gold">
                      <PhoneCall size={20} />
                    </div>
                    <div>
                      <h6>Contact Information Release</h6>
                      <p className="text-muted-custom mb-0" style={{ fontSize: '0.85rem' }}>
                        Once a landlord accepts your reservation hold, their phone number and email will be instantly released in your notifications and My Bookings area.
                      </p>
                    </div>
                  </div>
                  <div className="d-flex gap-3 align-items-start">
                    <div style={{ background: 'rgba(46,204,113,0.1)', padding: '10px', borderRadius: '10px' }} className="text-success">
                      <Star size={20} />
                    </div>
                    <div>
                      <h6>Help Peers by Reviewing</h6>
                      <p className="text-muted-custom mb-0" style={{ fontSize: '0.85rem' }}>
                        After securing your room, please write an honest rating to help others make informed accommodation choices next semester.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: In-App Notifications summary */}
              <div className="col-lg-5">
                <div className="card p-4 h-100 border-custom rounded-custom bg-surface">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Recent Alerts</h5>
                    <Bell size={18} className="text-muted-custom" />
                  </div>
                  <hr className="divider-orange my-2" />
                  <div className="d-flex flex-column gap-3">
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-muted-custom" style={{ fontSize: '0.875rem' }}>
                        No recent alerts.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.notification_id} className="p-3 bg-surface-2 border-custom rounded-custom" style={{ fontSize: '0.85rem' }}>
                          <div className="d-flex gap-2">
                            <span>
                              {n.type === 'BookingAccepted' ? '✅' : n.type === 'BookingDeclined' ? '❌' : '🔔'}
                            </span>
                            <div>
                              <p className="mb-1" style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>{n.message}</p>
                              <small className="text-muted-custom">
                                {new Date(n.created_at).toLocaleDateString('en-GB', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
