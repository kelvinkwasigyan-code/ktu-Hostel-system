// controllers/adminController.js
// Administrator panel operations.
// UC-A01: Verify Landlord, UC-A02: Approve/Reject Listing, UC-A03: Moderate Reviews
// UC-A04: Deactivate Fraudulent Account, UC-A05: Platform Analytics

import { supabaseAdmin } from '../config/supabase.js';
import { notifyUser } from './notificationController.js';
import logAuditEvent from '../services/auditLogger.js';


// ─── UC-A01: Verify Landlord Identity ────────────────────────────────────────
export const verifyLandlord = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject".' });
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

    const { data: landlord, error } = await supabaseAdmin
      .from('users')
      .update({ verification_status: newStatus })
      .eq('user_id', user_id)
      .eq('role', 'Landlord')
      .select('full_name, email')
      .single();

    if (error || !landlord) {
      return res.status(404).json({ error: 'Landlord not found.' });
    }

    // Notify landlord of the verification result (UC-A01)
    const message = action === 'approve'
      ? '✅ Your landlord account has been verified and approved! You can now create property listings.'
      : `❌ Your landlord verification was rejected. ${reason ? `Reason: ${reason}` : 'Please contact support for assistance.'}`;

    await notifyUser(parseInt(user_id), 'VerificationResult', message, null, null, 'InApp');

    await logAuditEvent({
      userId: req.user?.user_id,
      action: action === 'approve' ? 'LANDLORD_VERIFIED' : 'LANDLORD_REJECTED',
      targetResource: 'users',
      targetId: user_id,
      details: { newStatus, reason, landlord_name: landlord.full_name },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent']
    });

    res.json({
      message: `Landlord "${landlord.full_name}" has been ${newStatus.toLowerCase()}.`
    });
  } catch (err) {
    console.error('verifyLandlord error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-A02: Approve/Reject Property Listing ─────────────────────────────────
export const moderateListing = async (req, res) => {
  try {
    const { property_id } = req.params;
    const { action, reason } = req.body; // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject".' });
    }

    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .update({ verification_status: newStatus })
      .eq('property_id', property_id)
      .select('title, landlord_id')
      .single();

    if (error || !property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Notify the landlord
    const message = action === 'approve'
      ? `✅ Your property listing "${property.title}" has been approved and is now visible to students.`
      : `❌ Your property listing "${property.title}" was rejected. ${reason ? `Reason: ${reason}` : 'Please review and resubmit.'}`;

    await notifyUser(property.landlord_id, 'VerificationResult', message, parseInt(property_id), null, 'InApp');

    await logAuditEvent({
      userId: req.user?.user_id,
      action: action === 'approve' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
      targetResource: 'properties',
      targetId: property_id,
      details: { newStatus, reason, title: property.title },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent']
    });

    res.json({ message: `Listing "${property.title}" has been ${newStatus.toLowerCase()}.` });
  } catch (err) {
    console.error('moderateListing error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-A03: Moderate Reviews (flag/remove) ──────────────────────────────────
export const moderateReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { action } = req.body; // 'flag' | 'remove'

    if (action === 'remove') {
      const { error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('review_id', review_id);

      if (error) return res.status(500).json({ error: 'Failed to remove review.' });
      return res.json({ message: 'Review removed.' });
    }

    if (action === 'flag') {
      const { error } = await supabaseAdmin
        .from('reviews')
        .update({ is_flagged: true })
        .eq('review_id', review_id);

      if (error) return res.status(500).json({ error: 'Failed to flag review.' });
      return res.json({ message: 'Review flagged and hidden from public view.' });
    }

    res.status(400).json({ error: 'Action must be "flag" or "remove".' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-A04: Deactivate Fraudulent Account ───────────────────────────────────
// Cascades: deactivates account + hides active listings + cancels pending bookings
export const deactivateAccount = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Prevent deactivating admin accounts
    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('role, full_name, is_active')
      .eq('user_id', user_id)
      .single();

    if (!targetUser) return res.status(404).json({ error: 'User not found.' });
    if (targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'Cannot deactivate an admin account.' });
    }

    // 1. Deactivate the user account
    await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('user_id', user_id);

    // 2. If landlord: hide all their listings
    if (targetUser.role === 'Landlord') {
      const { data: listings } = await supabaseAdmin
        .from('properties')
        .select('property_id')
        .eq('landlord_id', user_id);

      if (listings?.length) {
        const propertyIds = listings.map(p => p.property_id);

        // Reject all their pending listings
        await supabaseAdmin
          .from('properties')
          .update({ verification_status: 'Rejected', availability_status: 'Occupied' })
          .in('property_id', propertyIds);

        // Cancel all pending bookings on their properties, revert property status
        const { data: affectedBookings } = await supabaseAdmin
          .from('bookings')
          .select('booking_id, student_id, property_id, properties!property_id (title)')
          .in('property_id', propertyIds)
          .eq('status', 'Pending');

        for (const booking of affectedBookings || []) {
          await supabaseAdmin
            .from('bookings')
            .update({ status: 'Declined', resolved_at: new Date().toISOString() })
            .eq('booking_id', booking.booking_id);

          await notifyUser(
            booking.student_id,
            'BookingDeclined',
            `Your reservation hold for "${booking.properties?.title}" was cancelled because the landlord's account was deactivated.`,
            booking.property_id, booking.booking_id, 'InApp'
          );
        }
      }
    }

    // 3. If student: cancel their pending bookings and release the properties
    if (targetUser.role === 'Student') {
      const { data: pendingBookings } = await supabaseAdmin
        .from('bookings')
        .select('booking_id, property_id')
        .eq('student_id', user_id)
        .eq('status', 'Pending');

      for (const booking of pendingBookings || []) {
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'Declined', resolved_at: new Date().toISOString() })
          .eq('booking_id', booking.booking_id);

        await supabaseAdmin
          .from('properties')
          .update({ availability_status: 'Available' })
          .eq('property_id', booking.property_id);
      }
    }

    res.json({
      message: `Account for "${targetUser.full_name}" has been deactivated and all associated active listings/bookings have been cancelled.`
    });
  } catch (err) {
    console.error('deactivateAccount error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET: All pending landlords for verification queue ───────────────────────
export const getPendingLandlords = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('user_id, full_name, email, phone, verification_status, id_document_path, created_at')
      .eq('role', 'Landlord')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch landlords.' });

    res.json({ landlords: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET: Pending listings for moderation ────────────────────────────────────
export const getPendingListings = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        property_images (image_path, display_order),
        users!landlord_id (full_name, email, verification_status)
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch listings.' });

    res.json({ listings: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET: Flagged reviews for moderation ─────────────────────────────────────
export const getFlaggedReviews = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        users!student_id (full_name, email),
        properties!property_id (title)
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch reviews.' });

    res.json({ reviews: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-A05: Platform Analytics ──────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const [usersRes, propertiesRes, bookingsRes, reviewsRes] = await Promise.all([
      supabaseAdmin.from('users').select('role, is_active, verification_status, created_at'),
      supabaseAdmin.from('properties').select('verification_status, availability_status, room_type, created_at'),
      supabaseAdmin.from('bookings').select('status, created_at'),
      supabaseAdmin.from('reviews').select('rating, is_flagged, created_at')
    ]);

    const users = usersRes.data || [];
    const properties = propertiesRes.data || [];
    const bookings = bookingsRes.data || [];
    const reviews = reviewsRes.data || [];

    const analytics = {
      users: {
        total: users.length,
        students: users.filter(u => u.role === 'Student').length,
        landlords: users.filter(u => u.role === 'Landlord').length,
        active: users.filter(u => u.is_active).length,
        pending_verification: users.filter(u => u.role === 'Landlord' && u.verification_status === 'Pending').length
      },
      properties: {
        total: properties.length,
        approved: properties.filter(p => p.verification_status === 'Approved').length,
        pending: properties.filter(p => p.verification_status === 'Pending').length,
        rejected: properties.filter(p => p.verification_status === 'Rejected').length,
        available: properties.filter(p => p.availability_status === 'Available').length,
        occupied: properties.filter(p => p.availability_status === 'Occupied').length
      },
      bookings: {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'Pending').length,
        approved: bookings.filter(b => b.status === 'Approved').length,
        declined: bookings.filter(b => b.status === 'Declined').length,
        expired: bookings.filter(b => b.status === 'Expired').length
      },
      reviews: {
        total: reviews.length,
        flagged: reviews.filter(r => r.is_flagged).length,
        avg_rating: reviews.length
          ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
          : null
      }
    };

    res.json({ analytics });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET: All users (for admin management) ───────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('user_id, full_name, email, phone, role, verification_status, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch users.' });

    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-A04: Toggle user active status (activate/deactivate) ─────────────────
export const updateUserStatus = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { action } = req.body; // 'activate' | 'deactivate'

    if (!['activate', 'deactivate'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "activate" or "deactivate".' });
    }

    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('role, full_name, is_active')
      .eq('user_id', user_id)
      .single();

    if (!targetUser) return res.status(404).json({ error: 'User not found.' });
    if (targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'Cannot modify admin account status.' });
    }

    const isActive = action === 'activate';
    await supabaseAdmin
      .from('users')
      .update({ is_active: isActive })
      .eq('user_id', user_id);

    res.json({ message: `User "${targetUser.full_name}" has been ${action}d.` });
  } catch (err) {
    console.error('updateUserStatus error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-A04: Permanently delete a user account ───────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: targetUser } = await supabaseAdmin
      .from('users')
      .select('role, full_name')
      .eq('user_id', user_id)
      .single();

    if (!targetUser) return res.status(404).json({ error: 'User not found.' });
    if (targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'Cannot delete admin accounts.' });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('user_id', user_id);

    if (error) return res.status(500).json({ error: 'Failed to delete user.' });

    res.json({ message: `User "${targetUser.full_name}" deleted permanently.` });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-A03: Dismiss a review flag (unflag) ──────────────────────────────────
export const dismissReviewFlag = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { action } = req.body; // 'dismiss'

    if (action !== 'dismiss') {
      return res.status(400).json({ error: 'Action must be "dismiss".' });
    }

    const { error } = await supabaseAdmin
      .from('reviews')
      .update({ is_flagged: false })
      .eq('review_id', review_id);

    if (error) return res.status(500).json({ error: 'Failed to dismiss flag.' });

    res.json({ message: 'Flag dismissed. Review is visible again.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-A03: Delete a review permanently ─────────────────────────────────────
export const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;

    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('review_id', review_id);

    if (error) return res.status(500).json({ error: 'Failed to delete review.' });

    res.json({ message: 'Review deleted permanently.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET Audit Logs ──────────────────────────────────────────────────────────
export const getAuditLogs = async (req, res) => {
  try {
    const { action, user_id, limit = 50 } = req.query;
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (action) query = query.eq('action', action);
    if (user_id) query = query.eq('user_id', user_id);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Failed to fetch audit logs.' });
    res.json(data || []);
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

