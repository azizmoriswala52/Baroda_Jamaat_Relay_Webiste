import express from 'express';
import { getAllStreams, getActiveStream, createStream, updateStream, deleteStream, getStreamAccess, renewStreamAccess } from '../controllers/streamController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';
import { validateStreamToken, hlsProxy } from '../middlewares/proxyMiddleware';
import rateLimit from 'express-rate-limit';

const accessLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window` (here, per minute)
  message: { message: 'Too many stream access requests from this IP, please try again after a minute' }
});

const router = express.Router();

// Publicly accessible routes (must be logged in to view)
router.get('/active', authMiddleware, getActiveStream);
router.get('/access', authMiddleware, accessLimiter, getStreamAccess);
router.post('/access/renew', authMiddleware, renewStreamAccess);
router.get('/', authMiddleware, getAllStreams);

// Proxy stream playback (No auth middleware here, token validation handles security)
router.use('/play/:token', validateStreamToken, hlsProxy);

// Admin only routes
router.post('/', authMiddleware, adminMiddleware, createStream);
router.put('/:id', authMiddleware, adminMiddleware, updateStream);
router.delete('/:id', authMiddleware, adminMiddleware, deleteStream);

export default router;
