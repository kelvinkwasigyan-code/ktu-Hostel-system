// src/pages/student/MyReviewsPage.jsx
import { useState, useEffect } from 'react';
import { Star, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';
import Navbar from '../../components/Navbar';
import PortalFooter from '../../components/PortalFooter';
import StudentSidebar from '../../components/StudentSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/mine');
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Error fetching student reviews:', err);
      toast.error('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <StudentSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">

            {/* Page Header */}
            <div className="mb-4">
              <h2 className="mb-1">My Reviews</h2>
              <p className="text-muted-custom mb-0">Manage feedback and ratings you submitted for off-campus hostels</p>
            </div>

            <hr className="divider-orange mb-4" />

            {loading ? (
              <div className="page-loader">
                <div className="spinner-ring"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <h5 className="mb-2">No Reviews Yet</h5>
                <p className="text-muted-custom mx-auto mb-3" style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                  You haven't submitted reviews for any hostels. Once a landlord confirms your stay, you can write reviews on the My Bookings page.
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {reviews.map(r => (
                  <div key={r.review_id} className="col-12">
                    <div className="card p-4 border-custom bg-surface rounded-custom">
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                        <div>
                          <h6 className="mb-1" style={{ fontSize: '1rem', fontWeight: 700 }}>
                            {r.properties?.title}
                          </h6>
                          <p className="text-muted-custom mb-0 d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                            <MapPin size={13} className="text-orange" /> {r.properties?.address}, {r.properties?.neighborhood}
                          </p>
                        </div>
                        <div className="d-flex flex-column align-items-md-end">
                          <div className="d-flex gap-1 text-gold mb-1">
                            {[...Array(r.rating)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
                            {[...Array(5 - r.rating)].map((_, i) => <Star key={i} size={15} />)}
                          </div>
                          <small className="text-muted-custom" style={{ fontSize: '0.72rem' }}>
                            Submitted: {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </small>
                        </div>
                      </div>

                      <hr className="border-custom my-2" />

                      <div className="mb-3 mt-1">
                        <p className="mb-0 text-muted-custom" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                          "{r.comment}"
                        </p>
                      </div>

                      {/* Status Badges */}
                      <div className="d-flex align-items-center justify-content-between">
                        {r.is_flagged ? (
                          <span className="badge d-inline-flex align-items-center gap-1 p-2" style={{ backgroundColor: 'rgba(231,76,60,0.15)', color: 'var(--danger)', fontSize: '0.75rem' }}>
                            <AlertTriangle size={12} /> Flagged / Hidden from public
                          </span>
                        ) : (
                          <span className="badge d-inline-flex align-items-center gap-1 p-2" style={{ backgroundColor: 'rgba(46,204,113,0.15)', color: 'var(--success)', fontSize: '0.75rem' }}>
                            <ShieldCheck size={12} /> Approved & Publicly Visible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
          <PortalFooter />
        </main>
      </div>
    </>
  );
}
