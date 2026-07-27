// routes/admin.js
import express from 'express';
import {
  verifyLandlord, moderateListing, moderateReview,
  deactivateAccount, getPendingLandlords, getPendingListings,
  getFlaggedReviews, getAnalytics, getAllUsers,
  updateUserStatus, deleteUser, dismissReviewFlag, deleteReview,
  getAuditLogs
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require Admin role
router.use(authenticate, requireAdmin);

router.get('/users', getAllUsers);                                    // UC-A04
router.get('/landlords', getPendingLandlords);                       // UC-A01
router.patch('/landlords/:user_id/verify', verifyLandlord);          // UC-A01
router.patch('/users/:user_id/deactivate', deactivateAccount);       // UC-A04 (legacy)
router.patch('/users/:user_id/status', updateUserStatus);            // UC-A04 (activate/deactivate)
router.delete('/users/:user_id', deleteUser);                        // UC-A04 (permanent delete)
router.get('/listings', getPendingListings);                          // UC-A02
router.patch('/listings/:property_id/moderate', moderateListing);    // UC-A02
router.get('/reviews', getFlaggedReviews);                           // UC-A03
router.patch('/reviews/:review_id/moderate', moderateReview);        // UC-A03 (flag/remove)
router.patch('/reviews/:review_id/flag', dismissReviewFlag);         // UC-A03 (dismiss flag)
router.delete('/reviews/:review_id', deleteReview);                  // UC-A03 (delete)
router.get('/analytics', getAnalytics);                              // UC-A05
router.get('/audit-logs', getAuditLogs);                             // Audit trail

export default router;
