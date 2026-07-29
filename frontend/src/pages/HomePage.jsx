import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Shield, Star, Clock, ArrowRight, Map, Home, SlidersHorizontal, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import api from '../services/api';

const FEATURES = [
  { icon: <Shield size={28} />, color: '#2ECC71', title: 'Verified Landlords', desc: 'Every landlord is identity-verified by our admin team before their listings appear.' },
  { icon: <MapPin size={28} />, color: '#3498DB', title: 'Map-Based Search', desc: 'See all listings on Google Maps with real driving distance from KTU campus.' },
  { icon: <Clock size={28} />, color: '#FF6B35', title: '24-Hour Hold System', desc: 'Place a reservation hold. No online payment — all done securely offline.' },
  { icon: <Star size={28} />, color: '#F5A623', title: 'Verified Reviews', desc: 'Only students who actually stayed can review — no fake ratings.' },
];

const NEIGHBORHOODS = ['Adweso', 'Nsukwao', 'Effiduase', 'Oyoko', 'Ashanti Nkwanta', 'Akwadum', 'Okorase'];

const STATS = [
  { value: '200+', label: 'Listed Properties' },
  { value: '500+', label: 'Students Served' },
  { value: '50+', label: 'Verified Landlords' },
  { value: '4.8★', label: 'Average Rating' },
];

const hostelBg = '/hostel-bg.jpg';

