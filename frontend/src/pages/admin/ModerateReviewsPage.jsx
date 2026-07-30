// src/pages/admin/ModerateReviewsPage.jsx
import { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Trash2, CheckCircle, Star, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../../components/Navbar';
import PortalFooter from '../../components/PortalFooter';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

function StarRating({ rating }) {
  return (
    <span className="d-inline-flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          fill={i <= rating ? 'var(--brand-gold)' : 'none'}
          style={{ color: i <= rating ? 'var(--brand-gold)' : 'var(--text-muted)' }}
        />
      ))}
    </span>
  );
}

export default function ModerateReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilter] = useState('flagged'); // 'flagged' | 'all'
  const [expanded, setExpanded] = useState(null);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/reviews');
      setReviews(res.data.reviews || []);
    } catch {
      toast.error('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismissFlag = async (reviewId) => {
    try {
      await api.patch(`/admin/reviews/${reviewId}/flag`, { action: 'dismiss' });
      toast.success('Flag dismissed — review remains visible.');
      setReviews(prev => prev.map(r =>
        r.review_id === reviewId ? { ...r, is_flagged: false } : r
      ));
    } catch {
      toast.error('Failed to dismiss flag.');
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/reviews/${deleteTarget.review_id}`);
      toast.success('Review deleted.');
      setReviews(prev => prev.filter(r => r.review_id !== deleteTarget.review_id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete review.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = filterMode === 'flagged'
    ? reviews.filter(r => r.is_flagged)
    : reviews;

  const flaggedCount = reviews.filter(r => r.is_flagged).length;

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <AdminSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">

            {/* Header */}
            <div className="mb-4">
              <h2 className="mb-1">Moderate Reviews</h2>
              <p className="text-muted-custom mb-0">Review flagged or all student reviews and take appropriate action</p>
            </div>
            <hr className="divider-orange mb-4" />

            {/* Filter toggle */}
            <div className="d-flex gap-2 mb-4">
              {[
                { key: 'flagged', label: `Flagged (${flaggedCount})` },
                { key: 'all', label: `All Reviews (${reviews.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className="btn btn-sm"
                  style={{
                    background: filterMode === tab.key ? 'var(--brand-orange)' : 'var(--surface-2)',
                    color: filterMode === tab.key ? '#fff' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="page-loader"><div className="spinner-ring"></div></div>
            ) : filtered.length === 0 ? (
              <div className="card p-5 border-custom bg-surface rounded-custom text-center">
                <CheckCircle size={40} className="text-success mx-auto mb-3" style={{ opacity: 0.5 }} />
                <h5 className="mb-1">All Clear</h5>
                <p className="text-muted-custom mb-0" style={{ fontSize: '0.9rem' }}>
                  {filterMode === 'flagged' ? 'No reviews are currently flagged.' : 'No reviews found on the platform.'}
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filtered.map(review => (
                  <div key={review.review_id}
                    className="card border-custom bg-surface rounded-custom overflow-hidden"
                    style={{ transition: 'box-shadow 0.2s' }}>

                    {/* Main row */}
                    <div className="p-3 d-flex align-items-start gap-3 flex-wrap justify-content-between">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <strong style={{ fontSize: '0.92rem' }}>{review.users?.full_name || 'Anonymous'}</strong>
                          <span className="text-muted-custom" style={{ fontSize: '0.8rem' }}>on</span>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--brand-orange)' }}>{review.properties?.title}</strong>
                          {review.is_flagged && (
                            <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1"
                              style={{ background: 'rgba(231,76,60,0.15)', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700 }}>
                              <Flag size={11} fill="var(--danger)" /> Flagged
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-3 mb-2">
                          <StarRating rating={review.rating} />
                          <span className="text-muted-custom" style={{ fontSize: '0.78rem' }}>
                            {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="mb-0 text-muted-custom" style={{
                          fontSize: '0.88rem', lineHeight: 1.6,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          "{review.comment}"
                        </p>
                      </div>

                      <div className="d-flex flex-column gap-2 align-items-end">
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}
                          onClick={() => setExpanded(expanded === review.review_id ? null : review.review_id)}
                        >
                          {expanded === review.review_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          &nbsp;{expanded === review.review_id ? 'Collapse' : 'Expand'}
                        </button>
                        <div className="d-flex gap-2">
                          {review.is_flagged && (
                            <button className="btn btn-success btn-sm px-3" onClick={() => handleDismissFlag(review.review_id)}>
                              <CheckCircle size={13} className="me-1" /> Dismiss
                            </button>
                          )}
                          <button className="btn btn-danger btn-sm px-3" onClick={() => setDeleteTarget(review)}>
                            <Trash2 size={13} className="me-1" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded full comment */}
                    {expanded === review.review_id && (
                      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)', padding: '1rem 1.25rem', animation: 'slideDown 0.15s ease' }}>
                        <p className="mb-0 text-muted-custom" style={{ fontSize: '0.88rem', lineHeight: 1.8 }}>
                          "{review.comment}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <PortalFooter />
        </main>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(0,0,0,0.6)', zIndex: 3000 }}>
          <div className="card p-4 border-custom bg-surface rounded-custom"
            style={{ width: '100%', maxWidth: '420px', animation: 'slideDown 0.15s ease' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 text-danger" style={{ fontFamily: 'Outfit,sans-serif' }}>Delete Review</h5>
              <button className="btn btn-close btn-close-white p-1" onClick={() => setDeleteTarget(null)} />
            </div>
            <hr className="border-custom my-2" />
            <p className="text-muted-custom mb-3" style={{ fontSize: '0.88rem' }}>
              Are you sure you want to permanently delete this review by <strong>{deleteTarget.users?.full_name}</strong>? This action cannot be undone.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={deleting} onClick={handleDeleteReview}>
                {deleting ? 'Deleting...' : 'Delete Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
}
