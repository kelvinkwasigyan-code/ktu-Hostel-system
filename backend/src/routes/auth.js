// routes/auth.js
import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/authController.js';
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

// Get current user profile
router.get('/profile', authenticate, getProfile);

// Update basic profile info (non-sensitive fields: phone, profile_picture, bio)
router.put('/profile', authenticate, [
  body('phone').trim().notEmpty().withMessage('Phone number is required.'),
  body('bio').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters.')
], validate, updateProfile);

// Change password
router.put('/password', authenticate, [
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
], validate, changePassword);

export default router;
