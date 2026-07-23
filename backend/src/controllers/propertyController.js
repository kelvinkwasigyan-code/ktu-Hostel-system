// controllers/propertyController.js
// Handles all property listing operations.
// UC-L02: Create Listing, UC-L03: Manage Availability, UC-L05: Dashboard Analytics
// UC-S03: Search & Filter, UC-S04: View Property Profile

import { supabaseAdmin } from '../config/supabase.js';
import { notifyUser } from './notificationController.js';
import { getDistanceFromCampus } from '../services/googleMapsService.js';

// Helper to parse or construct room rates array
export const parseRoomRates = (room_rates, fallbackRoomType, fallbackPrice, fallbackOccupancy) => {
  if (room_rates) {
    if (typeof room_rates === 'string') {
      try {
        const parsed = JSON.parse(room_rates);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    } else if (Array.isArray(room_rates) && room_rates.length > 0) {
      return room_rates;
    }
  }
  return [
    {
      room_type: fallbackRoomType || 'Single',
      price_per_semester: parseFloat(fallbackPrice || 0),
      max_occupancy: parseInt(fallbackOccupancy || 1)
    }
  ];
};

// Helper to parse or construct payment contact object
export const parsePaymentContact = (payment_contact_info, fallbackPhone) => {
  if (payment_contact_info) {
    if (typeof payment_contact_info === 'string') {
      try {
        const parsed = JSON.parse(payment_contact_info);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    } else if (typeof payment_contact_info === 'object') {
      return payment_contact_info;
    }
  }
  return {
    phone: fallbackPhone || '',
    momo_number: '',
    momo_name: '',
    payment_instructions: ''
  };
};

// ─── UC-L02: Create Property Listing ─────────────────────────────────────────
export const createProperty = async (req, res) => {
  try {
    // Landlord must be verified before listing
    if (req.user.role !== 'Landlord') {
      return res.status(403).json({ error: 'Only landlords can create listings.' });
    }

    const { data: landlord } = await supabaseAdmin
      .from('users')
      .select('verification_status, phone, full_name')
      .eq('user_id', req.user.user_id)
      .single();

    if (landlord?.verification_status !== 'Approved') {
      return res.status(403).json({
        error: 'Your account must be verified by an admin before you can list properties.'
      });
    }

    const {
      title, address, latitude, longitude, description,
      price_per_semester, room_type, max_occupancy, amenities, neighborhood, room_rates,
      gender_policy,
      payment_phone, momo_number, momo_name, payment_instructions, payment_contact_info
    } = req.body;

    const formattedRates = parseRoomRates(room_rates, room_type, price_per_semester, max_occupancy);
    const minPrice = Math.min(...formattedRates.map(r => r.price_per_semester || 0));
    const maxOcc = Math.max(...formattedRates.map(r => r.max_occupancy || 1));
    
    // Ensure primaryRoomType strictly matches DB CHECK constraint ('Single', 'Shared', 'Self-contained', 'Apartment')
    const ALLOWED_TYPES = ['Single', 'Shared', 'Self-contained', 'Apartment'];
    const primaryRoomType = ALLOWED_TYPES.includes(formattedRates[0]?.room_type)
      ? formattedRates[0]?.room_type
      : (ALLOWED_TYPES.includes(room_type) ? room_type : 'Single');

    const ALLOWED_GENDER_POLICIES = ['Mixed', 'Boys only', 'Girls only'];
    const safeGenderPolicy = ALLOWED_GENDER_POLICIES.includes(gender_policy) ? gender_policy : 'Mixed';

    const paymentContactObj = parsePaymentContact(payment_contact_info, landlord?.phone);
    if (payment_phone) paymentContactObj.phone = payment_phone;
    if (momo_number) paymentContactObj.momo_number = momo_number;
    if (momo_name) paymentContactObj.momo_name = momo_name || landlord?.full_name || '';
    if (payment_instructions) paymentContactObj.payment_instructions = payment_instructions;

    // Calculate distance from KTU campus using Distance Matrix API (UC-L02)
    let distance_from_campus_km = null;
    try {
      distance_from_campus_km = await getDistanceFromCampus(
        parseFloat(latitude), parseFloat(longitude)
      );
    } catch (e) {
      console.warn('Distance API unavailable, skipping:', e.message);
    }

    const insertPayload = {
      landlord_id: req.user.user_id,
      title, address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description,
      price_per_semester: minPrice || parseFloat(price_per_semester),
      room_type: primaryRoomType,
      max_occupancy: maxOcc || parseInt(max_occupancy),
      room_rates: JSON.stringify(formattedRates),
      payment_contact_info: JSON.stringify(paymentContactObj),
      amenities: typeof amenities === 'string' ? amenities : JSON.stringify(amenities),
      neighborhood,
      gender_policy: safeGenderPolicy,
      distance_from_campus_km,
      availability_status: 'Available',
      verification_status: 'Pending' // admin must approve before it's visible
    };

    let { data: property, error } = await supabaseAdmin
      .from('properties')
      .insert(insertPayload)
      .select()
      .single();

    // Fallback if remote Supabase schema does not have room_rates or payment_contact_info columns
    if (error) {
      console.warn('Property creation note, retrying insert without new JSON columns:', error.message || error);
      const fallbackPayload = { ...insertPayload };
      delete fallbackPayload.room_rates;
      delete fallbackPayload.payment_contact_info;
      const fallbackRes = await supabaseAdmin
        .from('properties')
        .insert(fallbackPayload)
        .select()
        .single();
      property = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error || !property) {
      console.error('Create property error details:', error);
      return res.status(500).json({ error: error?.message || 'Failed to create listing.' });
    }

    // Save property images (Supabase Storage URLs from frontend)
    const allImageUrls = [
      ...(req.body.image_urls || []),
      ...(req.body.image_data_urls || [])
    ].slice(0, 5); // max 5 images

    if (allImageUrls.length > 0) {
      const images = allImageUrls.map((url, idx) => ({
        property_id: property.property_id,
        image_path: url,
        display_order: idx
      }));

      const { error: imgError } = await supabaseAdmin.from('property_images').insert(images);
      if (imgError) {
        // If inserting fails (e.g. VARCHAR too small for base64), log and continue
        console.warn('property_images insert warning:', imgError.message || imgError);
      }
    }

    // Notify all admins of new listing requiring approval (UC-A02)
    const { data: admins } = await supabaseAdmin
      .from('users').select('user_id').eq('role', 'Admin');
    for (const admin of admins || []) {
      await notifyUser(admin.user_id, 'System',
        `New property listing pending approval: "${title}" by ${req.user.full_name}`,
        property.property_id, null, 'InApp');
    }

    res.status(201).json({
      message: 'Listing submitted for admin approval.',
      property
    });
  } catch (err) {
    console.error('createProperty error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-L02b: Update / Edit Property Listing ─────────────────────────────────
export const updateProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Verify ownership
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('properties')
      .select('property_id, landlord_id, verification_status')
      .eq('property_id', propertyId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    if (existing.landlord_id !== req.user.user_id) {
      return res.status(403).json({ error: 'You can only edit your own listings.' });
    }

    const {
      title, address, latitude, longitude, description,
      price_per_semester, room_type, max_occupancy, amenities, neighborhood, room_rates,
      gender_policy,
      payment_phone, momo_number, momo_name, payment_instructions, payment_contact_info,
      image_urls, image_data_urls
    } = req.body;

    const formattedRates = parseRoomRates(room_rates, room_type, price_per_semester, max_occupancy);
    const minPrice = Math.min(...formattedRates.map(r => r.price_per_semester || 0));
    const maxOcc   = Math.max(...formattedRates.map(r => r.max_occupancy || 1));
    const ALLOWED  = ['Single', 'Shared', 'Self-contained', 'Apartment'];
    const primaryRoomType = ALLOWED.includes(formattedRates[0]?.room_type)
      ? formattedRates[0].room_type
      : (ALLOWED.includes(room_type) ? room_type : 'Single');

    const ALLOWED_GENDER_POLICIES = ['Mixed', 'Boys only', 'Girls only'];
    const safeGenderPolicy = ALLOWED_GENDER_POLICIES.includes(gender_policy) ? gender_policy : 'Mixed';

    const { data: landlord } = await supabaseAdmin
      .from('users')
      .select('phone, full_name')
      .eq('user_id', req.user.user_id)
      .single();

    const paymentContactObj = parsePaymentContact(payment_contact_info, landlord?.phone);
    if (payment_phone) paymentContactObj.phone = payment_phone;
    if (momo_number) paymentContactObj.momo_number = momo_number;
    if (momo_name) paymentContactObj.momo_name = momo_name || landlord?.full_name || '';
    if (payment_instructions) paymentContactObj.payment_instructions = payment_instructions;

    // Recalculate distance if coords changed
    let distance_from_campus_km = null;
    try {
      const { getDistanceFromCampus } = await import('../services/googleMapsService.js');
      distance_from_campus_km = await getDistanceFromCampus(
        parseFloat(latitude), parseFloat(longitude)
      );
    } catch (e) {
      console.warn('Distance API unavailable:', e.message);
    }

    // Build update payload — always include core fields
    const corePayload = {
      title, address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description,
      price_per_semester: minPrice || parseFloat(price_per_semester),
      room_type: primaryRoomType,
      max_occupancy: maxOcc || parseInt(max_occupancy),
      amenities: typeof amenities === 'string' ? amenities : JSON.stringify(amenities),
      neighborhood,
      gender_policy: safeGenderPolicy,
      distance_from_campus_km,
      verification_status: 'Pending'
    };

    // Optional columns — only include if they exist in DB (added via migration)
    const fullPayload = {
      ...corePayload,
      room_rates: JSON.stringify(formattedRates),
      payment_contact_info: JSON.stringify(paymentContactObj)
    };

    // Try full payload first; if schema cache error (PGRST204), fall back to core only
    let { data: updated, error: updateErr } = await supabaseAdmin
      .from('properties')
      .update(fullPayload)
      .eq('property_id', propertyId)
      .select()
      .single();

    if (updateErr) {
      console.warn('Optional columns not in schema cache or database — retrying with core fields only:', updateErr.message || updateErr);
      const fallback = await supabaseAdmin
        .from('properties')
        .update(corePayload)
        .eq('property_id', propertyId)
        .select()
        .single();
      updated = fallback.data;
      updateErr = fallback.error;
    }

    if (updateErr) {
      console.error('Update property error:', updateErr);
      return res.status(500).json({ error: updateErr.message || 'Failed to update listing.' });
    }

    // Replace images if provided
    const allNewImages = [...(image_urls || []), ...(image_data_urls || [])].slice(0, 5);
    if (allNewImages.length > 0) {
      // Delete old images first
      await supabaseAdmin.from('property_images').delete().eq('property_id', propertyId);
      const newImages = allNewImages.map((url, idx) => ({
        property_id: propertyId,
        image_path: url,
        display_order: idx
      }));
      const { error: imgErr } = await supabaseAdmin.from('property_images').insert(newImages);
      if (imgErr) console.warn('Image update warning:', imgErr.message);
    }

    // Notify admins of the update
    const { data: admins } = await supabaseAdmin.from('users').select('user_id').eq('role', 'Admin');
    for (const admin of admins || []) {
      await notifyUser(admin.user_id, 'System',
        `Listing updated and requires re-approval: "${title}" by ${req.user.full_name}`,
        parseInt(propertyId), null, 'InApp');
    }

    res.json({ message: 'Listing updated and re-submitted for admin review.', property: updated });
  } catch (err) {
    console.error('updateProperty error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-S03: Search & Filter Listings ────────────────────────────────────────
export const searchProperties = async (req, res) => {
  try {
    const {
      neighborhood, room_type, gender_policy,
      min_price, max_price,
      max_distance, page = 1, limit = 12
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from('properties')
      .select(`
        *,
        property_images (image_path, display_order),
        users!landlord_id (full_name, verification_status, is_active)
      `, { count: 'exact' })
      .eq('verification_status', 'Approved')    // UC-7.5: listing visibility gate
      .eq('availability_status', 'Available')
      .eq('users.verification_status', 'Approved') // UC-7.5: verified landlord only
      .eq('users.is_active', true);

    if (neighborhood)  query = query.ilike('neighborhood', `%${neighborhood}%`);
    if (room_type)     query = query.eq('room_type', room_type);
    if (gender_policy) query = query.eq('gender_policy', gender_policy);
    if (min_price)     query = query.gte('price_per_semester', parseFloat(min_price));
    if (max_price)     query = query.lte('price_per_semester', parseFloat(max_price));
    if (max_distance)  query = query.lte('distance_from_campus_km', parseFloat(max_distance));

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Search failed.' });
    }

    // Attach average rating to each property
    const propertyIds = data.map(p => p.property_id);
    let ratingsMap = {};
    if (propertyIds.length > 0) {
      const { data: reviews } = await supabaseAdmin
        .from('reviews')
        .select('property_id, rating')
        .in('property_id', propertyIds)
        .eq('is_flagged', false);

      reviews?.forEach(r => {
        if (!ratingsMap[r.property_id]) ratingsMap[r.property_id] = [];
        ratingsMap[r.property_id].push(r.rating);
      });
    }

    const properties = data.map(p => ({
      ...p,
      room_rates: parseRoomRates(p.room_rates, p.room_type, p.price_per_semester, p.max_occupancy),
      payment_contact_info: parsePaymentContact(p.payment_contact_info, null),
      avg_rating: ratingsMap[p.property_id]?.length
        ? (ratingsMap[p.property_id].reduce((a, b) => a + b, 0) / ratingsMap[p.property_id].length).toFixed(1)
        : null,
      review_count: ratingsMap[p.property_id]?.length || 0
    }));

    res.json({
      properties,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / parseInt(limit))
    });
  } catch (err) {
    console.error('searchProperties error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-S04: View Property Profile ───────────────────────────────────────────
export const getPropertyDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        property_images (image_path, display_order),
        users!landlord_id (full_name, verification_status, is_active)
      `)
      .eq('property_id', id)
      .single();

    if (error || !property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Gate: Only approved properties from active, verified landlords are publicly visible
    // UC-7.5 — still check even on direct URL access
    const isPubliclyVisible =
      property.verification_status === 'Approved' &&
      property.users?.verification_status === 'Approved' &&
      property.users?.is_active;

    if (!isPubliclyVisible) {
      // Landlord can still see their own pending listing
      if (!req.user || req.user.user_id !== property.landlord_id) {
        return res.status(404).json({ error: 'Property not found.' });
      }
    }

    // Fetch reviews (visible reviews only — not flagged)
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('*, users!student_id (full_name)')
      .eq('property_id', id)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false });

    const avgRating = reviews?.length
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    // UC-7.4: NEVER expose landlord contact on public listing
    // Contact is only revealed after booking approval (see bookingController)
    const { ...safeProperty } = property;
    delete safeProperty.users; // strip full landlord object

    const parsedRates = parseRoomRates(property.room_rates, property.room_type, property.price_per_semester, property.max_occupancy);
    const parsedPaymentContact = parsePaymentContact(property.payment_contact_info, null);

    res.json({
      property: {
        ...safeProperty,
        room_rates: parsedRates,
        payment_contact_info: parsedPaymentContact,
        landlord_name: property.users?.full_name,
        avg_rating: avgRating,
        review_count: reviews?.length || 0
      },
      reviews: reviews || []
    });
  } catch (err) {
    console.error('getPropertyDetail error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-L03: Toggle Availability ─────────────────────────────────────────────
export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability_status } = req.body;

    if (!['Available', 'Occupied'].includes(availability_status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Available or Occupied.' });
    }

    // Confirm the landlord owns this property
    const { data: prop } = await supabaseAdmin
      .from('properties')
      .select('landlord_id, title, neighborhood, price_per_semester, room_type')
      .eq('property_id', id)
      .single();

    if (!prop || prop.landlord_id !== req.user.user_id) {
      return res.status(403).json({ error: 'You do not own this property.' });
    }

    const { error } = await supabaseAdmin
      .from('properties')
      .update({ availability_status })
      .eq('property_id', id);

    if (error) return res.status(500).json({ error: 'Update failed.' });

    // UC-S08: If flipped to Available, trigger vacancy alerts for matching students
    if (availability_status === 'Available') {
      triggerVacancyAlerts(id, prop);
    }

    res.json({ message: `Property status updated to ${availability_status}.` });
  } catch (err) {
    console.error('updateAvailability error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-S08: Trigger vacancy alerts for opted-in students ────────────────────
const triggerVacancyAlerts = async (propertyId, prop) => {
  try {
    const { data: alerts } = await supabaseAdmin
      .from('vacancy_alerts')
      .select('*, users!student_id (user_id)')
      .eq('is_active', true);

    for (const alert of alerts || []) {
      const matches =
        (!alert.neighborhood || prop.neighborhood?.toLowerCase().includes(alert.neighborhood.toLowerCase())) &&
        (!alert.max_price || prop.price_per_semester <= alert.max_price) &&
        (!alert.room_type || prop.room_type === alert.room_type);

      if (matches) {
        await notifyUser(
          alert.student_id,
          'VacancyAlert',
          `A property matching your alert is now available: "${prop.title}" in ${prop.neighborhood} — GHS ${prop.price_per_semester}/semester.`,
          propertyId, null, 'InApp'
        );
      }
    }
  } catch (err) {
    console.error('triggerVacancyAlerts error:', err);
  }
};

// ─── UC-L05: Landlord Dashboard Analytics ────────────────────────────────────
export const getLandlordDashboard = async (req, res) => {
  try {
    const landlordId = req.user.user_id;

    // 1. Fetch properties owned by this landlord
    const { data: properties, error: propertiesError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('landlord_id', landlordId);

    if (propertiesError) {
      console.error('getLandlordDashboard propertiesError:', propertiesError);
      return res.status(500).json({ error: 'Failed to fetch properties.' });
    }

    const propertyList = properties || [];
    const propertyIds = propertyList.map(p => p.property_id);

    let bookingsList = [];
    let reviewsList = [];

    if (propertyIds.length > 0) {
      // 2. Fetch bookings for these properties
      const { data: bookings, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select('*, properties!property_id (title, landlord_id)')
        .in('property_id', propertyIds);

      if (bookingsError) {
        console.error('getLandlordDashboard bookingsError:', bookingsError);
      } else {
        bookingsList = bookings || [];
      }

      // 3. Fetch reviews for these properties
      const { data: reviews, error: reviewsError } = await supabaseAdmin
        .from('reviews')
        .select('rating, property_id')
        .in('property_id', propertyIds)
        .eq('is_flagged', false);

      if (reviewsError) {
        console.error('getLandlordDashboard reviewsError:', reviewsError);
      } else {
        reviewsList = reviews || [];
      }
    }

    const stats = {
      total_listings: propertyList.length,
      approved_listings: propertyList.filter(p => p.verification_status === 'Approved').length,
      pending_listings: propertyList.filter(p => p.verification_status === 'Pending').length,
      available_rooms: propertyList.filter(p => p.availability_status === 'Available').length,
      occupied_rooms: propertyList.filter(p => p.availability_status === 'Occupied').length,
      pending_bookings: bookingsList.filter(b => b.status === 'Pending').length,
      total_reviews: reviewsList.length,
      avg_rating: reviewsList.length
        ? (reviewsList.reduce((a, r) => a + r.rating, 0) / reviewsList.length).toFixed(1)
        : null
    };

    res.json({ stats, properties: propertyList, recent_bookings: bookingsList.slice(0, 10) });
  } catch (err) {
    console.error('getLandlordDashboard error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET: All approved properties for map view (UC-S05) ─────────────────────
export const getMapProperties = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select(`
        property_id, title, address, latitude, longitude,
        price_per_semester, room_type, neighborhood,
        distance_from_campus_km, availability_status,
        property_images (image_path, display_order)
      `)
      .eq('verification_status', 'Approved')
      .eq('availability_status', 'Available');

    if (error) return res.status(500).json({ error: 'Failed to load map data.' });

    res.json({ properties: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── GET: Landlord's own listings ─────────────────────────────────────────────
export const getMyProperties = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*, property_images (image_path, display_order)')
      .eq('landlord_id', req.user.user_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch properties.' });

    res.json({ properties: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// ─── UC-S08: Vacancy Alerts Opt-in & Management ──────────────────────────────
export const createVacancyAlert = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    const { neighborhood, max_price, room_type, max_distance } = req.body;

    const { data, error } = await supabaseAdmin
      .from('vacancy_alerts')
      .insert({
        student_id: studentId,
        neighborhood: neighborhood || null,
        max_price: max_price ? parseFloat(max_price) : null,
        room_type: room_type || null,
        max_distance: max_distance ? parseFloat(max_distance) : null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Create vacancy alert error:', error);
      return res.status(500).json({ error: 'Failed to save alert preference.' });
    }

    res.status(201).json({ message: 'Vacancy alert configured successfully.', alert: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

export const getMyVacancyAlerts = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('vacancy_alerts')
      .select('*')
      .eq('student_id', req.user.user_id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch alert preferences.' });

    res.json({ alerts: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

export const deleteVacancyAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('vacancy_alerts')
      .delete()
      .eq('alert_id', id)
      .eq('student_id', req.user.user_id);

    if (error) return res.status(500).json({ error: 'Failed to delete alert preference.' });

    res.json({ message: 'Vacancy alert deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

