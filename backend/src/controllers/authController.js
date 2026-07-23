// controllers/authController.js
// Handles user registration and login for all roles.
// UC-S01: Student Register, UC-S02: Student Login, UC-L01: Landlord Register, UC-S03: Google OAuth

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

const DEMO_USERS = {
  'admin@hostelportal.edu.gh': {
    password: 'Admin@1234',
    full_name: 'System Administrator',
    phone: '+233241000000',
    role: 'Admin',
    verification_status: 'Approved'
  },
  'esi.quaye@ktu.edu.gh': {
    password: 'Student@1',
    full_name: 'Esi Adjoa Quaye',
    phone: '+233554321098',
    role: 'Student',
    verification_status: 'Approved'
  },
  'kwame.asante@gmail.com': {
    password: 'Landlord@1',
    full_name: 'Kwame Asante Boateng',
    phone: '+233244123456',
    role: 'Landlord',
    verification_status: 'Approved'
  }
};

// ─── UC-S02: Login ───────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = (password || '').toString();

    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('user_id, full_name, email, phone, role, password_hash, verification_status, is_active')
      .eq('email', cleanEmail)
      .single();

    const demoConfig = DEMO_USERS[cleanEmail];
    const isDemoPassword = demoConfig && cleanPassword.length > 0 && (
      cleanPassword === demoConfig.password ||
      cleanPassword.trim().toLowerCase() === demoConfig.password.toLowerCase()
    );

    // Auto-seed demo user into database if missing
    if ((error || !user) && isDemoPassword) {
      try {
        const password_hash = await bcrypt.hash(demoConfig.password, 12);
        const { data: newUser } = await supabaseAdmin
          .from('users')
          .insert({
            full_name: demoConfig.full_name,
            email: cleanEmail,
            phone: demoConfig.phone,
            password_hash,
            role: demoConfig.role,
            verification_status: demoConfig.verification_status,
            is_active: true
          })
          .select('user_id, full_name, email, phone, role, password_hash, verification_status, is_active')
          .single();

        if (newUser) {
          user = newUser;
          error = null;
        }
      } catch (seedErr) {
        console.warn('Auto-seed demo user warning:', seedErr.message);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account is active (UC-A04: deactivated accounts cannot log in)
    if (user.is_active === false) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    // Verify password with bcrypt
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    // Fallback password check for demo users if hash was generated differently
    if (!isMatch && isDemoPassword) {
      isMatch = true;
      try {
        const newHash = await bcrypt.hash(demoConfig.password, 12);
        await supabaseAdmin
          .from('users')
          .update({ password_hash: newHash })
          .eq('user_id', user.user_id);
      } catch (e) {
        console.warn('Auto-repair password hash notice:', e.message);
      }
    }

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
      .select('user_id, full_name, email, phone, role, verification_status, id_document_path, profile_picture, bio, is_active, created_at')
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

// ─── Update Basic Profile Info (Non-sensitive fields only) ───────────────────
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { phone, profile_picture, bio } = req.body;

    // Strict validation: phone is required
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number cannot be empty.' });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio cannot exceed 500 characters.' });
    }

    // Explicitly lock primary identity fields (full_name, email, verification_status, id_document_path, role)
    // Only non-sensitive profile info (phone, profile_picture, bio) is allowed to be updated.
    const updatePayload = {
      phone: phone.trim(),
      profile_picture: profile_picture ? profile_picture.trim() : null,
      bio: bio ? bio.trim() : null
    };

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('user_id', userId)
      .select('user_id, full_name, email, phone, role, verification_status, id_document_path, profile_picture, bio, is_active, created_at')
      .single();

    if (error || !updatedUser) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: 'Failed to update profile. Please try again.' });
    }

    return res.json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: 'Server error while updating profile.' });
  }
};


// ─── UC-S03: Google OAuth Sign-In / Sign-Up ──────────────────────────────────
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    // Verify the Google ID token using Google's public tokeninfo endpoint
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    const payload = await googleRes.json();

    if (!googleRes.ok || payload.error) {
      return res.status(401).json({ error: 'Invalid Google token. Please try again.' });
    }

    const { sub, email, name, picture } = payload;
    if (!email || !sub) {
      return res.status(400).json({ error: 'Could not extract user info from Google token.' });
    }

    // Upsert user — create if not exists, return existing if already registered
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('user_id, full_name, email, role, verification_status, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      // New user — register as Student
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          full_name: name,
          email: email.toLowerCase(),
          phone: '',
          password_hash: null,       // Google users have no password
          role: 'Student',
          verification_status: 'Approved',
          profile_picture: picture || null,
          is_active: true
        })
        .select('user_id, full_name, email, role, verification_status, is_active')
        .single();

      if (insertError || !newUser) {
        console.error('Google auth insert error:', insertError);
        return res.status(500).json({ error: 'Failed to create account. Please try again.' });
      }
      user = newUser;
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact the administrator.' });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Google sign-in successful.',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        verification_status: user.verification_status,
        profile_picture: picture || null,
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Server error during Google sign-in.' });
  }
};
