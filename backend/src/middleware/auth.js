// middleware/auth.js
// JWT authentication + role-based access control middleware
// Every protected route uses these guards — enforced server-side, not just UI.
// Uses supabase.auth.getUser() for token verification — no need to manage JWT secrets manually.

import { supabaseAdmin } from '../config/supabase.js';

/**
 * Verifies Supabase JWT token from Authorization header using Supabase's own getUser().
 * Looks up the corresponding user record from public.users table.
 * Attaches user payload to req.user.
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Let Supabase verify the JWT and extract the auth user — no secret decoding needed
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // Look up the user in our custom public.users table by email
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('user_id, email, role, full_name, verification_status')
      .eq('email', authUser.email)
      .single();

    if (dbError || !user) {
      return res.status(401).json({ error: 'User record not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed.' });
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
      const { data: { user: authUser } } = await supabaseAdmin.auth.getUser(token);
      if (authUser) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('user_id, email, role, full_name, verification_status')
          .eq('email', authUser.email)
          .single();
        
        if (user) {
          req.user = user;
        }
      }
    } catch (err) {
      // Ignore token errors for optional authentication
    }
  }
  next();
};
