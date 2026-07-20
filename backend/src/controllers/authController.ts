import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { UAParser } from 'ua-parser-js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_please_change_in_production';

// Maps itsId -> last seen timestamp
export const activeSessions = new Map<string, number>();

// Set of itsId that have been forcefully logged out by admin
export const blacklistedSessions = new Set<string>();

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itsId, password } = req.body;

    if (!itsId || !password) {
      res.status(400).json({ message: 'ITS ID and password are required' });
      return;
    }

    if (!/^\d{8}$/.test(itsId)) {
      res.status(400).json({ message: 'ITS ID must be exactly 8 digits' });
      return;
    }

    const user = await User.findOne({ itsId });
    if (!user) {
      res.status(401).json({ message: 'Invalid ITS ID or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid ITS ID or password' });
      return;
    }

    // Single Session Lock Check
    const lastSeen = activeSessions.get(itsId);
    if (lastSeen && (Date.now() - lastSeen < 15000)) { // 15 seconds heartbeat timeout
      res.status(403).json({ message: 'The session is already in use for this ITS ID. Please logout from the previous session or contact the administrator.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated. Please contact admin.' });
      return;
    }

    user.lastLogin = new Date();
    
    // Get real IP
    const forwardedIps = req.headers['x-forwarded-for'];
    let rawIp = typeof forwardedIps === 'string' ? forwardedIps.split(',')[0] : (req.ip || req.connection.remoteAddress || 'Unknown IP');
    
    // Normalize localhost IPv6 to readable format
    if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') {
      rawIp = '127.0.0.1 (Localhost)';
    }
    user.lastIpAddress = rawIp;

    // Parse User Agent
    const parser = new UAParser(req.headers['user-agent'] || '');
    const browser = parser.getBrowser();
    const os = parser.getOS();
    user.lastDeviceDetails = `${browser.name || 'Unknown Browser'} on ${os.name || 'Unknown OS'}`;
    
    user.sessionStartTime = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, itsId: user.itsId, mohalla: user.mohalla },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Register session
    activeSessions.set(user.itsId, Date.now());
    blacklistedSessions.delete(user.itsId); // Clear blacklist on fresh login

    res.json({
      token,
      user: {
        itsId: user.itsId,
        fullName: user.fullName,
        mobile: user.mobile,
        role: user.role,
        jamaatName: user.jamaatName,
        mohalla: user.mohalla,
        hasRelayAccess: user.hasRelayAccess
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itsId, password, fullName, email, mobile, jamaatName, mohalla } = req.body;

    if (!itsId || !password) {
      res.status(400).json({ message: 'ITS ID and password are required' });
      return;
    }

    if (!/^\d{8}$/.test(itsId)) {
      res.status(400).json({ message: 'ITS ID must be exactly 8 digits' });
      return;
    }

    const existingUser = await User.findOne({ itsId });
    if (existingUser) {
      res.status(400).json({ message: 'ITS ID is already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      itsId,
      password: hashedPassword,
      fullName,
      email,
      mobile,
      jamaatName,
      mohalla
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const ping = (req: Request, res: Response): void => {
  const user = (req as any).user;
  if (user && user.itsId) {
    if (blacklistedSessions.has(user.itsId)) {
      res.status(401).json({ message: 'FORCE_LOGOUT' });
      return;
    }
    activeSessions.set(user.itsId, Date.now());
  }
  res.status(204).send();
};

export const logout = (req: Request, res: Response): void => {
  const user = (req as any).user;
  if (user && user.itsId) {
    activeSessions.delete(user.itsId);
  }
  res.status(204).send();
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('getMe Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
