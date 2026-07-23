// routes/auth.js
import express from 'express';
import { register, login, getProfile, updateProfile, googleAuth } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// UC-S01 / UC-L01: Register
router.post('/register', [
  body('full_name').trim().notEmpty().withMessage('Full name is required.'),
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required.'),
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').isIn(['Student', 'Landlord']).withMessage('Role must be Student or Landlord.')
], validate, register);

// UC-S02: Login
router.post('/login', [
  body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.')
], validate, login);

// UC-S03: Google OAuth Sign-In / Register
router.post('/google', googleAuth);

// Get current user profile
router.get('/profile', authenticate, getProfile);

// Update basic profile info (non-sensitive fields: phone, profile_picture, bio)
router.put('/profile', authenticate, [
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('bio').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters.')
], validate, updateProfile);

export default router;
