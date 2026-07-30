// src/pages/student/StudentDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Calendar, Clock, Star, Bell, ArrowRight, ShieldCheck, PhoneCall, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import PortalFooter from '../../components/PortalFooter';
import StudentSidebar from '../../components/StudentSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

import hero1 from '../../assets/hero-hostel-1.PNG';
import hero2 from '../../assets/hero-hostel-2.PNG';
import hero3 from '../../assets/hero-hostel-3.PNG';

const featuredHostels = [
  {
    id: 1,
    name: "Comfortable & Secure Living",
    tagline: "Find your perfect student accommodation near KTU campus",
    cta: "Browse Hostels",
    accent: "var(--brand-orange)",
    image: hero1
  },
  {
    id: 2,
    name: "Modern Amenities Near Campus",
    tagline: "Well-furnished rooms with WiFi, water & electricity — move-in ready",
    cta: "Explore Rooms",
    accent: "var(--brand-gold)",
    image: hero2
  },
  {
    id: 3,
    name: "Prime Location · 24/7 Security",
    tagline: "Stay safe and close to campus in verified, secure hostels",
    cta: "Find Your Room",
    accent: "#4ade80",
    image: hero3
  }
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, reviews: 0 });
  const [activeHold, setActiveHold] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [timeLeft, setTimeLeft] = useState('');

  // ── Carousel state ─────────────────────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef(null);

  const goToSlide = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % featuredHostels.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + featuredHostels.length) % featuredHostels.length);

  // Auto-slide every 2 seconds — reset timer on manual nav
  useEffect(() => {
    intervalRef.current = setInterval(nextSlide, 2000);
    return () => clearInterval(intervalRef.current);
  }, [currentSlide]);

  const handleCarouselMouseEnter = () => clearInterval(intervalRef.current);
  const handleCarouselMouseLeave = () => {
    intervalRef.current = setInterval(nextSlide, 2000);
  };

  // ── Dashboard data ─────────────────────────────────────────────────────────
  useEffect(() => { fetchDashboardData(); }, []);

  // Countdown timer for active hold
  useEffect(() => {
    if (!activeHold?.expires_at) return;
    const updateTimer = () => {
      const diff = new Date(activeHold.expires_at) - new Date();
      if (diff <= 0) { setTimeLeft('Hold Expired'); setActiveHold(null); return; }
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
      const bookingsRes = await api.get('/bookings/student/mine');
      const bookings = bookingsRes.data?.bookings || [];
      const reviewsRes = await api.get('/reviews/mine');
      const reviews = reviewsRes.data?.reviews || [];
      const notifRes = await api.get('/notifications');
      const notifs = notifRes.data?.notifications || [];

      const approved = bookings.filter(b => b.status === 'Approved').length;
      const pendingHold = bookings.find(b => b.status === 'Pending');

      setStats({ total: bookings.length, approved, pending: pendingHold ? 1 : 0, reviews: reviews.length });
      if (pendingHold) setActiveHold(pendingHold);
      else setActiveHold(null);
      setNotifications(notifs.slice(0, 5));
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const [cancellingHold, setCancellingHold] = useState(false);

  const handleCancelActiveHold = async (bookingId, propertyTitle) => {
    if (!window.confirm(`Are you sure you want to cancel your reservation hold on "${propertyTitle || 'this property'}"?`)) {
      return;
    }
    try {
      setCancellingHold(true);
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      toast.success(res.data.message || 'Reservation hold cancelled.');
      setActiveHold(null);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel hold.');
    } finally {
      setCancellingHold(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <StudentSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">


            {/* Page header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">Student Dashboard</h2>
                <p className="text-muted-custom mb-0">Welcome back to your KTU Hostel Portal workspace</p>
              </div>
              <span className="text-muted-custom" style={{ fontSize: '0.85rem' }}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            {/* ── Hero Carousel ──────────────────────────────────────────────── */}
            <div
              className="position-relative mb-4 rounded-custom overflow-hidden"
              style={{ height: '250px', cursor: 'pointer' }}
              onMouseEnter={handleCarouselMouseEnter}
              onMouseLeave={handleCarouselMouseLeave}
            >
              {featuredHostels.map((slide, idx) => (
                <div
                  key={slide.id}
                  style={{
                    position: 'absolute', inset: 0,
                    opacity: idx === currentSlide ? 1 : 0,
                    transition: 'opacity 0.6s ease',
                    zIndex: idx === currentSlide ? 1 : 0,
                  }}
                >
                  {/* Background image */}
                  <img
                    src={slide.image}
                    alt={slide.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                  />
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)',
                  }} />
                  {/* Text content */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '1.5rem 2rem',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  }}>
                    <span style={{
                      display: 'inline-block', marginBottom: '0.5rem',
                      background: slide.accent, color: '#fff',
                      padding: '0.2rem 0.75rem', borderRadius: '20px',
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
                      width: 'fit-content', textTransform: 'uppercase',
                    }}>
                      Featured
                    </span>
                    <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '0.4rem', fontSize: 'clamp(1.1rem, 3vw, 1.6rem)', lineHeight: 1.2 }}>
                      {slide.name}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem', marginBottom: '1rem', maxWidth: '480px' }}>
                      {slide.tagline}
                    </p>
                    <Link to="/search" className="btn btn-sm" style={{
                      background: slide.accent, color: '#fff', fontWeight: 600,
                      borderRadius: '8px', padding: '0.45rem 1.25rem', width: 'fit-content',
                      border: 'none', fontSize: '0.85rem',
                    }}>
                      {slide.cta} <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Prev / Next arrows */}
              <button
                onClick={prevSlide}
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 10, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextSlide}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 10, background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dot indicators */}
              <div style={{
                position: 'absolute', bottom: '14px', right: '18px',
                zIndex: 10, display: 'flex', gap: '6px',
              }}>
                {featuredHostels.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    style={{
                      width: idx === currentSlide ? 20 : 8, height: 8,
                      borderRadius: '4px', border: 'none', cursor: 'pointer',
                      background: idx === currentSlide ? '#fff' : 'rgba(255,255,255,0.45)',
                      transition: 'all 0.3s ease', padding: 0,
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Hold Banner / No-hold placeholder */}
            {activeHold ? (
              <div className="card p-4 mb-4 border-0 rounded-custom" style={{
                background: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(245,166,35,0.08) 100%)',
                border: '1px solid rgba(255,107,53,0.25) !important'
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
                    <p className="text-muted-custom mb-2" style={{ fontSize: '0.9rem' }}>
                      📍 {activeHold.properties?.address}, {activeHold.properties?.neighborhood} •{' '}
                      💰 {activeHold.selected_room_type ? `${activeHold.selected_room_type} Room (` : ''}
                      GHS {activeHold.agreed_price || activeHold.properties?.price_per_semester}
                      {activeHold.selected_room_type ? ')' : ''}/{((activeHold.properties?.payment_frequency) || 'Semester').toLowerCase()}
                    </p>
                    {activeHold.landlord_contact && (
                      <div className="d-flex flex-wrap align-items-center gap-3 mt-2 pt-2 border-top border-custom" style={{ fontSize: '0.82rem' }}>
                        <span className="text-warning fw-semibold">📞 Landlord: {activeHold.landlord_contact.phone}</span>
                        {activeHold.landlord_contact.momo_number && (
                          <span className="text-success fw-semibold">
                            📱 MoMo: {activeHold.landlord_contact.momo_number} ({activeHold.landlord_contact.momo_name || 'Account Name'})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-md-4 text-md-end d-flex flex-column align-items-md-end gap-2 justify-content-center mt-3 mt-md-0">
                    <Link to="/student/bookings" className="btn btn-primary">
                      Manage Hold Request <ArrowRight size={16} className="ms-1" />
                    </Link>
                    {activeHold.status === 'Pending' && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleCancelActiveHold(activeHold.booking_id, activeHold.properties?.title)}
                        disabled={cancellingHold}
                      >
                        {cancellingHold ? 'Cancelling...' : 'Cancel Active Hold'}
                      </button>
                    )}
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
                  <Link to="/search" className="btn btn-primary">Find Hostels Now</Link>
                </div>
              </div>
            )}

            {/* Quick Stats */}
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

            {/* Main split: Guide + Notifications */}
            <div className="row g-4">
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
          <PortalFooter />
        </main>
      </div>
    </>
  );
}
