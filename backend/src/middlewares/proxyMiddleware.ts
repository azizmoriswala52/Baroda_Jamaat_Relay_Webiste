import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import StreamToken from '../models/StreamToken';

// Validate token middleware
export const validateStreamToken = async (req: Request, res: Response, next: NextFunction) => {
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

    // Attach target URL to the request object so the proxy middleware can use it
    (req as any).proxyTargetUrl = streamToken.originUrl;
    next();
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).send('Server error');
  }
};

// The proxy middleware
export const hlsProxy = createProxyMiddleware({
  target: 'http://placeholder.com', // This will be dynamically overridden
  router: function(req) {
    // The target URL is stored by validateStreamToken
    const originUrl = (req as any).proxyTargetUrl;
    // Extract base URL from the origin URL (e.g. http://server.com/live/stream.m3u8 -> http://server.com)
    const urlObj = new URL(originUrl);
    return urlObj.origin;
  },
  changeOrigin: true,
  pathRewrite: async function (path, req) {
    const originUrl = (req as any).proxyTargetUrl;
    const urlObj = new URL(originUrl);
    
    // Origin path (e.g., /live/stream.m3u8)
    let originPath = urlObj.pathname;
    
    // Remove the /index.m3u8 filename to get the base directory
    const baseDir = originPath.substring(0, originPath.lastIndexOf('/'));
    
    // The incoming path from frontend is /api/streams/play/:token/:file
    // Example: /api/streams/play/abc123xyz/index.m3u8 -> file is index.m3u8
    // Extract the file part
    const pathParts = path.split('/');
    // pathParts will be ['', 'api', 'streams', 'play', 'abc123xyz', 'index.m3u8']
    // We want to combine all parts after the token
    const tokenIndex = pathParts.findIndex(p => p === (req as any).params?.token);
    let requestedFile = 'index.m3u8';
    
    if (tokenIndex !== -1 && tokenIndex < pathParts.length - 1) {
      requestedFile = pathParts.slice(tokenIndex + 1).join('/');
    }

    // Rewrite to origin's directory + requested file
    return `${baseDir}/${requestedFile}`;
  },
  on: {
    proxyRes: (proxyRes, req, res) => {
      // Ensure CORS headers so the frontend can read the stream
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    },
    error: (err, req, res) => {
      console.error('Proxy Error:', err);
      (res as any).writeHead(500, {
        'Content-Type': 'text/plain',
      });
      (res as any).end('Proxy error');
    }
  }
});
