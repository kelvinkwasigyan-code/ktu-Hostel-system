// src/pages/admin/AnalyticsPage.jsx
import { useState, useEffect } from 'react';
import { BarChart2, Users, Home, Calendar, Star, TrendingUp, DollarSign, Activity } from 'lucide-react';
import Navbar from '../../components/Navbar';
import PortalFooter from '../../components/PortalFooter';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

function StatCard({ icon, label, value, sub, colorClass }) {
  return (
    <div className={`stat-card ${colorClass || 'blue'}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className={`stat-number ${colorClass || 'blue'}`}>{value ?? '—'}</div>
          <div className="stat-label">{label}</div>
          {sub && <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.7 }}>{sub}</div>}
        </div>
        <div style={{ opacity: 0.5 }}>{icon}</div>
      </div>
    </div>
  );
}

// Simple bar chart using vanilla CSS
function MiniBarChart({ data, maxValue }) {
  if (!data || data.length === 0) {
    return <p className="text-muted-custom text-center py-3" style={{ fontSize: '0.88rem' }}>No data available.</p>;
  }
  const max = maxValue || Math.max(...data.map(d => d.count), 1);
  return (
    <div className="d-flex align-items-flex-end gap-2 mt-3" style={{ height: '140px', alignItems: 'flex-end' }}>
      {data.map((d, i) => (
        <div key={i} className="d-flex flex-column align-items-center flex-grow-1" style={{ gap: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.count}</span>
          <div style={{
            width: '100%',
            height: `${Math.max(4, (d.count / max) * 110)}px`,
            background: 'linear-gradient(180deg, var(--brand-orange), rgba(255,140,0,0.4))',
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.4s ease',
          }} />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Simple doughnut-style ring
function RingMetric({ value, max, label, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const dashArray = 2 * Math.PI * 40; // circumference of r=40
  const dashOffset = dashArray * (1 - pct / 100);
  return (
    <div className="d-flex flex-column align-items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="40"
          fill="none"
          stroke={color || 'var(--brand-orange)'}
          strokeWidth="10"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
        <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="bold" fill="var(--text-primary)">
          {pct}%
        </text>
      </svg>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data.analytics);
    } catch {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  // Build bar chart data from city/neighborhood distribution if available
  const cityData = analytics?.properties?.by_city?.slice(0, 6).map(c => ({
    label: c.city || c.neighborhood,
    count: c.count,
  })) || [];

  const bookingBarData = analytics?.bookings?.by_month?.slice(-6).map(m => ({
    label: m.month,
    count: m.count,
  })) || [];

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <AdminSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">

            {/* Header */}
            <div className="mb-4">
              <h2 className="mb-1">Platform Analytics</h2>
              <p className="text-muted-custom mb-0">Real-time insights into platform activity, user growth, and listing performance</p>
            </div>
            <hr className="divider-orange mb-4" />

            {loading ? (
              <div className="page-loader"><div className="spinner-ring"></div></div>
            ) : !analytics ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <BarChart2 size={40} className="text-muted-custom mx-auto mb-3" style={{ opacity: 0.4 }} />
                <h5>Analytics unavailable</h5>
                <p className="text-muted-custom mb-0" style={{ fontSize: '0.9rem' }}>Could not load analytics data from the server.</p>
              </div>
            ) : (
              <>
                {/* KPI Cards row */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <StatCard icon={<Users size={26} />} label="Total Users" value={analytics.users?.total} sub={`${analytics.users?.students || 0} students · ${analytics.users?.landlords || 0} landlords`} colorClass="orange" />
                  </div>
                  <div className="col-6 col-md-3">
                    <StatCard icon={<Home size={26} />} label="Active Listings" value={analytics.properties?.approved} sub={`${analytics.properties?.pending || 0} pending review`} colorClass="green" />
                  </div>
                  <div className="col-6 col-md-3">
                    <StatCard icon={<Calendar size={26} />} label="Total Holds" value={analytics.bookings?.total} sub={`${analytics.bookings?.active || analytics.bookings?.pending || 0} currently active`} colorClass="blue" />
                  </div>
                  <div className="col-6 col-md-3">
                    <StatCard icon={<Star size={26} />} label="Avg Rating" value={analytics.reviews?.avg_rating ? Number(analytics.reviews.avg_rating).toFixed(1) : '—'} sub={`${analytics.reviews?.total || 0} total reviews · ${analytics.reviews?.flagged || 0} flagged`} colorClass="gold" />
                  </div>
                </div>

                {/* Charts row */}
                <div className="row g-4 mb-4">

                  {/* Listings by City */}
                  <div className="col-md-6">
                    <div className="card p-4 border-custom bg-surface rounded-custom h-100">
                      <h6 className="mb-0 d-flex align-items-center gap-2">
                        <Home size={16} className="text-orange" /> Listings by City/Neighborhood
                      </h6>
                      <hr className="divider-orange my-2" />
                      {cityData.length > 0 ? (
                        <MiniBarChart data={cityData} />
                      ) : (
                        <p className="text-muted-custom text-center py-4 mb-0" style={{ fontSize: '0.88rem' }}>
                          No city breakdown available yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bookings over time */}
                  <div className="col-md-6">
                    <div className="card p-4 border-custom bg-surface rounded-custom h-100">
                      <h6 className="mb-0 d-flex align-items-center gap-2">
                        <TrendingUp size={16} className="text-orange" /> Holds Over Last 6 Months
                      </h6>
                      <hr className="divider-orange my-2" />
                      {bookingBarData.length > 0 ? (
                        <MiniBarChart data={bookingBarData} />
                      ) : (
                        <p className="text-muted-custom text-center py-4 mb-0" style={{ fontSize: '0.88rem' }}>
                          No monthly booking breakdown available yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ring metrics + other stats */}
                <div className="row g-4">

                  {/* Verification rate rings */}
                  <div className="col-md-4">
                    <div className="card p-4 border-custom bg-surface rounded-custom h-100">
                      <h6 className="mb-0 d-flex align-items-center gap-2">
                        <Activity size={16} className="text-orange" /> Moderation Status
                      </h6>
                      <hr className="divider-orange my-2" />
                      <div className="d-flex justify-content-around flex-wrap gap-3 mt-3">
                        <RingMetric
                          value={analytics.properties?.approved || 0}
                          max={analytics.properties?.total || analytics.properties?.approved || 1}
                          label="Listings Approved"
                          color="var(--success)"
                        />
                        <RingMetric
                          value={analytics.users?.verified_landlords || 0}
                          max={analytics.users?.landlords || 1}
                          label="Landlords Verified"
                          color="var(--brand-orange)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick summary table */}
                  <div className="col-md-8">
                    <div className="card p-4 border-custom bg-surface rounded-custom h-100">
                      <h6 className="mb-0 d-flex align-items-center gap-2">
                        <DollarSign size={16} className="text-orange" /> Quick Summary
                      </h6>
                      <hr className="divider-orange my-2" />
                      <div className="table-responsive">
                        <table className="table mb-0" style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                          <tbody>
                            {[
                              { label: 'Total Users', value: analytics.users?.total || 0 },
                              { label: 'Student Users', value: analytics.users?.students || 0 },
                              { label: 'Landlord Users', value: analytics.users?.landlords || 0 },
                              { label: 'Verified Landlords', value: analytics.users?.verified_landlords || 0 },
                              { label: 'Total Listings', value: analytics.properties?.total || analytics.properties?.approved || 0 },
                              { label: 'Pending Listings', value: analytics.properties?.pending || 0 },
                              { label: 'Approved Listings', value: analytics.properties?.approved || 0 },
                              { label: 'Total Booking Holds', value: analytics.bookings?.total || 0 },
                              { label: 'Active / Pending Holds', value: analytics.bookings?.active || analytics.bookings?.pending || 0 },
                              { label: 'Total Reviews', value: analytics.reviews?.total || 0 },
                              { label: 'Flagged Reviews', value: analytics.reviews?.flagged || 0 },
                              { label: 'Average Rating', value: analytics.reviews?.avg_rating ? `★ ${Number(analytics.reviews.avg_rating).toFixed(2)}` : '—' },
                            ].map((row, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td className="py-2 text-muted-custom">{row.label}</td>
                                <td className="py-2 text-end fw-bold">{row.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <PortalFooter />
        </main>
      </div>
    </>
  );
}
