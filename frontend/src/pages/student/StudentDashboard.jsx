// src/pages/student/StudentDashboard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Calendar, Clock, Star, Bell, ArrowRight, ShieldCheck, PhoneCall, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import StudentSidebar from '../../components/StudentSidebar';
import api from '../../services/api';

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

  // Auto-slide every 5 seconds — reset timer on manual nav
  useEffect(() => {
    intervalRef.current = setInterval(nextSlide, 5000);
    return () => clearInterval(intervalRef.current);
  }, [currentSlide]);

  const handleCarouselMouseEnter = () => clearInterval(intervalRef.current);
  const handleCarouselMouseLeave = () => {
    intervalRef.current = setInterval(nextSlide, 5000);
  };

  // ── Dashboard data ─────────────────────────────────────────────────────────
  useEffect(() => { fetchDashboardData(); }, []);

  // Countdown timer for active hold
  useEffect(() => {
    if (!activeHold?.expires_at) return;
    const updateTimer = () => {
      const diff = new Date(activeHold.expires_at) - new Date();
      if (diff <= 0) { setTimeLeft('Hold Expired'); setActiveHold(null); return; }
      const hrs  = Math.floor(diff / (1000 * 60 * 60));
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
      const bookings   = bookingsRes.data?.bookings || [];
      const reviewsRes = await api.get('/reviews/mine');
      const reviews    = reviewsRes.data?.reviews || [];
      const notifRes   = await api.get('/notifications');
      const notifs     = notifRes.data?.notifications || [];

      const approved    = bookings.filter(b => b.status === 'Approved').length;
      const pendingHold = bookings.find(b => b.status === 'Pending');

      setStats({ total: bookings.length, approved, pending: pendingHold ? 1 : 0, reviews: reviews.length });
      if (pendingHold) setActiveHold(pendingHold);
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
        <div className="page-loader"><div className="spinner-ring" /></div>
      </>
    );
  }

  const slide = featuredHostels[currentSlide];

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <StudentSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">

            {/* ═══════════════════════════════════════════════════════
                HERO CAROUSEL
            ═══════════════════════════════════════════════════════ */}
            <div
              className="position-relative overflow-hidden mb-4"
              style={{ borderRadius: '16px', height: '300px', cursor: 'grab', userSelect: 'none' }}
              onMouseEnter={handleCarouselMouseEnter}
              onMouseLeave={handleCarouselMouseLeave}
            >
              {/* Background slides — cross-fade with subtle zoom */}
              {featuredHostels.map((h, i) => (
                <div
                  key={h.id}
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${h.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: i === currentSlide ? 1 : 0,
                    transform: i === currentSlide ? 'scale(1)' : 'scale(1.05)',
                    transition: 'opacity 0.75s cubic-bezier(0.4,0,0.2,1), transform 0.75s cubic-bezier(0.4,0,0.2,1)',
                    zIndex: i === currentSlide ? 1 : 0
                  }}
                />
              ))}

              {/* Directional dark gradient overlay — text on left */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 2,
                background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.12) 100%)'
              }} />

              {/* ── Slide text content ── */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 3,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', padding: '0 44px'
              }}>
                {/* Brand pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: `${slide.accent}1a`,
                  border: `1px solid ${slide.accent}44`,
                  borderRadius: '100px', padding: '4px 12px',
                  width: 'fit-content', marginBottom: '12px'
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: slide.accent, display: 'inline-block',
                    boxShadow: `0 0 6px ${slide.accent}`
                  }} />
                  <span style={{
                    fontSize: '0.7rem', color: slide.accent,
                    fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase'
                  }}>
                    KTU Hostel Portal
                  </span>
                </div>

                {/* Headline */}
                <h2 style={{
                  color: '#ffffff',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(1.15rem, 2.8vw, 1.75rem)',
                  lineHeight: 1.2,
                  marginBottom: '8px',
                  maxWidth: '500px',
                  textShadow: '0 2px 14px rgba(0,0,0,0.55)'
                }}>
                  {slide.name}
                </h2>

                {/* Tagline */}
                <p style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.87rem',
                  maxWidth: '400px',
                  marginBottom: '22px',
                  lineHeight: 1.55,
                  textShadow: '0 1px 8px rgba(0,0,0,0.4)'
                }}>
                  {slide.tagline}
                </p>

                {/* CTA button */}
                <Link
                  to="/search"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    background: slide.accent,
                    color: slide.accent === '#4ade80' ? '#0a1a0a' : '#0a0a0a',
                    padding: '9px 22px', borderRadius: '8px',
                    fontWeight: 700, fontSize: '0.84rem',
                    textDecoration: 'none', width: 'fit-content',
                    boxShadow: `0 4px 18px ${slide.accent}50`,
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 28px ${slide.accent}70`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 18px ${slide.accent}50`;
                  }}
                >
                  <Search size={14} /> {slide.cta}
                </Link>
              </div>

              {/* ── Prev arrow ── */}
              <button
                onClick={prevSlide}
                aria-label="Previous slide"
                style={{
                  position: 'absolute', left: 12, top: '50%',
                  transform: 'translateY(-50%)', zIndex: 4,
                  background: 'rgba(0,0,0,0.42)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#fff', borderRadius: '50%',
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s, transform 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.72)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.42)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <ChevronLeft size={18} />
              </button>

              {/* ── Next arrow ── */}
              <button
                onClick={nextSlide}
                aria-label="Next slide"
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', zIndex: 4,
                  background: 'rgba(0,0,0,0.42)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: '#fff', borderRadius: '50%',
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s, transform 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.72)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.42)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <ChevronRight size={18} />
              </button>

              {/* ── Pagination dots ── */}
              <div style={{
                position: 'absolute', bottom: 14, left: '50%',
                transform: 'translateX(-50%)', zIndex: 4,
                display: 'flex', gap: '7px', alignItems: 'center'
              }}>
                {featuredHostels.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    style={{
                      width: i === currentSlide ? 24 : 8,
                      height: 8,
                      borderRadius: '100px',
                      background: i === currentSlide ? slide.accent : 'rgba(255,255,255,0.38)',
                      border: 'none', padding: 0, cursor: 'pointer',
                      transition: 'all 0.38s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: i === currentSlide ? `0 0 8px ${slide.accent}99` : 'none'
                    }}
                  />
                ))}
              </div>

              {/* ── Slide counter badge (top-right) ── */}
              <div style={{
                position: 'absolute', top: 13, right: 13, zIndex: 4,
                background: 'rgba(0,0,0,0.52)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.88)',
                borderRadius: '100px',
                padding: '3px 11px',
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em'
              }}>
                {currentSlide + 1} / {featuredHostels.length}
              </div>
            </div>
            {/* ═══════════════════════════════════════════════════════ */}

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
                      {activeHold.selected_room_type ? ')' : ''}/semester
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
        </main>
      </div>
      <Footer />
    </>
  );
}
