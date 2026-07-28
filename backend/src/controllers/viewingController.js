// backend/src/controllers/viewingController.js
import { supabaseAdmin } from '../config/supabase.js';
import { notifyUser } from '../services/notificationService.js';

// ─── POST /api/viewings ──────────────────────────────────────────────────────
export const createViewingRequest = async (req, res) => {
  try {
    const {
      property_id, preferred_date,
      studentId, landlordId, hostelId, studentName, studentPhone, preferredDate
    } = req.body;

    const student_id = studentId || req.user?.user_id;
    const targetHostelId = hostelId || property_id;
    const targetPreferredDate = preferredDate || preferred_date;

    if (!targetHostelId || !targetPreferredDate) {
      return res.status(400).json({ error: 'Hostel ID and preferred date are required.' });
    }

    // Fetch property details to verify it exists and get landlord_id
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('property_id, title, landlord_id')
      .eq('property_id', targetHostelId)
      .single();

    const targetLandlordId = landlordId || property?.landlord_id;

    // Fetch student info if name/phone missing
    let finalStudentName = studentName;
    let finalStudentPhone = studentPhone;
    if (!finalStudentName || !finalStudentPhone) {
      const { data: student } = await supabaseAdmin
        .from('users')
        .select('full_name, phone')
        .eq('user_id', student_id)
        .single();
      if (!finalStudentName) finalStudentName = student?.full_name || req.user?.full_name || 'Student';
      if (!finalStudentPhone) finalStudentPhone = student?.phone || req.user?.phone || '';
    }

    // Insert viewing request matching inspection_requests table structure
    const { data: request, error: insertErr } = await supabaseAdmin
      .from('viewing_requests')
      .insert({
        student_id,
        landlord_id: targetLandlordId,
        hostel_id: targetHostelId,
        student_name: finalStudentName,
        student_phone: finalStudentPhone,
        preferred_date: targetPreferredDate,
        status: 'pending'
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error creating viewing request:', insertErr);
      return res.status(500).json({ success: false, error: 'Could not create viewing request.' });
    }

    // 2. MOCK NOTIFICATION / SMS LOG
    console.log(`[INSPECTION REQUEST] New site inspection request for Landlord (${targetLandlordId}) from ${finalStudentName} (${finalStudentPhone}) for date: ${targetPreferredDate}`);

    // Notify Landlord
    if (targetLandlordId) {
      await notifyUser(
        targetLandlordId,
        'ViewingRequest',
        `📅 New site inspection request from ${finalStudentName} (${finalStudentPhone}) for date: ${targetPreferredDate}.`,
        targetHostelId,
        null,
        'InApp'
      );
    }

    res.status(200).json({
      success: true,
      message: 'Inspection request submitted successfully! The landlord has been notified.',
      request,
      data: request
    });
  } catch (err) {
    console.error('createViewingRequest error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET /api/viewings/landlord ──────────────────────────────────────────────
export const getLandlordViewings = async (req, res) => {
  try {
    const landlord_id = req.user.user_id;

    // Get properties owned by landlord first
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select('property_id')
      .eq('landlord_id', landlord_id);

    const propertyIds = (properties || []).map(p => p.property_id);

    if (propertyIds.length === 0) {
      return res.json({ requests: [] });
    }

    let { data: requests, error } = await supabaseAdmin
      .from('viewing_requests')
      .select(`
        *,
        properties:hostel_id (property_id, title, address, neighborhood),
        users:student_id (user_id, full_name, email, phone)
      `)
      .eq('landlord_id', landlord_id)
      .order('created_at', { ascending: false });

    // Fallback query if landlord_id column wasn't set on older records
    if (!requests || requests.length === 0) {
      const fallback = await supabaseAdmin
        .from('viewing_requests')
        .select(`
          *,
          properties:hostel_id (property_id, title, address, neighborhood),
          users:student_id (user_id, full_name, email, phone)
        `)
        .in('hostel_id', propertyIds)
        .order('created_at', { ascending: false });
      requests = fallback.data;
    }

    if (error) {
      console.error('Error fetching landlord viewings:', error);
      return res.status(500).json({ error: 'Failed to fetch viewing requests.' });
    }

    res.json({ requests: requests || [] });
  } catch (err) {
    console.error('getLandlordViewings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET /api/viewings/student ───────────────────────────────────────────────
export const getStudentViewings = async (req, res) => {
  try {
    const student_id = req.user.user_id;

    const { data: requests, error } = await supabaseAdmin
      .from('viewing_requests')
      .select(`
        *,
        properties:hostel_id (property_id, title, address, neighborhood, payment_contact_info)
      `)
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student viewings:', error);
      return res.status(500).json({ error: 'Failed to fetch viewing requests.' });
    }

    res.json({ requests: requests || [] });
  } catch (err) {
    console.error('getStudentViewings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── PUT /api/viewings/:id ───────────────────────────────────────────────────
export const updateViewingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved', 'completed', 'rejected'

    if (!['approved', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved, completed, or rejected.' });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('viewing_requests')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        properties:hostel_id (title)
      `)
      .single();

    if (error || !updated) {
      return res.status(404).json({ error: 'Viewing request not found or failed to update.' });
    }

    // Notify Student
    const statusEmoji = status === 'approved' ? '✅' : status === 'completed' ? '🎉' : '❌';
    await notifyUser(
      updated.student_id,
      'ViewingStatusUpdate',
      `${statusEmoji} Your viewing request for "${updated.properties?.title}" on ${updated.preferred_date} was ${status}.`,
      updated.hostel_id,
      null,
      'InApp'
    );

    res.json({
      message: `Viewing request ${status}.`,
      request: updated
    });
  } catch (err) {
    console.error('updateViewingStatus error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};
