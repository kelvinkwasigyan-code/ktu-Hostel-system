// routes/reviews.js
import express from 'express';
import { submitReview, getPropertyReviews, getMyReviews } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, submitReview);         // UC-S07 (any authenticated user)
router.get('/mine', authenticate, getMyReviews);
router.get('/property/:property_id', getPropertyReviews);

export default router;
