// src/components/PropertyCard.jsx
// Reusable listing card used in SearchPage and StudentDashboard
import { Link } from 'react-router-dom';
import { MapPin, Star, Users, BedDouble } from 'lucide-react';

const ROOM_ICONS = {
  'Single': '🛏️',
  'Shared': '👥',
  'Self-contained': '🚿',
  'Apartment': '🏠'
};

export default function PropertyCard({ property }) {
  const heroImage = property.property_images
    ?.sort((a, b) => a.display_order - b.display_order)[0]?.image_path
    || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600';

  const statusClass = {
    Available: 'available',
    Pending: 'pending',
    Occupied: 'occupied'
  }[property.availability_status] || '';

  return (
    <Link to={`/property/${property.property_id}`} className="text-decoration-none d-block h-100">
      <div className="property-card">
        {/* Image */}
        <div className="property-card-img-wrapper">
          <img src={heroImage} alt={property.title} className="property-card-img" />
          <span className={`property-badge ${statusClass}`}>
            {property.availability_status}
          </span>
        </div>

        {/* Body */}
        <div className="property-card-body">
          <h6 className="mb-1 fw-700" style={{ fontFamily: 'Outfit,sans-serif', fontSize: '1rem', color: 'var(--text-primary)' }}>
            {property.title}
          </h6>

          <p className="property-meta mb-2 d-flex align-items-center gap-1">
            <MapPin size={13} style={{ color: 'var(--brand-orange)' }} />
            {property.neighborhood} · {property.distance_from_campus_km
              ? `${property.distance_from_campus_km} km from KTU`
              : 'Near KTU'}
          </p>

          {/* Room Type + Occupancy */}
          <div className="d-flex align-items-center gap-3 mb-3 property-meta">
            <span className="text-truncate" style={{ maxWidth: '160px' }}>
              {ROOM_ICONS[property.room_type?.split(',')[0]?.trim()] || '🛏️'} {property.room_type}
            </span>
            <span><Users size={13} /> Max {property.max_occupancy}</span>
          </div>

          {/* Rating */}
          {property.avg_rating && (
            <div className="d-flex align-items-center gap-1 mb-2 star-rating">
              <Star size={13} fill="currentColor" />
              <span style={{ fontWeight: 600 }}>{property.avg_rating}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                ({property.review_count} review{property.review_count !== 1 ? 's' : ''})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="d-flex justify-content-between align-items-end mt-2">
            <div>
              <span className="property-price">
                {property.room_rates?.length > 1 ? 'From ' : ''}GHS {Number(property.price_per_semester).toLocaleString()}
              </span>
              <br />
              <span className="property-price-label">per semester</span>
            </div>
            <span style={{
              background: 'rgba(255,107,53,0.12)',
              color: 'var(--brand-orange)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
