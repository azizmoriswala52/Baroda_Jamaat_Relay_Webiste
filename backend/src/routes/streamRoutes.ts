import express from 'express';
import fs from 'fs';
import path from 'path';
import { getAllStreams, getActiveStream, createStream, updateStream, deleteStream, getStreamAccess, renewStreamAccess } from '../controllers/streamController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';
import { validateStreamToken } from '../middlewares/proxyMiddleware';
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

// Serve HLS chunks directly from the disk for ultra-fast, secure playback
router.get('/play/:token/:file', validateStreamToken, (req, res) => {
  const originUrl = (req as any).proxyTargetUrl;
  if (!originUrl) return res.status(400).send('Invalid origin');

  // originUrl is like http://10.63.143.115:8000/live/Aziz123.flv or /live/Aziz123/index.m3u8
  // Extract the stream name "Aziz123"
  const urlObj = new URL(originUrl.startsWith('http') ? originUrl : `http://localhost${originUrl}`);
  let streamPath = urlObj.pathname; // /live/Aziz123.flv
  
  if (streamPath.includes('.')) {
    streamPath = streamPath.substring(0, streamPath.lastIndexOf('.')); // /live/Aziz123
  }
  if (streamPath.endsWith('/index')) {
    streamPath = streamPath.substring(0, streamPath.length - 6); // /live/Aziz123
  }

  // The requested file (index.m3u8 or index0.ts)
  const requestedFile = req.params.file as string;
  
  const absoluteFilePath = path.join(__dirname, '../../media', streamPath, requestedFile);

  if (!fs.existsSync(absoluteFilePath)) {
    return res.status(404).send('Chunk not found');
  }

  // Set proper headers for HLS
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (requestedFile.endsWith('.m3u8')) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
  } else if (requestedFile.endsWith('.ts')) {
    res.setHeader('Content-Type', 'video/MP2T');
  }

  res.sendFile(absoluteFilePath);
});

// Admin only routes
router.post('/', authMiddleware, adminMiddleware, createStream);
router.put('/:id', authMiddleware, adminMiddleware, updateStream);
router.delete('/:id', authMiddleware, adminMiddleware, deleteStream);

export default router;
