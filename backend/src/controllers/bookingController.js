// controllers/bookingController.js
// Handles the 24-hour non-transactional reservation hold lifecycle.
// UC-S06: Place Hold, UC-L04: Respond to Hold
// Section 7.1 & 7.2: Business rules enforced here.

import { supabaseAdmin } from '../config/supabase.js';
import { notifyUser } from './notificationController.js';
import { expireHolds } from '../services/holdExpiryService.js';

// ─── UC-S06: Place 24-Hour Reservation Hold ──────────────────────────────────
export const placeHold = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { property_id } = req.body;

    // Lazy expiry check — expire stale holds before placing new one
    await expireHolds();

    // UC-7.1 Rule: Student may only have ONE active Pending hold at a time
    const { data: existingStudentHold } = await supabaseAdmin
      .from('bookings')
      .select('booking_id, properties!property_id (title)')
      .eq('student_id', studentId)
      .eq('status', 'Pending')
      .single();

    if (existingStudentHold) {
      return res.status(409).json({
        error: `You already have an active hold on "${existingStudentHold.properties?.title}". Cancel or wait for it to expire before placing another.`
      });
    }

    // UC-7.1 Rule: Property may only have ONE active Pending hold at a time
    const { data: existingPropertyHold } = await supabaseAdmin
      .from('bookings')
      .select('booking_id')
      .eq('property_id', property_id)
      .eq('status', 'Pending')
      .single();

    if (existingPropertyHold) {
      return res.status(409).json({
        error: 'This property already has an active reservation hold. Please check back later.'
      });
    }

    // Confirm property is Available and Approved
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('property_id, title, landlord_id, availability_status, verification_status')
      .eq('property_id', property_id)
      .single();

    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    if (property.availability_status !== 'Available') {
      return res.status(409).json({ error: 'This property is not currently available.' });
    }
    if (property.verification_status !== 'Approved') {
      return res.status(403).json({ error: 'This property is not approved for booking.' });
    }

    const { room_type, price_per_semester } = req.body;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

    // Insert booking record
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        student_id: studentId,
        property_id,
        selected_room_type: room_type || null,
        agreed_price: price_per_semester ? parseFloat(price_per_semester) : null,
        status: 'Pending',
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('placeHold insert error:', error);
      return res.status(500).json({ error: 'Failed to place hold. Please try again.' });
    }

    // Flip property status to Pending — blocks other students
    await supabaseAdmin
      .from('properties')
      .update({ availability_status: 'Pending' })
      .eq('property_id', property_id);

    // Notify the landlord of the booking request (UC-L04)
    const roomInfo = room_type ? ` (${room_type} Room - GHS ${price_per_semester})` : '';
    await notifyUser(
      property.landlord_id,
      'BookingRequest',
      `A student has placed a 24-hour hold on "${property.title}"${roomInfo}. Accept or decline within 24 hours.`,
      property_id,
      booking.booking_id,
      'InApp'
    );

    // Notify the student
    await notifyUser(
      studentId,
      'System',
      `Your reservation hold for "${property.title}" is active. The landlord has 24 hours to respond. Hold expires: ${expiresAt.toLocaleString('en-GB')}.`,
      property_id,
      booking.booking_id,
      'InApp'
    );

    res.status(201).json({
      message: 'Reservation hold placed successfully. Landlord has 24 hours to respond.',
      booking,
      expires_at: expiresAt
    });
  } catch (err) {
    console.error('placeHold error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-S06-Cancel: Student Cancels Reservation Hold ─────────────────────────
export const cancelHold = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { booking_id } = req.params;

    const parsedId = parseInt(booking_id, 10);
    const idToSearch = isNaN(parsedId) ? booking_id : parsedId;

    // Fetch booking record
    let { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('booking_id', idToSearch)
      .single();

    if (!booking) {
      // Fallback try string or raw ID
      const { data: altBooking } = await supabaseAdmin
        .from('bookings')
        .select('*')
        .eq('booking_id', String(booking_id))
        .single();
      booking = altBooking;
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.student_id != studentId) {
      return res.status(403).json({ error: 'You are not authorized to cancel this booking.' });
    }

    if (booking.status !== 'Pending' && booking.status !== 'Approved') {
      return res.status(409).json({ error: `Cannot cancel a booking that is already ${booking.status}.` });
    }

    // Fetch property record
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('property_id', booking.property_id)
      .single();

    const now = new Date().toISOString();

    // 1. Update booking status to 'Cancelled' (with fallback to 'Declined' if DB check constraint is restrictive)
    let { error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'Cancelled', resolved_at: now })
      .eq('booking_id', booking.booking_id);

    if (updateErr) {
      console.warn('cancelHold: DB check constraint error for status Cancelled, falling back to Declined:', updateErr.message || updateErr);
      const fallbackRes = await supabaseAdmin
        .from('bookings')
        .update({ status: 'Declined', resolved_at: now })
        .eq('booking_id', booking.booking_id);
      updateErr = fallbackRes.error;
    }

    if (updateErr) {
      console.error('cancelHold update error:', updateErr);
      return res.status(500).json({ error: 'Failed to cancel reservation hold.' });
    }

    // 2. Restore property availability
    const currentRooms = property?.rooms_available !== undefined ? property.rooms_available : 0;
    const newRooms = booking.status === 'Approved' ? currentRooms + 1 : currentRooms;
    
    await supabaseAdmin
      .from('properties')
      .update({
        availability_status: 'Available',
        ...(booking.status === 'Approved' ? { rooms_available: newRooms } : {})
      })
      .eq('property_id', booking.property_id);

    // 3. Notify Landlord
    if (property?.landlord_id) {
      await notifyUser(
        property.landlord_id,
        'BookingCancelled',
        `The reservation hold on "${property.title || 'your property'}" was cancelled by the student. The property is now available for others.`,
        booking.property_id,
        parseInt(booking.booking_id, 10),
        'InApp'
      );
    }

    // 4. Notify Student
    await notifyUser(
      studentId,
      'System',
      `Your reservation hold on "${property?.title || 'the property'}" has been cancelled successfully.`,
      booking.property_id,
      parseInt(booking.booking_id, 10),
      'InApp'
    );

    res.json({
      message: 'Reservation hold cancelled successfully.',
      booking_id: parseInt(booking.booking_id, 10),
      status: 'Cancelled'
    });
  } catch (err) {
    console.error('cancelHold error:', err);
    res.status(500).json({ error: 'Server error while cancelling hold.' });
  }
};

