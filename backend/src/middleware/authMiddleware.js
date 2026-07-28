// backend/src/middleware/authMiddleware.js
// Proxy re-export to auth.js for compatibility with legacy import paths

export * from './auth.js';
import * as auth from './auth.js';
export default auth;
