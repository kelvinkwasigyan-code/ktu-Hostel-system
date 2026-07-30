// src/pages/admin/AuditLogsPage.jsx
import { useState, useEffect } from 'react';
import {
  FileText, Search, Filter, RefreshCw, Layers, User, Calendar,
  ChevronLeft, ChevronRight, Eye, AlertCircle, Database, CheckCircle2, X
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import PortalFooter from '../../components/PortalFooter';
import AdminSidebar from '../../components/AdminSidebar';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  // Selected Log for JSON Drawer/Modal
  const [inspectingLog, setInspectingLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, selectedResource, selectedAction]);

  const fetchLogs = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        target_resource: selectedResource || undefined,
        action: selectedAction || undefined,
        search: search.trim() || undefined
      };

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data && res.data.logs) {
        setLogs(res.data.logs);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        setLogs(res.data);
        setTotalCount(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedResource('');
    setSelectedAction('');
    setPage(1);
  };

  const getActionBadgeClass = (action) => {
    const act = (action || '').toUpperCase();
    if (act === 'INSERT') return 'badge bg-success-subtle text-success border border-success-subtle';
    if (act === 'UPDATE') return 'badge bg-primary-subtle text-primary border border-primary-subtle';
    if (act === 'DELETE') return 'badge bg-danger-subtle text-danger border border-danger-subtle';
    if (act.includes('VERIFY') || act.includes('APPROVE')) return 'badge bg-info-subtle text-info border border-info-subtle';
    if (act.includes('REJECT') || act.includes('BAN')) return 'badge bg-warning-subtle text-warning border border-warning-subtle';
    return 'badge bg-secondary-subtle text-secondary border border-secondary-subtle';
  };

  return (
    <>
      <Navbar />
      <div className="d-flex">
        <AdminSidebar />
        <main className="main-content flex-grow-1">
          <div className="container-fluid p-0">

            {/* Top Bar */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <Database className="text-primary" size={24} />
                  <h2 className="mb-0 fw-bold">Database Audit Trail</h2>
                </div>
                <p className="text-muted-custom mb-0">
                  System-level event log capturing all database entity mutations, schema triggers, and administrative actions.
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  onClick={() => fetchLogs()}
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                  <span>Refresh Logs</span>
                </button>
              </div>
            </div>

            {/* Filter Card */}
            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '12px' }}>
              <div className="card-body p-3">
                <form onSubmit={(e) => { setPage(1); fetchLogs(e); }} className="row g-2 align-items-center">

                  {/* Search Input */}
                  <div className="col-12 col-md-4">
                    <div className="input-group">
                      <span className="input-group-text bg-transparent border-end-0">
                        <Search size={16} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search action, target ID, details..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Resource Selector */}
                  <div className="col-6 col-md-3">
                    <select
                      className="form-select"
                      value={selectedResource}
                      onChange={(e) => { setSelectedResource(e.target.value); setPage(1); }}
                    >
                      <option value="">All Resources</option>
                      <option value="users">users</option>
                      <option value="properties">properties</option>
                      <option value="bookings">bookings</option>
                      <option value="reviews">reviews</option>
                      <option value="property_images">property_images</option>
                      <option value="vacancy_alerts">vacancy_alerts</option>
                    </select>
                  </div>

                  {/* Action Selector */}
                  <div className="col-6 col-md-3">
                    <select
                      className="form-select"
                      value={selectedAction}
                      onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
                    >
                      <option value="">All Actions</option>
                      <option value="INSERT">INSERT</option>
                      <option value="UPDATE">UPDATE</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  {/* Filter Submit & Reset */}
                  <div className="col-12 col-md-2 d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1">
                      Filter
                    </button>
                    {(search || selectedResource || selectedAction) && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="btn btn-light text-muted border"
                        title="Clear filters"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                </form>
              </div>
            </div>

            {/* Audit Logs Table Card */}
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <span className="fw-semibold text-dark">
                  Audit Events ({totalCount})
                </span>
                <span className="text-muted small">
                  Page {page} of {totalPages}
                </span>
              </div>

              {loading ? (
                <div className="p-5 text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted mb-0">Querying database audit logs...</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-5 text-center">
                  <AlertCircle size={40} className="text-muted mb-2 opacity-50" />
                  <h6 className="fw-bold">No Audit Log Entries Found</h6>
                  <p className="text-muted small mb-0">Try clearing filters or performing mutations in the app.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '180px' }}>Timestamp</th>
                        <th style={{ width: '120px' }}>Action</th>
                        <th style={{ width: '150px' }}>Resource</th>
                        <th style={{ width: '140px' }}>Target ID</th>
                        <th style={{ width: '140px' }}>User ID</th>
                        <th>Payload & Context</th>
                        <th style={{ width: '90px' }} className="text-end">Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div className="d-flex align-items-center gap-1 text-muted small">
                              <Calendar size={13} />
                              <span>{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                          </td>
                          <td>
                            <span className={getActionBadgeClass(log.action)}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-dark-subtle text-dark font-monospace">
                              {log.target_resource}
                            </span>
                          </td>
                          <td>
                            <code className="text-secondary small">{log.target_id || '—'}</code>
                          </td>
                          <td>
                            <span className="text-muted small d-flex align-items-center gap-1">
                              <User size={12} />
                              {log.user_id || 'System / Anonymous'}
                            </span>
                          </td>
                          <td>
                            <div className="text-truncate text-muted small" style={{ maxWidth: '320px' }}>
                              {log.details ? JSON.stringify(log.details) : 'No payload details'}
                            </div>
                          </td>
                          <td className="text-end">
                            <button
                              onClick={() => setInspectingLog(log)}
                              className="btn btn-sm btn-outline-primary"
                              title="Inspect JSON Payload"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="card-footer bg-white py-3 d-flex justify-content-between align-items-center">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="small text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}

            </div>

          </div>
          <PortalFooter />
        </main>
      </div>

      {/* JSON Payload Inspection Modal */}
      {inspectingLog && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  <h5 className="modal-title fw-bold">Audit Event Detail Inspection</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setInspectingLog(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded">
                      <div className="text-muted small">Event Action</div>
                      <div className="mt-1">
                        <span className={getActionBadgeClass(inspectingLog.action)}>
                          {inspectingLog.action}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded">
                      <div className="text-muted small">Target Resource</div>
                      <div className="fw-semibold text-dark mt-1 font-monospace">
                        {inspectingLog.target_resource} (ID: {inspectingLog.target_id || 'N/A'})
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 bg-light rounded">
                      <div className="text-muted small">Recorded Timestamp</div>
                      <div className="fw-semibold text-dark mt-1 small">
                        {new Date(inspectingLog.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">JSON Payload / Data Diff (`details`):</h6>
                <pre className="bg-dark text-light p-3 rounded font-monospace small" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {JSON.stringify(inspectingLog.details || {}, null, 2)}
                </pre>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setInspectingLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
}