// ─── UC-L04: Landlord Responds to Reservation Hold ───────────────────────────
export const respondToHold = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "accept" or "decline".' });
    }

    // Fetch booking and verify landlord ownership
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        properties!property_id (property_id, title, landlord_id, phone, rooms_available),
        users!student_id (user_id, full_name)
      `)
      .eq('booking_id', booking_id)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Security: only the landlord who owns the property can respond
    if (booking.properties?.landlord_id !== req.user.user_id) {
      return res.status(403).json({ error: 'You do not own the property for this booking.' });
    }

    if (booking.status !== 'Pending') {
      return res.status(409).json({ error: `Booking is already ${booking.status}.` });
    }

    // Check hold hasn't expired
    if (new Date() > new Date(booking.expires_at)) {
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Expired' })
        .eq('booking_id', booking_id);
      await supabaseAdmin
        .from('properties')
        .update({ availability_status: 'Available' })
        .eq('property_id', booking.property_id);
      return res.status(409).json({ error: 'This hold has expired.' });
    }

    const now = new Date().toISOString();

    if (action === 'accept') {
      // Accept: set booking Approved, decrement rooms_available
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Approved', resolved_at: now })
        .eq('booking_id', booking_id);

      const currentRooms = booking.properties?.rooms_available !== undefined ? booking.properties.rooms_available : 1;
      const newRooms = Math.max(0, currentRooms - 1);
      
      const propertyUpdate = { rooms_available: newRooms };
      if (newRooms === 0) {
        propertyUpdate.availability_status = 'Occupied';
      }

      await supabaseAdmin
        .from('properties')
        .update(propertyUpdate)
        .eq('property_id', booking.property_id);

      // UC-7.4: Only NOW release landlord contact to student (never on public page)
      const { data: landlord } = await supabaseAdmin
        .from('users')
        .select('full_name, phone, email')
        .eq('user_id', req.user.user_id)
        .single();

      await notifyUser(
        booking.student_id,
        'BookingAccepted',
        `🎉 Your reservation hold for "${booking.properties?.title}" has been accepted! Landlord contact: ${landlord?.full_name} — ${landlord?.phone} (${landlord?.email}). Please arrange payment directly with the landlord.`,
        booking.property_id,
        parseInt(booking_id),
        'InApp'
      );

      return res.json({
        message: 'Booking accepted. Student has been notified with your contact details.',
        status: 'Approved'
      });

    } else {
      // Decline: set booking Declined, property → Available again
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'Declined', resolved_at: now })
        .eq('booking_id', booking_id);

      await supabaseAdmin
        .from('properties')
        .update({ availability_status: 'Available' })
        .eq('property_id', booking.property_id);

      await notifyUser(
        booking.student_id,
        'BookingDeclined',
        `Your reservation hold for "${booking.properties?.title}" was declined by the landlord. The property is now available for others.`,
        booking.property_id,
        parseInt(booking_id),
        'InApp'
      );

      return res.json({
        message: 'Booking declined. Property is now available again.',
        status: 'Declined'
      });
    }
  } catch (err) {
    console.error('respondToHold error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET: Student's booking history ─────────────────────────────────────────
export const getStudentBookings = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        properties!property_id (
          property_id, title, address, neighborhood, price_per_semester, room_type, payment_contact_info, landlord_id,
          users!landlord_id (full_name, phone, email),
          property_images (image_path, display_order)
        )
      `)
      .eq('student_id', req.user.user_id)
      .order('created_at', { ascending: false });

    // Fallback if remote DB is missing foreign key relations (PGRST200)
    if (error && (error.code === 'PGRST200' || error.message?.includes('relationship') || error.code === 'PGRST100')) {
      console.warn('getStudentBookings relation error, falling back to manual join:', error.message);
      const bookRes = await supabaseAdmin.from('bookings').select('*').eq('student_id', req.user.user_id).order('created_at', { ascending: false });
      if (!bookRes.error && bookRes.data) {
        const propRes = await supabaseAdmin.from('properties').select('*');
        const imgRes = await supabaseAdmin.from('property_images').select('*');
        const usrRes = await supabaseAdmin.from('users').select('*');
        
        data = bookRes.data.map(b => {
          const prop = propRes.data?.find(p => p.property_id === b.property_id) || null;
          if (prop) {
            prop.property_images = imgRes.data?.filter(img => img.property_id === prop.property_id) || [];
            prop.users = usrRes.data?.find(u => u.user_id === prop.landlord_id) || null;
          }
          return { ...b, properties: prop };
        });
        error = null;
      }
    }

    if (error) {
      console.error('getStudentBookings error:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings.' });
    }

    // Check if a review has been submitted for bookings
    const bookingIds = data.map(b => b.booking_id);
    let reviewedSet = new Set();
    if (bookingIds.length > 0) {
      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('booking_id')
        .in('booking_id', bookingIds);
      reviews?.forEach(r => reviewedSet.add(r.booking_id));
    }

    const bookings = data.map(b => {
      let paymentContact = null;
      if (b.properties?.payment_contact_info) {
        try {
          paymentContact = typeof b.properties.payment_contact_info === 'string'
            ? JSON.parse(b.properties.payment_contact_info)
            : b.properties.payment_contact_info;
        } catch (e) {}
      }

      const landlordUser = b.properties?.users || {};
      const landlordContact = {
        full_name: landlordUser.full_name || 'Landlord',
        phone: paymentContact?.phone || landlordUser.phone || '+233244123456',
        email: landlordUser.email || '',
        momo_number: paymentContact?.momo_number || landlordUser.phone || '',
        momo_name: paymentContact?.momo_name || landlordUser.full_name || '',
        payment_instructions: paymentContact?.payment_instructions || 'Contact landlord to complete room allocation and payment.'
      };

      return {
        ...b,
        landlord_contact: landlordContact,
        can_review: !reviewedSet.has(b.booking_id),
        reviewed: reviewedSet.has(b.booking_id)
      };
    });

    res.json({ bookings });
  } catch (err) {
    console.error('getStudentBookings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET: Landlord's incoming booking requests ───────────────────────────────
export const getLandlordBookings = async (req, res) => {
  try {
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select('property_id')
      .eq('landlord_id', req.user.user_id);

    if (!properties?.length) return res.json({ bookings: [] });

    const propertyIds = properties.map(p => p.property_id);

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        users!student_id (full_name, phone, email),
        properties!property_id (property_id, title, address, neighborhood)
      `)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch bookings.' });

    res.json({ bookings: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};
