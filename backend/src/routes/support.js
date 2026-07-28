import express from 'express';
import { submitSupportRequest } from '../controllers/supportController.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

// Allow guests or authenticated users to send a support request
router.post('/', optionalAuthenticate, submitSupportRequest);

export default router;
