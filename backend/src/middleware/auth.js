// middleware/auth.js
// JWT authentication + role-based access control middleware
// Every protected route uses these guards — enforced server-side, not just UI.

import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';

/**
 * Verifies Supabase JWT token from Authorization header.
 * Looks up the corresponding integer user_id from public.users table.
 * Attaches decoded user payload to req.user.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    
    // Look up the user in our custom public.users table
    // We can match by email since Supabase JWT contains it
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('user_id, email, role, full_name, verification_status')
      .eq('email', decoded.email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User record not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

/**
 * Role guard factory — restricts route to specific roles.
 * Usage: requireRole('Admin'), requireRole('Landlord', 'Admin')
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${roles.join(' or ')}.`
    });
  }
  next();
};

export const requireStudent  = requireRole('Student');
export const requireLandlord = requireRole('Landlord');
export const requireAdmin    = requireRole('Admin');
export const requireLandlordOrAdmin = requireRole('Landlord', 'Admin');
export const authenticateToken = authenticate;
export const verifyToken = authenticate;

/**
 * Decodes the JWT token from the Authorization header if present.
 * Does NOT throw a 401 error if the token is missing or invalid.
 */
export const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('user_id, email, role, full_name, verification_status')
        .eq('email', decoded.email)
        .single();
      
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Ignore token errors for optional authentication (e.g. expired or invalid)
    }
  }
  next();
};