export default function HomePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ neighborhood: '', room_type: '', max_price: '' });
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const listingsSectionRef = useRef(null);

  const LISTING_TABS = [
    { key: 'all',            label: 'All' },
    { key: 'Single',         label: 'Single' },
    { key: 'Shared',         label: 'Shared' },
    { key: 'Self-contained', label: 'Self-contained' },
    { key: 'Apartment',      label: 'Apartment' },
  ];

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setListingsLoading(true);
        const params = { limit: 6, page: 1 };
        if (activeTab !== 'all') params.room_type = activeTab;
        const res = await api.get('/properties/search', { params });
        setListings(res.data.properties || []);
      } catch (err) {
        console.error('Failed to load featured listings', err);
      } finally {
        setListingsLoading(false);
      }
    };
    fetchFeatured();
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filters.neighborhood) params.set('neighborhood', filters.neighborhood);
    if (filters.room_type)    params.set('room_type', filters.room_type);
    if (filters.max_price)    params.set('max_price', filters.max_price);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background image */}
        <div style={{
          backgroundImage: `url(${hostelBg})`,
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundSize: 'cover', backgroundPosition: 'center top',
          zIndex: 0,
        }} />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, rgba(10,14,26,0.88) 0%, rgba(20,20,50,0.75) 50%, rgba(255,107,53,0.20) 100%)',
          zIndex: 1
        }} />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '100px', background: 'linear-gradient(to bottom, transparent, var(--dark-navy, #0a0e1a))',
          zIndex: 2
        }} />

        <div className="container position-relative" style={{ zIndex: 3, padding: '2rem 1rem' }}>
          {/* Mobile: stack vertically; Desktop: side by side */}
          <div className="row align-items-center gy-4">
            {/* Left: Headline */}
            <div className="col-12 col-lg-7">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span style={{
                  background: 'rgba(255,107,53,0.25)', color: '#FFB26B',
                  borderRadius: '20px', padding: '4px 14px',
                  fontSize: '0.78rem', fontWeight: 600,
                  border: '1px solid rgba(255,107,53,0.4)',
                }}>
                  🎓 KTU Official Student Housing Platform
                </span>
              </div>

              <h1 className="hero-title" style={{ color: '#ffffff', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                Find Your Perfect
                <br />
                <span style={{ color: 'var(--brand-orange)', textShadow: '0 0 30px rgba(255,107,53,0.5)' }}>Student Home</span>
                <br />
                Near KTU Campus
              </h1>

              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(0.88rem, 2.5vw, 1rem)', marginBottom: '1.5rem', maxWidth: 500 }}>
                Safe, verified, and affordable off-campus accommodation for Koforidua Technical University students.
              </p>

              {/* CTA Buttons — stack on mobile */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: '1 1 160px', minWidth: 0, fontWeight: 700 }}
                  onClick={() => {
                    if (listingsSectionRef.current) {
                      listingsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                    } else navigate('/search');
                  }}
                >
                  <Search size={15} className="me-2" />All Available Hostels
                </button>
                <button
                  className="btn"
                  style={{
                    flex: '1 1 140px', minWidth: 0, fontWeight: 700,
                    border: '2px solid rgba(255,255,255,0.7)',
                    color: '#fff', background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)', borderRadius: '8px',
                  }}
                  onClick={() => navigate('/map')}
                >
                  <Map size={15} className="me-2" />View on Map
                </button>
              </div>
            </div>

            {/* Right: Quick Search Card */}
            <div className="col-12 col-lg-5">
              <div className="search-hero-bar" style={{ margin: 0 }}>
                <h5 className="mb-3" style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700 }}>
                  🔍 Quick Search
                </h5>
                <form onSubmit={handleSearch}>
                  <div className="mb-3">
                    <label className="form-label">Neighborhood</label>
                    <select className="form-select" value={filters.neighborhood}
                      onChange={e => setFilters(f => ({ ...f, neighborhood: e.target.value }))}>
                      <option value="">All Areas</option>
                      {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">Room Type</label>
                      <select className="form-select" value={filters.room_type}
                        onChange={e => setFilters(f => ({ ...f, room_type: e.target.value }))}>
                        <option value="">Any Type</option>
                        <option>Single</option><option>Shared</option>
                        <option>Self-contained</option><option>Apartment</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Max Price (GHS)</label>
                      <input type="number" className="form-control" placeholder="e.g. 1500"
                        value={filters.max_price}
                        onChange={e => setFilters(f => ({ ...f, max_price: e.target.value }))} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-100 py-2">
                    <Search size={16} className="me-2" />Search Properties
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── Browse Listings ────────────────────────────────────────────────── */}
      <section id="browse-listings" ref={listingsSectionRef} className="py-4 py-md-5" style={{ background: 'var(--dark-navy-2)' }}>
        <div className="container">
          {/* Header row */}
          <div className="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
            <div>
              <h2 className="section-title mb-1" style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)' }}>
                <Home size={24} className="me-2 text-orange" style={{ verticalAlign: 'middle' }} />
                Browse <span className="text-orange">Listings</span>
              </h2>
              <div className="section-divider" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
                Explore verified, available hostels near KTU campus.
              </p>
            </div>
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              onClick={() => navigate('/search')}
              style={{ fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              View All <ChevronRight size={15} />
            </button>
          </div>

          {/* Filter Tabs — horizontally scrollable on mobile */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem', WebkitOverflowScrolling: 'touch' }}>
            {LISTING_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="btn btn-sm"
                style={{
                  borderRadius: '20px', fontWeight: 600, fontSize: '0.82rem',
                  transition: 'all 0.2s', flexShrink: 0,
                  background: activeTab === tab.key ? 'var(--brand-orange)' : 'var(--surface)',
                  color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${activeTab === tab.key ? 'var(--brand-orange)' : 'var(--border)'}`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Listings Grid */}
          {listingsLoading ? (
            <div className="row g-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="col-6 col-md-6 col-lg-4">
                  <div className="card h-100" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ height: '160px', background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                    <div className="p-3">
                      <div style={{ height: '14px', borderRadius: '6px', background: 'var(--surface-2)', marginBottom: '8px', width: '70%' }} />
                      <div style={{ height: '11px', borderRadius: '6px', background: 'var(--surface-2)', width: '45%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏚️</div>
              <h5>No listings found for this category</h5>
              <p style={{ fontSize: '0.9rem' }}>Try a different room type or <button className="btn btn-link p-0" style={{ color: 'var(--brand-orange)' }} onClick={() => setActiveTab('all')}>view all</button>.</p>
            </div>
          ) : (
            <div className="row g-3">
              {listings.map(p => (
                <div key={p.property_id} className="col-6 col-md-6 col-lg-4">
                  <PropertyCard property={p} />
                </div>
              ))}
            </div>
          )}

          {!listingsLoading && listings.length > 0 && (
            <div className="text-center mt-4">
              <button
                className="btn btn-primary px-4 px-md-5 py-2"
                onClick={() => navigate('/search' + (activeTab !== 'all' ? `?room_type=${activeTab}` : ''))}
                style={{ borderRadius: '10px', fontWeight: 700 }}
              >
                <Search size={16} className="me-2" />See All Available Hostels
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-4 py-md-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title" style={{ fontSize: 'clamp(1.3rem, 4vw, 1.9rem)' }}>
              Why Choose <span className="text-orange">KTU Hostel Portal</span>?
            </h2>
            <div className="section-divider mx-auto" />
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0.75rem auto 0', fontSize: '0.9rem' }}>
              Built specifically to solve the housing problems faced by KTU students.
            </p>
          </div>
          <div className="row g-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="col-6 col-md-6 col-lg-3">
                <div className="card h-100 p-3 p-md-4" style={{ border: '1px solid var(--border)' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '12px',
                    background: `${f.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.color, marginBottom: '0.75rem'
                  }}>
                    {f.icon}
                  </div>
                  <h5 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', marginBottom: '0.4rem' }}>{f.title}</h5>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.78rem, 2vw, 0.87rem)', marginBottom: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--dark-navy-2)', overflow: 'hidden' }}>
        <div className="container py-4 py-md-5">
          {/* Staggered grid — cards offset vertically so they don't line up flat */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}
               className="d-md-none">
            {/* Mobile: 2-col with alternating vertical offset */}
            {STATS.map((s, i) => (
              <div key={i} style={{ marginTop: i % 2 === 0 ? 0 : '1.5rem' }}>
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderTop: `3px solid ${['var(--brand-orange)', '#3498DB', '#2ECC71', '#F5A623'][i]}`,
                  borderRadius: 16,
                  padding: '1rem 0.75rem',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit,sans-serif', color: ['var(--brand-orange)', '#3498DB', '#2ECC71', '#F5A623'][i], lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: 4-col with wave-like vertical stagger */}
          <div className="d-none d-md-flex" style={{ gap: '1rem', alignItems: 'flex-start' }}>
            {STATS.map((s, i) => {
              const offsets   = [0, 24, 12, 36]; // px vertical offset per card
              const rotations = [-1.2, 1.0, -0.8, 1.5]; // slight rotation
              const colors    = ['var(--brand-orange)', '#3498DB', '#2ECC71', '#F5A623'];
              return (
                <div key={i} style={{ flex: 1, marginTop: offsets[i] }}>
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderTop: `4px solid ${colors[i]}`,
                    borderRadius: 18,
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    transform: `rotate(${rotations[i]}deg)`,
                    boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(0deg) translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${rotations[i]}deg)`; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.08)'; }}
                  >
                    <div style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, fontFamily: 'Outfit,sans-serif', color: colors[i], lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem', fontWeight: 500 }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-4 py-md-5" style={{ background: 'var(--dark-navy-2)' }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="section-title" style={{ fontSize: 'clamp(1.3rem, 4vw, 1.9rem)' }}>How It Works</h2>
            <div className="section-divider mx-auto" />
          </div>
          <div className="row g-3">
            {[
              { step: '01', title: 'Search Listings', desc: 'Filter by price, room type, neighborhood, and distance from KTU campus.' },
              { step: '02', title: 'Place a 24-Hour Hold', desc: 'Reserve your preferred property. No payment needed upfront.' },
              { step: '03', title: 'Get Landlord Contact', desc: 'Once accepted, you\'ll receive the landlord\'s phone number to arrange payment.' },
              { step: '04', title: 'Leave a Review', desc: 'After your stay, share your honest experience to help future students.' },
            ].map((s, i) => (
              <div key={i} className="col-6 col-md-6 col-lg-3 text-center">
                <div style={{
                  width: 56, height: 56,
                  background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-gold))',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Outfit,sans-serif',
                  margin: '0 auto 0.75rem', color: '#fff'
                }}>{s.step}</div>
                <h5 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>{s.title}</h5>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.78rem, 2vw, 0.87rem)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-4 py-md-5">
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-orange) 0%, #c0392b 100%)',
            borderRadius: 'var(--radius-xl)', padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem)',
            textAlign: 'center', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: -30, right: -30, width: 150, height: 150,
              background: 'rgba(255,255,255,0.05)', borderRadius: '50%'
            }} />
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, color: '#fff', fontSize: 'clamp(1.3rem, 4vw, 2rem)', marginBottom: '0.75rem' }}>
              Ready to Find Your Home?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(0.88rem, 2.5vw, 1rem)', marginBottom: '1.25rem', maxWidth: 480, margin: '0 auto 1.25rem' }}>
              Join hundreds of KTU students who found safe, affordable accommodation through our verified platform.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn px-4 py-2"
                style={{ flex: '1 1 160px', maxWidth: 220, background: '#fff', color: 'var(--brand-orange)', fontWeight: 700, borderRadius: '10px' }}
                onClick={() => navigate('/register')}
              >
                Create Free Account <ArrowRight size={15} className="ms-1" />
              </button>
              <button
                className="btn btn-outline-primary px-4 py-2"
                style={{ flex: '1 1 130px', maxWidth: 180, borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
                onClick={() => navigate('/search')}
              >
                Browse First
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
