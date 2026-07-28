// backend/src/routes/viewingRoutes.js
import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  createViewingRequest,
  getLandlordViewings,
  getStudentViewings,
  updateViewingStatus
} from '../controllers/viewingController.js';

const router = express.Router();

// Student routes
router.post('/', authenticate, requireRole('Student'), createViewingRequest);
router.post('/request-inspection', authenticate, createViewingRequest);
router.post('/request', authenticate, createViewingRequest);
router.get('/student', authenticate, requireRole('Student'), getStudentViewings);

// Landlord routes
router.get('/landlord', authenticate, requireRole('Landlord'), getLandlordViewings);
router.put('/:id', authenticate, requireRole('Landlord'), updateViewingStatus);

export default router;
