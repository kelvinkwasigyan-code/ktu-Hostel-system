// backend/src/routes/viewingRoutes.js
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  createViewingRequest,
  getLandlordViewings,
  getStudentViewings,
  updateViewingStatus
} from '../controllers/viewingController.js';

const router = express.Router();

// Student routes
router.post('/', authenticateToken, requireRole('Student'), createViewingRequest);
router.post('/request-inspection', authenticateToken, createViewingRequest);
router.post('/request', authenticateToken, createViewingRequest);
router.get('/student', authenticateToken, requireRole('Student'), getStudentViewings);

// Landlord routes
router.get('/landlord', authenticateToken, requireRole('Landlord'), getLandlordViewings);
router.put('/:id', authenticateToken, requireRole('Landlord'), updateViewingStatus);

export default router;
