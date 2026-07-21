// src/pages/student/PropertyDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Users, BedDouble, Calendar, Clock, Star, ShieldCheck, Heart, User } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import MapboxSingleLocation from '../../components/MapboxSingleLocation';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROOM_ICONS = {
  'Single': '🛏️',
  'Shared': '👥',
  'Self-contained': '🚿',
  'Apartment': '🏠'
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingHold, setSubmittingHold] = useState(false);
  const [activeImage, setActiveImage] = useState('');

  // Review states
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/properties/${id}`);
      setProperty(res.data.property);
      setReviews(res.data.reviews || []);
      
      const images = res.data.property?.property_images || [];
      if (images.length > 0) {
        // Sort by display order
        const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
        setActiveImage(sorted[0].image_path);
      } else {
        setActiveImage('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200');
      }
    } catch (err) {
      console.error('Error fetching property details:', err);
      toast.error('Failed to load property details.');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceHold = async () => {
    if (!user) {
      toast.error('You must sign in to place a hold on this property.');
      navigate('/login');
      return;
    }

    if (user.role !== 'Student') {
      toast.error('Only students can place reservation holds.');
      return;
    }

    try {
      setSubmittingHold(true);
      const res = await api.post('/bookings', { property_id: property.property_id });
      toast.success(res.data.message || 'Hold placed successfully! Check dashboard.');
      navigate('/student');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to place reservation hold. Try again later.';
      toast.error(errorMsg);
    } finally {
      setSubmittingHold(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must sign in to submit a review.');
      navigate('/login');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post('/reviews', {
        property_id: property.property_id,
        rating: newRating,
        comment: newComment
      });
      toast.success(res.data.message || 'Review submitted successfully!');
      setNewComment('');
      setNewRating(5);
      fetchPropertyDetails();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit review.';
      toast.error(errorMsg);
    } finally {
      setSubmittingReview(false);
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

  if (!property) return null;

  const images = property.property_images?.sort((a, b) => a.display_order - b.display_order) || [];
  
  // Parse amenities from JSON string if necessary
  let parsedAmenities = [];
  try {
    parsedAmenities = typeof property.amenities === 'string' 
      ? JSON.parse(property.amenities) 
      : property.amenities || [];
  } catch {
    parsedAmenities = property.amenities?.split(',') || [];
  }

  return (
    <>
      <Navbar />
      <div className="container py-4">
        
        {/* Navigation Breadcrumbs */}
        <div className="mb-3" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <Link to="/" className="text-decoration-none text-muted-custom">Home</Link> /{' '}
          <Link to="/search" className="text-decoration-none text-muted-custom">Search</Link> /{' '}
          <span className="text-orange">{property.title}</span>
        </div>

        {/* E2E Main Grid */}
        <div className="row g-4">
          
          {/* Left Column: Gallery & Details */}
          <div className="col-lg-8">
            
            {/* Gallery */}
            <div className="card border-custom bg-surface rounded-custom overflow-hidden mb-4 p-2">
              <div className="mb-2" style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
                <img src={activeImage} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {images.length > 1 && (
                <div className="d-flex gap-2 p-1 overflow-x-auto">
                  {images.map((img, i) => (
                    <div 
                      key={img.image_id} 
                      onClick={() => setActiveImage(img.image_path)}
                      style={{ 
                        width: '80px', height: '60px', 
                        borderRadius: '6px', overflow: 'hidden', 
                        cursor: 'pointer',
                        border: activeImage === img.image_path ? '2px solid var(--brand-orange)' : '2px solid transparent'
                      }}
                    >
                      <img src={img.image_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Overview */}
            <div className="card p-4 border-custom bg-surface rounded-custom mb-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <div>
                  <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800 }}>{property.title}</h3>
                  <p className="text-muted-custom d-flex align-items-center gap-1 mb-0" style={{ fontSize: '0.9rem' }}>
                    <MapPin size={15} className="text-orange" /> {property.address}, {property.neighborhood}
                  </p>
                </div>
                <div className="d-flex flex-column align-items-md-end">
                  <div className="property-price">GHS {Number(property.price_per_semester).toLocaleString()}</div>
                  <small className="text-muted-custom">per semester</small>
                </div>
              </div>

              <hr className="border-custom my-3" />

              {/* Quick Specs */}
              <div className="row g-3 text-center mb-3">
                <div className="col-4">
                  <div className="p-3 bg-surface-2 rounded-custom border-custom">
                    <div style={{ fontSize: '1.2rem' }}>{ROOM_ICONS[property.room_type] || '🛏️'}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{property.room_type}</div>
                    <small className="text-muted-custom" style={{ fontSize: '0.75rem' }}>Room Type</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 bg-surface-2 rounded-custom border-custom">
                    <div className="text-orange"><Users size={20} className="mx-auto" /></div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Max {property.max_occupancy}</div>
                    <small className="text-muted-custom" style={{ fontSize: '0.75rem' }}>Occupancy</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-3 bg-surface-2 rounded-custom border-custom">
                    <div className="text-gold"><MapPin size={20} className="mx-auto" /></div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{property.distance_from_campus_km ? `${property.distance_from_campus_km} km` : 'Near Campus'}</div>
                    <small className="text-muted-custom" style={{ fontSize: '0.75rem' }}>Distance from KTU</small>
                  </div>
                </div>
              </div>

              <h5 className="mb-2 mt-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Description</h5>
              <p className="text-muted-custom" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                {property.description || 'No description provided for this hostel.'}
              </p>

              <h5 className="mb-2 mt-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Amenities</h5>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {parsedAmenities.length === 0 ? (
                  <span className="text-muted-custom" style={{ fontSize: '0.85rem' }}>No amenities listed.</span>
                ) : (
                  parsedAmenities.map((amenity, i) => (
                    <span key={i} className="badge bg-secondary p-2 border-custom" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      ⚡ {amenity.trim()}
                    </span>
                  ))
                )}
              </div>

              <h5 className="mb-2 mt-4" style={{ fontFamily: 'Outfit,sans-serif' }}>Location & Campus Proximity</h5>
              <p className="text-muted-custom mb-3" style={{ fontSize: '0.88rem' }}>
                📍 {property.address}, {property.neighborhood}
              </p>
              <MapboxSingleLocation
                latitude={property.latitude}
                longitude={property.longitude}
                title={property.title}
                address={property.address}
                neighborhood={property.neighborhood}
                distanceKm={property.distance_from_campus_km}
              />
            </div>

            {/* Reviews Section */}
            <div className="card p-4 border-custom bg-surface rounded-custom">
              <h5 className="mb-3 d-flex align-items-center gap-2" style={{ fontFamily: 'Outfit,sans-serif' }}>
                <Star size={18} className="text-gold" /> Verified Student Reviews
              </h5>
              
              {user ? (
                <form onSubmit={handleSubmitReview} className="mb-4 p-3 bg-surface-2 border-custom rounded-custom">
                  <h6 className="mb-2" style={{ fontWeight: 600, fontSize: '0.92rem' }}>Write a Review</h6>
                  <div className="mb-2">
                    <div className="stars-interactive d-flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= newRating ? 'filled' : ''}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: star <= newRating ? 'var(--brand-gold)' : 'var(--text-muted)',
                            fontSize: '1.4rem',
                            padding: 0,
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                          onClick={() => setNewRating(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Share your stay experience about this hostel..."
                      required
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm px-4" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              ) : (
                <div className="alert alert-info py-2 px-3 mb-4" style={{ fontSize: '0.85rem' }}>
                  Please <Link to="/login" className="text-decoration-none" style={{ color: 'var(--brand-orange)', fontWeight: 600 }}>log in</Link> to submit a review.
                </div>
              )}

              <hr className="border-custom my-2" />
              {reviews.length === 0 ? (
                <div className="text-center py-4 text-muted-custom" style={{ fontSize: '0.9rem' }}>
                  No reviews submitted for this property yet.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3 mt-3">
                  {reviews.map(r => (
                    <div key={r.review_id} className="p-3 bg-surface-2 border-custom rounded-custom">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }} className="text-orange">
                            <User size={16} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>{r.users?.full_name || 'Anonymous Student'}</h6>
                            <small className="text-muted-custom" style={{ fontSize: '0.75rem' }}>
                              {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </small>
                          </div>
                        </div>
                        <div className="d-flex gap-1 text-gold">
                          {[...Array(r.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                          {[...Array(5 - r.rating)].map((_, i) => <Star key={i} size={14} />)}
                        </div>
                      </div>
                      <p className="mb-0 text-muted-custom" style={{ fontSize: '0.88rem', paddingLeft: '40px' }}>
                        "{r.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Hold Booking Card */}
          <div className="col-lg-4">
            
            {/* Booking Hold panel */}
            <div className="card p-4 border-custom bg-surface rounded-custom position-sticky" style={{ top: '85px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="badge" style={{
                  background: property.availability_status === 'Available' ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)',
                  color: property.availability_status === 'Available' ? 'var(--success)' : 'var(--danger)',
                  fontSize: '0.8rem', fontWeight: 700
                }}>
                  {property.availability_status}
                </span>
                
                {property.avg_rating && (
                  <div className="d-flex align-items-center gap-1 text-gold" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    <Star size={14} fill="currentColor" /> {property.avg_rating} ({property.review_count} review{property.review_count !== 1 ? 's' : ''})
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="mb-1" style={{ color: 'var(--brand-orange)', fontFamily: 'Outfit,sans-serif', fontWeight: 800 }}>
                  GHS {Number(property.price_per_semester).toLocaleString()}
                </h4>
                <small className="text-muted-custom">Rent is paid directly to the landlord per semester.</small>
              </div>

              {/* Key Features Callout */}
              <div className="p-3 bg-surface-2 rounded-custom border-custom mb-4" style={{ fontSize: '0.82rem' }}>
                <div className="d-flex gap-2 align-items-start mb-2">
                  <ShieldCheck size={16} className="text-success mt-0.5" />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Verified Hosteller</strong>
                    <div className="text-muted-custom">Landlord identity document verified by KTU admin.</div>
                  </div>
                </div>
                <div className="d-flex gap-2 align-items-start">
                  <Clock size={16} className="text-orange mt-0.5" />
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>24-Hour Hold Guarantee</strong>
                    <div className="text-muted-custom">Reservations are held for 24 hours to secure off-line negotiations.</div>
                  </div>
                </div>
              </div>

              {/* Action */}
              {property.availability_status === 'Available' ? (
                <button 
                  className="btn btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
                  onClick={handlePlaceHold}
                  disabled={submittingHold}
                >
                  <Clock size={18} /> {submittingHold ? 'Placing Hold...' : 'Place 24-Hour Hold'}
                </button>
              ) : (
                <button className="btn btn-secondary w-100 py-2.5" disabled>
                  Reservation Unavailable ({property.availability_status})
                </button>
              )}
              
              <div className="text-center mt-3">
                <p className="text-muted-custom mb-0" style={{ fontSize: '0.78rem' }}>
                  No booking fee required. Contact information is released upon landlord hold approval.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
      <Footer />
    </>
  );
}
