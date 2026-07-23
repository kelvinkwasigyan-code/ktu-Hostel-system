import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, List, Inbox, AlertTriangle, ShieldCheck, Star, Users, PlusSquare, ArrowRight, User } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LandlordSidebar from '../../components/LandlordSidebar';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function LandlordDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_listings: 0,
    approved_listings: 0,
    pending_listings: 0,
    available_rooms: 0,
    occupied_rooms: 0,
    pending_bookings: 0,
    total_reviews: 0,
    avg_rating: null
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/landlord/dashboard');
      setStats(res.data?.stats || {});
      setProperties(res.data?.properties || []);
      setRecentBookings(res.data?.recent_bookings || []);
    } catch (err) {
      console.error('Error fetching landlord dashboard:', err);
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

  const isVerified = user?.verification_status === 'Approved';

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <LandlordSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="mb-1">Landlord Dashboard</h2>
                <p className="text-muted-custom mb-0">Manage listings, monitor student reservation holds, and check ratings.</p>
              </div>
              <div className="d-flex align-items-center gap-3">
                <Link to="/landlord/profile" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                  <User size={15} /> Edit Profile
                </Link>
                <span className="text-muted-custom d-none d-md-inline" style={{ fontSize: '0.85rem' }}>
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>

            {/* Verification Alert Banner */}
            {!isVerified && (
              <div className="card p-4 mb-4 border-0 rounded-custom" style={{
                background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(245, 166, 35, 0.08) 100%)',
                border: '1px solid rgba(231, 76, 60, 0.25) !important'
              }}>
                <div className="d-flex gap-3 align-items-center">
                  <div className="text-danger flex-shrink-0"><AlertTriangle size={32} /></div>
                  <div>
                    <h5 className="mb-1 text-danger">Identity Verification Required</h5>
                    <p className="text-muted-custom mb-0" style={{ fontSize: '0.88rem' }}>
                      Your profile verification status is currently <strong>{user?.verification_status || 'Pending'}</strong>. 
                      You can compile property listings, but they will remain hidden from student search queries until an administrator reviews and approves your account documents.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="stat-card orange">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="stat-number orange">{stats.total_listings}</div>
                      <div className="stat-label">Total Properties Listed</div>
                    </div>
                    <List size={28} className="text-orange" opacity={0.6} />
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card green">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="stat-number green">{stats.available_rooms}</div>
                      <div className="stat-label">Available Rooms</div>
                    </div>
                    <ShieldCheck size={28} className="text-success" opacity={0.6} />
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card blue">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="stat-number blue">{stats.pending_bookings}</div>
                      <div className="stat-label">Pending Hold Requests</div>
                    </div>
                    <Inbox size={28} className="text-info" opacity={0.6} />
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card gold">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="stat-number gold">{stats.avg_rating || '—'}</div>
                      <div className="stat-label">Average Star Rating ({stats.total_reviews} reviews)</div>
                    </div>
                    <Star size={28} className="text-warning" opacity={0.6} fill={stats.avg_rating ? "currentColor" : "none"} />
                  </div>
                </div>
              </div>
            </div>

            {/* Split Content */}
            <div className="row g-4">
              {/* Left Column: Recent Reservation Holds */}
              <div className="col-lg-7">
                <div className="card p-4 border-custom bg-surface rounded-custom h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Recent Hold Requests</h5>
                    <Link to="/landlord/requests" className="text-orange text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      View All <ArrowRight size={14} className="ms-1" />
                    </Link>
                  </div>
                  <hr className="divider-orange my-2" />
                  
                  {recentBookings.length === 0 ? (
                    <div className="text-center py-5 text-muted-custom">
                      No reservation holds requested yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0" style={{ color: 'var(--text-primary)' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th className="p-2 text-muted-custom" style={{ fontSize: '0.8rem' }}>Hostel</th>
                            <th className="p-2 text-muted-custom" style={{ fontSize: '0.8rem' }}>Student</th>
                            <th className="p-2 text-muted-custom" style={{ fontSize: '0.8rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentBookings.slice(0, 5).map(b => (
                            <tr key={b.booking_id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                              <td className="p-2" style={{ fontSize: '0.85rem' }}>{b.properties?.title}</td>
                              <td className="p-2" style={{ fontSize: '0.85rem' }}>{b.users?.full_name}</td>
                              <td className="p-2">
                                <span className="badge" style={{
                                  backgroundColor: b.status === 'Pending' ? 'rgba(245,166,35,0.15)' : b.status === 'Approved' ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.08)',
                                  color: b.status === 'Pending' ? 'var(--brand-gold)' : b.status === 'Approved' ? 'var(--success)' : 'var(--text-muted)',
                                  fontSize: '0.72rem'
                                }}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Listing summary list */}
              <div className="col-lg-5">
                <div className="card p-4 border-custom bg-surface rounded-custom h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">My Properties</h5>
                    <Link to="/landlord/listings" className="text-orange text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Manage <ArrowRight size={14} className="ms-1" />
                    </Link>
                  </div>
                  <hr className="divider-orange my-2" />
                  
                  {properties.length === 0 ? (
                    <div className="text-center py-5 text-muted-custom">
                      <p className="mb-3">You haven't listed any properties yet.</p>
                      <Link to="/landlord/create" className="btn btn-primary btn-sm">
                        <PlusSquare size={14} className="me-1" /> Create Listing
                      </Link>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2 mt-2">
                      {properties.slice(0, 4).map(p => (
                        <div key={p.property_id} className="p-3 bg-surface-2 border-custom rounded-custom d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{p.title}</h6>
                            <small className="text-muted-custom">💰 GHS {p.price_per_semester}</small>
                          </div>
                          <span className="badge" style={{
                            backgroundColor: p.verification_status === 'Approved' ? 'rgba(46,204,113,0.15)' : 'rgba(245,166,35,0.15)',
                            color: p.verification_status === 'Approved' ? 'var(--success)' : 'var(--brand-gold)',
                            fontSize: '0.72rem'
                          }}>
                            {p.verification_status}
                          </span>
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
