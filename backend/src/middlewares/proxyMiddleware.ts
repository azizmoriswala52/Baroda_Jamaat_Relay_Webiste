import { Request, Response, NextFunction } from 'express';
import StreamToken from '../models/StreamToken';

// Validate token middleware
export const validateStreamToken = async (req: Request, res: Response, next: NextFunction) => {
  // Satisfy CORS preflight requests immediately
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).send('Missing token');
    }

    const streamToken = await StreamToken.findOne({ token });
    if (!streamToken) {
      return res.status(401).send('Invalid token');
    }

    if (!streamToken.isValid || streamToken.expiresAt < new Date()) {
      return res.status(401).send('Token expired or revoked');
    }

    // Attach target URL to the request object so the router can use it
    (req as any).proxyTargetUrl = streamToken.originUrl;
    next();
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).send('Server error');
  }
};
