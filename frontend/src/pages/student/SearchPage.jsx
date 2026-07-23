// src/pages/student/SearchPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Bell, Trash2, ShieldAlert } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PropertyCard from '../../components/PropertyCard';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NEIGHBORHOODS = ['Adweso', 'Nsukwao', 'Effiduase', 'Oyoko', 'Ashanti Nkwanta', 'Akwadum', 'Okorase'];
const ROOM_TYPES = ['Single', 'Shared', 'Self-contained', 'Apartment'];

export default function SearchPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states initialized from URL params if present
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');
  const [roomType, setRoomType] = useState(searchParams.get('room_type') || '');
  const [genderPolicy, setGenderPolicy] = useState(searchParams.get('gender_policy') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [maxDistance, setMaxDistance] = useState(searchParams.get('max_distance') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));

  // Data states
  const [properties, setProperties] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Vacancy alerts state
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [searchParams]);

  useEffect(() => {
    if (user && user.role === 'Student') {
      fetchAlerts();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = {};
      if (neighborhood) params.neighborhood = neighborhood;
      if (roomType)     params.room_type = roomType;
      if (genderPolicy) params.gender_policy = genderPolicy;
      if (maxPrice)     params.max_price = maxPrice;
      if (maxDistance)  params.max_distance = maxDistance;
      params.page = page;
      params.limit = 9;

      const res = await api.get('/properties/search', { params });
      setProperties(res.data.properties || []);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error('Error searching properties:', err);
      toast.error('Failed to load properties.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const res = await api.get('/properties/alerts/mine');
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error('Error fetching vacancy alerts:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    const newParams = {};
    if (neighborhood) newParams.neighborhood = neighborhood;
    if (roomType)     newParams.room_type = roomType;
    if (genderPolicy) newParams.gender_policy = genderPolicy;
    if (maxPrice)     newParams.max_price = maxPrice;
    if (maxDistance)  newParams.max_distance = maxDistance;
    newParams.page = '1';
    setPage(1);
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setNeighborhood('');
    setRoomType('');
    setGenderPolicy('');
    setMaxPrice('');
    setMaxDistance('');
    setPage(1);
    setSearchParams({});
  };

  const handleCreateAlert = async () => {
    if (!user) {
      toast.error('Please log in to set vacancy alerts.');
      return;
    }
    try {
      await api.post('/properties/alerts', {
        neighborhood: neighborhood || null,
        max_price: maxPrice ? parseFloat(maxPrice) : null,
        room_type: roomType || null,
        max_distance: maxDistance ? parseFloat(maxDistance) : null
      });
      toast.success('Alert preference added successfully!');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to save alertpreference.');
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await api.delete(`/properties/alerts/${alertId}`);
      toast.success('Alert deleted.');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to delete alert.');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    const updated = Object.fromEntries(searchParams.entries());
    updated.page = newPage.toString();
    setSearchParams(updated);
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        
        {/* Title */}
        <div className="mb-4">
          <h2 className="section-title">Browse Hostels</h2>
          <div className="section-divider"></div>
        </div>

        <div className="row g-4">
          {/* Left Column: Filters & Alerts */}
          <div className="col-lg-3">
            
            {/* Filters Form */}
            <div className="card p-4 mb-4 border-custom bg-surface rounded-custom">
              <h5 className="mb-3 d-flex align-items-center gap-2">
                <SlidersHorizontal size={18} className="text-orange" /> Filters
              </h5>
              <form onSubmit={handleApplyFilters}>
                <div className="mb-3">
                  <label className="form-label">Neighborhood</label>
                  <select className="form-select" value={neighborhood} onChange={e => setNeighborhood(e.target.value)}>
                    <option value="">All Areas</option>
                    {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Room Type</label>
                  <select className="form-select" value={roomType} onChange={e => setRoomType(e.target.value)}>
                    <option value="">Any Room Type</option>
                    {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Gender Policy</label>
                  <select className="form-select" value={genderPolicy} onChange={e => setGenderPolicy(e.target.value)}>
                    <option value="">All Policies</option>
                    <option value="Mixed">🚻 Mixed (Co-ed)</option>
                    <option value="Boys only">🚹 Boys only</option>
                    <option value="Girls only">🚺 Girls only</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Max Price (GHS)</label>
                  <input type="number" className="form-control" placeholder="e.g. 1500" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Max Distance from KTU (km)</label>
                  <input type="number" step="0.1" className="form-control" placeholder="e.g. 2.5" value={maxDistance} onChange={e => setMaxDistance(e.target.value)} />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary flex-grow-1">Apply</button>
                  <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>Reset</button>
                </div>
              </form>
            </div>

            {/* Vacancy Alerts widget */}
            {user && user.role === 'Student' && (
              <div className="card p-4 border-custom bg-surface rounded-custom">
                <h5 className="mb-2 d-flex align-items-center gap-2">
                  <Bell size={18} className="text-gold" /> Vacancy Alerts
                </h5>
                <p className="text-muted-custom mb-3" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  Get notified in-app when a room matching your current filter criteria becomes available.
                </p>
                <button type="button" className="btn btn-outline-primary btn-sm w-100 mb-3" onClick={handleCreateAlert}>
                  🔔 Alert Me with Current Filters
                </button>
                <hr className="border-custom my-2" />
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {loadingAlerts ? (
                    <small className="text-muted-custom">Loading alert settings...</small>
                  ) : alerts.length === 0 ? (
                    <small className="text-muted-custom text-center">No alerts configured.</small>
                  ) : (
                    alerts.map(a => (
                      <div key={a.alert_id} className="p-2 bg-surface-2 border-custom rounded-custom d-flex justify-content-between align-items-start" style={{ fontSize: '0.75rem' }}>
                        <div>
                          {a.neighborhood && <div>📍 {a.neighborhood}</div>}
                          {a.room_type && <div>🛏️ {a.room_type}</div>}
                          {a.max_price && <div>💰 Max GHS {a.max_price}</div>}
                          {a.max_distance && <div>🚶 Max {a.max_distance} km</div>}
                          {!a.neighborhood && !a.room_type && !a.max_price && !a.max_distance && <div>Any Property</div>}
                        </div>
                        <button className="btn btn-link text-danger p-0" onClick={() => handleDeleteAlert(a.alert_id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Grid and Pagination */}
          <div className="col-lg-9">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted-custom" style={{ fontSize: '0.9rem' }}>
                Found <strong>{totalCount}</strong> available properties
              </span>
            </div>

            {loading ? (
              <div className="page-loader">
                <div className="spinner-ring"></div>
              </div>
            ) : properties.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <div className="mb-3 text-muted-custom"><ShieldAlert size={48} /></div>
                <h4>No Hostels Found</h4>
                <p className="text-muted-custom mx-auto mb-3" style={{ maxWidth: '420px', fontSize: '0.9rem' }}>
                  We couldn't find any approved, available listings matching your current criteria. Try loosening your filter settings.
                </p>
                <div>
                  <button className="btn btn-secondary" onClick={handleClearFilters}>
                    Clear All Filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="row g-3">
                  {properties.map(p => (
                    <div key={p.property_id} className="col-md-6 col-lg-4">
                      <PropertyCard property={p} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center align-items-center gap-3 mt-5">
                    <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => handlePageChange(page - 1)}>
                      ← Prev
                    </button>
                    <span className="text-muted-custom" style={{ fontSize: '0.85rem' }}>
                      Page <strong>{page}</strong> of {totalPages}
                    </span>
                    <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => handlePageChange(page + 1)}>
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}
