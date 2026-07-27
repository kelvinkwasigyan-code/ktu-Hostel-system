// backend/src/services/auditLogger.js
import supabase from '../config/supabase.js';

/**
 * Inserts an audit log entry into the `audit_logs` table.
 *
 * @param {Object} params
 * @param {string|number} [params.userId] - User ID performing action
 * @param {string} params.action - Action name (e.g., 'RESERVATION_CANCELLED', 'ROLE_CHANGED')
 * @param {string} params.targetResource - Target entity name (e.g., 'reservations', 'users')
 * @param {string|number} [params.targetId] - Target entity ID
 * @param {Object} [params.details] - Additional contextual details
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
    const { data, error } = await supabase.from('audit_logs').insert([{
      user_id: userId,
      action,
      target_resource: targetResource,
      target_id: targetId ? String(targetId) : null,
      details: details || {},
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    }]);

    if (error) {
      console.warn('Audit log insert warning:', error.message || error);
    }
    return data;
  } catch (err) {
    console.error('Audit logger error:', err.message || err);
    return null;
  }
}

export default logAuditEvent;
