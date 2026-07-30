// backend/src/services/auditLogger.js
import { supabaseAdmin } from '../config/supabase.js';
import { createMockSupabase } from '../config/mockSupabase.js';

const mockSupabase = createMockSupabase();

/**
 * Inserts an audit log entry into the `audit_logs` table.
 *
 * @param {Object} params
 * @param {string|number} [params.userId] - User ID performing action
 * @param {string} params.action - Action name (e.g., 'INSERT', 'UPDATE', 'DELETE', 'RESERVATION_CANCELLED')
 * @param {string} params.targetResource - Target entity name (e.g., 'users', 'properties', 'bookings')
 * @param {string|number} [params.targetId] - Target entity ID
 * @param {Object} [params.details] - Additional contextual details (e.g. { old_data, new_data })
 * @param {string} [params.ipAddress] - IP address of the client
 * @param {string} [params.userAgent] - User agent header
 */
export async function logAuditEvent({
  userId = null,
  action,
  targetResource,
  targetId = null,
  details = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    const payload = {
      user_id: userId ? String(userId) : null,
      action,
      target_resource: targetResource,
      target_id: targetId ? String(targetId) : null,
      details: details || {},
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: new Date().toISOString()
    };

    let { data, error } = await supabaseAdmin.from('audit_logs').insert([payload]);

    if (error) {
      console.warn('Audit log insert warning, falling back to local mock DB:', error.message || error);
      const mockRes = await mockSupabase.from('audit_logs').insert([payload]);
      data = mockRes.data;
    }
    return data;
  } catch (err) {
    console.error('Audit logger error:', err.message || err);
    try {
      const mockRes = await mockSupabase.from('audit_logs').insert([{
        user_id: userId ? String(userId) : null,
        action,
        target_resource: targetResource,
        target_id: targetId ? String(targetId) : null,
        details: details || {},
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        created_at: new Date().toISOString()
      }]);
      return mockRes.data;
    } catch {
      return null;
    }
  }
}

/**
 * Fetches audit log records with filtering, searching, and pagination support.
 *
 * @param {Object} options
 * @param {string} [options.targetResource] - Filter by resource ('users', 'properties', etc.)
 * @param {string} [options.action] - Filter by action ('INSERT', 'UPDATE', 'DELETE', 'VERIFY_LANDLORD', etc.)
 * @param {string|number} [options.userId] - Filter by user ID
 * @param {string} [options.search] - Search string within action, resource, target_id, or details
 * @param {number} [options.page=1] - Page number (1-indexed)
 * @param {number} [options.limit=50] - Number of logs per page
 */
export async function fetchAuditLogs({
  targetResource = null,
  action = null,
  userId = null,
  search = null,
  page = 1,
  limit = 50
} = {}) {
  try {
    let query = supabaseAdmin.from('audit_logs').select('*');

    if (targetResource) {
      query = query.eq('target_resource', targetResource);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (userId) {
      query = query.eq('user_id', String(userId));
    }

    let { data, error } = await query;
    
    // If error occurs on primary query (e.g. table missing in remote DB), query mock database directly
    if (error || !data) {
      console.warn('Primary DB audit query notice (falling back to mock DB):', error?.message || 'No data');
      let mockQuery = mockSupabase.from('audit_logs').select('*');
      if (targetResource) mockQuery = mockQuery.eq('target_resource', targetResource);
      if (action) mockQuery = mockQuery.eq('action', action);
      if (userId) mockQuery = mockQuery.eq('user_id', String(userId));
      const mockResult = await mockQuery;
      data = mockResult.data || [];
    }

    let logs = Array.isArray(data) ? data : [];

    // In-memory text search filtering if search query provided
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      logs = logs.filter(log => {
        const actMatch = log.action && log.action.toLowerCase().includes(s);
        const resMatch = log.target_resource && log.target_resource.toLowerCase().includes(s);
        const targetMatch = log.target_id && String(log.target_id).toLowerCase().includes(s);
        const userMatch = log.user_id && String(log.user_id).toLowerCase().includes(s);
        const detailsMatch = log.details && JSON.stringify(log.details).toLowerCase().includes(s);
        return actMatch || resMatch || targetMatch || userMatch || detailsMatch;
      });
    }

    // Sort descending by created_at
    logs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Pagination
    const totalCount = logs.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedLogs = logs.slice(startIndex, startIndex + limitNum);

    return {
      logs: paginatedLogs,
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1
    };
  } catch (err) {
    console.error('fetchAuditLogs error caught, returning safe empty result:', err);
    return {
      logs: [],
      totalCount: 0,
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.max(1, parseInt(limit, 10) || 50),
      totalPages: 1
    };
  }
}

export default logAuditEvent;
