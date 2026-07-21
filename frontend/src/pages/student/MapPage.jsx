// src/pages/student/MapPage.jsx
import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import MapboxHostelMap from '../../components/MapboxHostelMap';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MapPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchMapProperties();
  }, []);

  const fetchMapProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/map');
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error('Error fetching map properties:', err);
      toast.error('Failed to load map listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProperty = (prop) => {
    setSelectedProperty(prop);
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
      <div className="container-fluid p-0" style={{ height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
        <div className="d-flex h-100 flex-column flex-md-row">
          
          {/* Left Panel: List of hostels */}
          <div className="d-flex flex-column bg-surface border-custom" style={{ width: '100%', maxWidth: '380px', height: '100%' }}>
            <div className="p-3 border-bottom border-custom">
              <h5 className="mb-1" style={{ fontFamily: 'Outfit,sans-serif' }}>Explore Nearby Hostels</h5>
              <p className="text-muted-custom mb-0" style={{ fontSize: '0.8rem' }}>
                Showing <strong>{properties.length}</strong> available properties on the map near KTU campus.
              </p>
            </div>
            
            <div className="flex-grow-1 overflow-y-auto p-2" style={{ maxHeight: 'calc(100vh - 150px)' }}>
              {properties.length === 0 ? (
                <div className="text-center py-5 text-muted-custom">
                  No hostels currently available.
                </div>
              ) : (
                properties.map(p => {
                  const heroImg = p.property_images?.sort((a,b) => a.display_order - b.display_order)[0]?.image_path 
                    || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=300';
                  
                  return (
                    <div 
                      key={p.property_id}
                      className={`p-3 mb-2 rounded-custom bg-surface-2 border-custom cursor-pointer transition ${selectedProperty?.property_id === p.property_id ? 'border-hover shadow' : ''}`}
                      onClick={() => handleSelectProperty(p)}
                    >
                      <div className="d-flex gap-3">
                        <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
                          <h6 className="mb-1 text-truncate" style={{ fontSize: '0.9rem', fontWeight: 700 }}>{p.title}</h6>
                          <div className="text-muted-custom mb-1 text-truncate" style={{ fontSize: '0.78rem' }}>
                            📍 {p.neighborhood} • {p.distance_from_campus_km ? `${p.distance_from_campus_km} km` : 'Near KTU'}
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-orange fw-bold" style={{ fontSize: '0.9rem' }}>GHS {p.price_per_semester}</span>
                            <span style={{ fontSize: '0.72rem' }} className="badge bg-secondary">{p.room_type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Mapbox Map */}
          <div className="flex-grow-1 h-100 position-relative">
            <MapboxHostelMap
              properties={properties}
              selectedProperty={selectedProperty}
              onSelectProperty={handleSelectProperty}
            />
          </div>

        </div>
      </div>
    </>
  );
}
