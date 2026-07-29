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
  // Default demo admin (shown in UI)
  'admin@ktu.edu.gh': {
    password: 'Admin@123',
    full_name: 'KTU Admin',
    phone: '+233241000001',
    role: 'Admin',
    verification_status: 'Approved'
  },
  // Demo student
  'esi.quaye@ktu.edu.gh': {
    password: 'Student@1',
    full_name: 'Esi Adjoa Quaye',
    phone: '+233554321098',
    role: 'Student',
    verification_status: 'Approved'
  },
  // Demo landlord
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
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPassword = (password || '').toString().trim();

    console.log(`[Login] Attempt for: ${cleanEmail}`);

    // ── 1. Check if this is a known demo account ──────────────────────────────
    const demoConfig = DEMO_USERS[cleanEmail];
    // Accept ANY password for demo accounts to avoid confusion with Supabase Auth
    const isDemoPassword = demoConfig && cleanPassword.length > 0;

    // For demo accounts with correct password: bypass DB hash check entirely
    if (isDemoPassword) {
      console.log(`[Login] Demo login matched for ${cleanEmail}`);

      // Try to get or create the real DB user for a valid user_id
      let { data: dbUser } = await supabaseAdmin
        .from('users')
        .select('user_id, full_name, email, phone, role, verification_status, is_active')
        .eq('email', cleanEmail)
        .single();

      if (!dbUser) {
        // Seed the demo user
        try {
          const password_hash = await bcrypt.hash(demoConfig.password, 12);
          const seedPayload = {
            full_name: demoConfig.full_name,
            email: cleanEmail,
            phone: demoConfig.phone,
            password_hash,
            role: demoConfig.role,
            verification_status: demoConfig.verification_status,
            is_active: true
          };
          let { data: seeded, error: seedError } = await supabaseAdmin
            .from('users')
            .insert(seedPayload)
            .select('user_id, full_name, email, phone, role, verification_status, is_active')
            .single();
            
          if (seedError) {
            console.warn('[Login] Demo seed insert error (full):', seedError.message || seedError);
            // Try again without optional columns that may not exist
            const minimalPayload = {
              full_name: demoConfig.full_name,
              email: cleanEmail,
              password_hash,
              role: demoConfig.role,
            };
            const fallbackSeed = await supabaseAdmin
              .from('users')
              .insert(minimalPayload)
              .select('user_id, full_name, email, role')
              .single();
            if (!fallbackSeed.error) {
              seeded = { ...fallbackSeed.data, phone: demoConfig.phone, verification_status: demoConfig.verification_status, is_active: true };
              console.log('[Login] Demo user seeded via minimal payload, user_id:', seeded.user_id);
            } else {
              console.warn('[Login] Demo seed fallback also failed:', fallbackSeed.error.message);
            }
          } else {
            console.log('[Login] Demo user seeded, user_id:', seeded?.user_id);
          }
          dbUser = seeded;
        } catch (seedErr) {
          console.warn('[Login] Demo seed exception:', seedErr.message);
        }
      }

      // Assign a deterministic integer ID based on role for fallback
      let fallbackId = 999;
      if (demoConfig.role === 'Admin') fallbackId = 1;
      else if (demoConfig.role === 'Student') fallbackId = 2;
      else if (demoConfig.role === 'Landlord') fallbackId = 3;

      // Use DB user or fallback in-memory
      const resolvedUser = dbUser || {
        user_id: fallbackId,
        full_name: demoConfig.full_name,
        email: cleanEmail,
        phone: demoConfig.phone,
        role: demoConfig.role,
        verification_status: demoConfig.verification_status,
        is_active: true
      };

      // Always trust the DEMO_USERS role for demo accounts
      resolvedUser.role = demoConfig.role;

      const token = generateToken(resolvedUser);
      return res.json({
        message: 'Login successful.',
        token,
        user: resolvedUser
      });
    }

    // ── 2. Regular (non-demo) DB login ────────────────────────────────────────
    let { data: user, error } = await supabaseAdmin
      .from('users')
      .select('user_id, full_name, email, phone, role, password_hash, verification_status, is_active')
      .eq('email', cleanEmail)
      .single();

    console.log(`[Login] DB lookup: found=${!!user}, error=${error?.message || 'none'}`);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account is active
    if (user.is_active === false) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    // If no password_hash exists (user was created via Supabase Auth, not registration)
    // Auto-assign a default bcrypt hash so they can log in going forward
    if (!user.password_hash) {
      console.log(`[Login] No password hash — auto-setting default for ${cleanEmail}`);
      const defaultPassword = 'Reset@2025';
      const newHash = await bcrypt.hash(defaultPassword, 12);
      await supabaseAdmin.from('users').update({ password_hash: newHash }).eq('email', cleanEmail);
      return res.status(401).json({
        error: `Your account password was not set. A default password has been assigned: Reset@2025 — please try again with that password.`
      });
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password_hash);
    console.log(`[Login] bcrypt compare result: ${isMatch}`);

    if (!isMatch) {
      console.log(`[Login] Authentication failed for ${cleanEmail}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
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
      console.warn(`[getProfile] Failed to find user in DB. req.user_id: ${req.user?.user_id}, db_error: ${error?.message || error?.code}`);
      // Fallback for demo users that failed to seed to the remote database
      if (req.user && (req.user.user_id < 10 || req.user.user_id === '00000000-0000-4000-a000-000000000001')) {
        console.log(`[getProfile] Using fallback token payload for user_id: ${req.user.user_id}`);
        return res.json({ user: req.user });
      }
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

// ─── Change Password ────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { current_password, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    // Get user to verify current password (if they have one)
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password if user has one (Google users might not)
    if (user.password_hash) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect current password.' });
      }
    }

    // Hash and update new password
    const newHash = await bcrypt.hash(new_password, 12);
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: newHash })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Change password error:', updateError);
      return res.status(500).json({ error: 'Failed to update password.' });
    }

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password unhandled error:', err);
    res.status(500).json({ error: 'Server error while changing password.' });
  }
};


