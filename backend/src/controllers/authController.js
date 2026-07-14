// controllers/authController.js
// Handles user registration and login for all roles.
// UC-S01: Student Register, UC-S02: Student Login, UC-L01: Landlord Register

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { notifyUser } from './notificationController.js';

const JWT_EXPIRY = '7d';

/**
 * Generates a signed JWT for the given user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET || 'fallback_development_secret_key_12345',
    { expiresIn: JWT_EXPIRY }
  );
};

// ─── UC-S01 / UC-L01: Register ───────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    // Validate role is Student or Landlord (Admin is not self-registered)
    if (!['Student', 'Landlord'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Student or Landlord.' });
    }

    // Check email uniqueness
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password with bcrypt (12 rounds — strong but not too slow)
    const password_hash = await bcrypt.hash(password, 12);

    // Landlords start as 'Pending' verification; Students are immediately 'Approved'
    const verification_status = role === 'Landlord' ? 'Pending' : 'Approved';

    // Handle ID document upload path for landlords (stored in req.body from Supabase Storage)
    const id_document_path = req.body.id_document_path || null;

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password_hash,
        role,
        verification_status,
        id_document_path
      })
      .select('user_id, full_name, email, role, verification_status, created_at')
      .single();

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }

    // Notify admin of new landlord pending verification (UC-A01)
    if (role === 'Landlord') {
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('role', 'Admin');

      if (admins?.length) {
        for (const admin of admins) {
          await notifyUser(admin.user_id, 'System',
            `New landlord registration pending verification: ${full_name} (${email})`,
            null, null, 'InApp');
        }
      }
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      message: role === 'Landlord'
        ? 'Account created. Your landlord account is pending admin verification.'
        : 'Account created successfully. Welcome!',
      token,
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        verification_status: newUser.verification_status
      }
    });
  } catch (err) {
    console.error('Register controller error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

// ─── UC-S02: Login ───────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('user_id, full_name, email, phone, role, password_hash, verification_status, is_active')
      .eq('email', (email || '').toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account is active (UC-A04: deactivated accounts cannot log in)
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    // Return user without password hash
    const { password_hash: _, ...safeUser } = user;

    return res.json({
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login controller error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// ─── Get Current User Profile ────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('user_id, full_name, email, phone, role, verification_status, is_active, created_at')
      .eq('user_id', req.user.user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};
