// src/server.js
// KTU Student Hostel Portal — Express REST API entry point

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import mapRoutes from './routes/map.js';

// Services
import { expireHolds } from './services/holdExpiryService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://ktu-hostel-system-frontend-psi.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting — protect against brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/auth', limiter);

// Body parsing — 50mb limit to handle base64 image data URLs in listing submissions
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📡 [REQ] ${req.method} ${req.url}`);
  const oldJson = res.json;
  res.json = function(data) {
    console.log(`↩️ [RES] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    if (res.statusCode >= 400) {
      console.log(`❌ [ERR]`, data);
    }
    return oldJson.apply(this, arguments);
  };
  next();
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/properties',    propertyRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/map',           mapRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'KTU Hostel Portal API' });
});

app.get('/', (req, res) => {
  res.json({ message: "KTU Hostel System API is running 🚀" });
});

// Serve frontend static files
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// SPA catch-all
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Cron: Expire holds every 5 minutes ──────────────────────────────────────
// Runs server-side regardless of page loads — implements the 24-hour hold expiry
// requirement from Section 7.2 of the project brief.
cron.schedule('*/5 * * * *', async () => {
  console.log('⏱ Running hold expiry check...');
  try {
    const expired = await expireHolds();
    if (expired > 0) console.log(`✅ Expired ${expired} hold(s)`);
  } catch (err) {
    console.error('❌ Hold expiry error:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 KTU Hostel Portal API running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
});

export default app;
