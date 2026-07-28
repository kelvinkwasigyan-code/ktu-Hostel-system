import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = express.Router();

// POST: /api/send-otp
router.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

  try {
    // Save to Supabase (using supabaseAdmin mock)
    await supabaseAdmin.from('otp_verifications').insert([
      { phone_number: phoneNumber, otp_code: otpCode, expires_at: expiresAt }
    ]);

    // Send debug code back in response for testing UI
    return res.status(200).json({
      success: true,
      message: 'OTP generated',
      debugCode: otpCode // <--- Returns generated code to frontend
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST: /api/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phoneNumber, otpCode, landlordId } = req.body;

  try {
    // 1. MASTER CODE BYPASS (Solution 1)
    if (otpCode === '123456') {
      await supabaseAdmin
        .from('users') // Adapted from 'landlords' to 'users'
        .update({ is_phone_verified: true })
        .eq('user_id', landlordId); // Adapted from 'id' to 'user_id'

      return res.status(200).json({ 
        success: true, 
        message: 'Phone verified using master code!' 
      });
    }

    // 2. NORMAL DATABASE VERIFICATION (For generated OTPs)
    const { data, error } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data || error || new Date() > new Date(data.expires_at) || data.otp_code !== otpCode) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Mark as verified
    await supabaseAdmin.from('users').update({ is_phone_verified: true }).eq('user_id', landlordId);
    await supabaseAdmin.from('otp_verifications').delete().eq('id', data.id);

    return res.status(200).json({ success: true, message: 'Phone number verified!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
