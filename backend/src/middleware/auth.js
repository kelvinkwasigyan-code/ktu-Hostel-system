// middleware/auth.js
// JWT authentication + role-based access control middleware
// Every protected route uses these guards — enforced server-side, not just UI.

import jwt from 'jsonwebtoken';

/**
 * Verifies JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_development_secret_key_12345');
    req.user = decoded; // { user_id, email, role, full_name }
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

// Convenience guards for each role
export const requireStudent  = requireRole('Student');
export const requireLandlord = requireRole('Landlord');
export const requireAdmin    = requireRole('Admin');
export const requireLandlordOrAdmin = requireRole('Landlord', 'Admin');

/**
 * Decodes the JWT token from the Authorization header if present.
 * Does NOT throw a 401 error if the token is missing or invalid.
 */
export const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_development_secret_key_12345');
      req.user = decoded;
    } catch (err) {
      // Ignore token errors for optional authentication (e.g. expired or invalid)
    }
  }
  next();
};
