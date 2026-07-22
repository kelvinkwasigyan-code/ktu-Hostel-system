// routes/properties.js
import express from 'express';
import {
  createProperty, updateProperty, searchProperties, getPropertyDetail,
  updateAvailability, getLandlordDashboard, getMapProperties, getMyProperties,
  createVacancyAlert, getMyVacancyAlerts, deleteVacancyAlert
} from '../controllers/propertyController.js';
import { authenticate, optionalAuthenticate, requireLandlord, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// ── Specific named routes MUST come before /:id wildcard ──────────────────────

// Public routes
router.get('/search', searchProperties);                      // UC-S03
router.get('/map', getMapProperties);                         // UC-S05

// Student vacancy alert routes
router.post('/alerts', authenticate, requireStudent, createVacancyAlert);      // UC-S08
router.get('/alerts/mine', authenticate, requireStudent, getMyVacancyAlerts);  // UC-S08
router.delete('/alerts/:id', authenticate, requireStudent, deleteVacancyAlert); // UC-S08

// Landlord protected routes
router.post('/', authenticate, requireLandlord, createProperty);                    // UC-L02
router.put('/:id', authenticate, requireLandlord, updateProperty);                  // UC-L02b: Edit
router.get('/landlord/mine', authenticate, requireLandlord, getMyProperties);
router.get('/landlord/dashboard', authenticate, requireLandlord, getLandlordDashboard); // UC-L05
router.patch('/:id/availability', authenticate, requireLandlord, updateAvailability);  // UC-L03

// ── Wildcard route LAST — must not shadow specific routes above ───────────────
router.get('/:id', optionalAuthenticate, getPropertyDetail);          // UC-S04

export default router;

