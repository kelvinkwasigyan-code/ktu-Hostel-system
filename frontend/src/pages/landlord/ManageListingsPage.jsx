// src/pages/landlord/ManageListingsPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { List, ToggleLeft, ToggleRight, ShieldCheck, Clock, PlusSquare, MapPin, Pencil } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LandlordSidebar from '../../components/LandlordSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ManageListingsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.get('/properties/landlord/mine');
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error('Error fetching landlord properties:', err);
      toast.error('Failed to load listings.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (propertyId, currentStatus) => {
    const newStatus = currentStatus === 'Available' ? 'Occupied' : 'Available';
    try {
      await api.patch(`/properties/${propertyId}/availability`, {
        availability_status: newStatus
      });
      toast.success(`Property marked as ${newStatus}`);
      // Optimistic state update
      setProperties(props => props.map(p => 
        p.property_id === propertyId ? { ...p, availability_status: newStatus } : p
      ));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update availability.';
      toast.error(errorMsg);
    }
  };

  const getVerificationBadge = (status) => {
    const badges = {
      Approved: { bg: 'rgba(46, 204, 113, 0.15)', text: 'var(--success)', label: 'Approved' },
      Pending: { bg: 'rgba(245, 166, 35, 0.15)', text: 'var(--brand-gold)', label: 'Pending Review' },
      Rejected: { bg: 'rgba(231, 76, 60, 0.15)', text: 'var(--danger)', label: 'Rejected' }
    };
    const b = badges[status] || { bg: 'var(--surface-2)', text: 'var(--text-primary)', label: status };
    return (
      <span className="badge" style={{ backgroundColor: b.bg, color: b.text, fontSize: '0.75rem', padding: '0.4rem 0.6rem', fontWeight: 600 }}>
        {b.label}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <LandlordSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">
            
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h2 className="mb-1">Manage Property Listings</h2>
                <p className="text-muted-custom mb-0">Monitor verification status and manage room vacancy toggles</p>
              </div>
              <Link to="/landlord/create" className="btn btn-primary d-flex align-items-center gap-1">
                <PlusSquare size={16} /> Create Listing
              </Link>
            </div>
            
            <hr className="divider-orange mb-4" />

            {loading ? (
              <div className="page-loader">
                <div className="spinner-ring"></div>
              </div>
            ) : properties.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <h5 className="mb-2">No Listings Yet</h5>
                <p className="text-muted-custom mx-auto mb-3" style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                  You haven't added any listings to your portfolio. Click Create Listing to get started.
                </p>
                <div>
                  <Link to="/landlord/create" className="btn btn-primary">
                    Create Your First Listing
                  </Link>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                {properties.map(p => {
                  const heroImg = p.property_images?.sort((a,b) => a.display_order - b.display_order)[0]?.image_path 
                    || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600';
                  
                  return (
                    <div key={p.property_id} className="col-12">
                      <div className="card p-3 border-custom bg-surface rounded-custom">
                        <div className="row align-items-center g-3">
                          
                          {/* Image */}
                          <div className="col-md-2">
                            <div style={{ height: '90px', borderRadius: '10px', overflow: 'hidden' }}>
                              <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="col-md-4">
                            <h6 className="mb-1" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                              {p.title}
                            </h6>
                            <p className="text-muted-custom mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                              <MapPin size={12} className="text-orange" /> {p.address}, {p.neighborhood}
                            </p>
                            <small className="text-gold fw-bold">
                              GHS {Number(p.price_per_semester).toLocaleString()} / semester
                            </small>
                          </div>

                          {/* Verification */}
                          <div className="col-md-2 text-md-center">
                            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }} className="mb-1">
                              Verification
                            </div>
                            {getVerificationBadge(p.verification_status)}
                          </div>

                          {/* Availability Toggle */}
                          <div className="col-md-2 text-md-center">
                            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }} className="mb-1">
                              Status
                            </div>
                            <span className={`badge mb-2 d-inline-block ${p.availability_status === 'Available' ? 'bg-success' : p.availability_status === 'Pending' ? 'bg-warning text-dark' : 'bg-danger'}`} style={{ fontSize: '0.75rem' }}>
                              {p.availability_status}
                            </span>
                          </div>

                          {/* Actions: Edit + Toggle */}
                          <div className="col-md-2 d-flex flex-column align-items-md-end gap-2">
                            {/* Edit button */}
                            <Link
                              to={`/landlord/listings/${p.property_id}/edit`}
                              className="btn btn-sm d-flex align-items-center gap-1 border-custom bg-surface-2"
                              style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}
                            >
                              <Pencil size={14} className="text-orange" /> Edit
                            </Link>

                            {/* Availability toggle */}
                            {p.availability_status !== 'Pending' ? (
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center gap-1 bg-surface-2 border-custom"
                                style={{ color: p.availability_status === 'Available' ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.8rem' }}
                                onClick={() => handleToggleAvailability(p.property_id, p.availability_status)}
                              >
                                {p.availability_status === 'Available' ? (
                                  <><ToggleRight size={22} className="text-success" /><span>Available</span></>
                                ) : (
                                  <><ToggleLeft size={22} className="text-muted-custom" /><span>Occupied</span></>
                                )}
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', fontStyle: 'italic' }} className="text-warning">
                                Hold Pending Response
                              </span>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
