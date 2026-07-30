// routes/bookings.js
import express from 'express';
import {
  placeHold, respondToHold, getStudentBookings, getLandlordBookings, cancelHold
} from '../controllers/bookingController.js';
import { authenticate, requireStudent, requireLandlord } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, requireStudent, placeHold);                              // UC-S06
router.post('/:booking_id/cancel', authenticate, requireStudent, cancelHold);            // Cancel Hold
router.patch('/:booking_id/respond', authenticate, requireLandlord, respondToHold);    // UC-L04
router.get('/student/mine', authenticate, requireStudent, getStudentBookings);
router.get('/landlord/mine', authenticate, requireLandlord, getLandlordBookings);

export default router;
