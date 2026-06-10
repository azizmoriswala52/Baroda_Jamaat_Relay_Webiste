import { Request, Response } from 'express';
import StreamSession from '../models/StreamSession';
import Announcement from '../models/Announcement';
import SupportQuery from '../models/SupportQuery';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Get all stream sessions
export const getAllStreams = async (req: Request, res: Response): Promise<void> => {
  try {
    const streams = await StreamSession.find().sort({ createdAt: -1 });
    res.json(streams);
  } catch (error) {
    console.error('Get Streams Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get the currently active stream session
export const getActiveStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeStream = await StreamSession.findOne({ isLive: true }).sort({ createdAt: -1 });
    if (!activeStream) {
      res.status(404).json({ message: 'No active stream found' });
      return;
    }
    res.json(activeStream);
  } catch (error) {
    console.error('Get Active Stream Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new stream session (Admin only)
export const createStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, speaker, description, servers, streamType, scheduledDate, isLive, thumbnail } = req.body;

    // If setting this stream as live, deactivate all others
    if (isLive) {
      await StreamSession.updateMany({}, { $set: { isLive: false } });
    }

    const newStream = new StreamSession({
      title,
      speaker,
      description,
      servers: servers || [],
      streamType: streamType || 'YOUTUBE',
      scheduledDate: scheduledDate || new Date(),
      isLive: isLive || false,
      thumbnail: thumbnail || ''
    });

    await newStream.save();
    
    // Cascade delete existing announcements and queries to start fresh
    await Promise.all([
      Announcement.deleteMany({}),
      SupportQuery.deleteMany({})
    ]);

    res.status(201).json(newStream);
  } catch (error) {
    console.error('Create Stream Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an existing stream session (Admin only)
export const updateStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isLive, ...updateData } = req.body;

    // If setting this stream as live, deactivate all others
    if (isLive === true) {
      await StreamSession.updateMany({ _id: { $ne: id } }, { $set: { isLive: false } });
    }

    const updatedStream = await StreamSession.findByIdAndUpdate(
      id,
      { ...updateData, isLive },
      { returnDocument: 'after' }
    );

    if (!updatedStream) {
      res.status(404).json({ message: 'Stream not found' });
      return;
    }

    res.json(updatedStream);
  } catch (error) {
    console.error('Update Stream Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a stream session (Admin only)
export const deleteStream = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedStream = await StreamSession.findByIdAndDelete(id);
    
    if (!deletedStream) {
      res.status(404).json({ message: 'Stream not found' });
      return;
    }
    
    // Cascade delete existing announcements and queries when a stream is removed
    await Promise.all([
      Announcement.deleteMany({}),
      SupportQuery.deleteMany({})
    ]);
    
    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('Delete Stream Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

import crypto from 'crypto';
import StreamToken from '../models/StreamToken';
import StreamAccessLog from '../models/StreamAccessLog';

// Secure stream access endpoint: Generates a short-lived token without exposing the origin URL
export const getStreamAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const activeStream = await StreamSession.findOne({ isLive: true }).sort({ createdAt: -1 });
    if (!activeStream || activeStream.servers.length === 0) {
      await StreamAccessLog.create({
        userId: user.userId,
        streamId: activeStream?._id || new mongoose.Types.ObjectId(), // fake id if null
        action: 'DENIED',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        reason: 'No active stream'
      });
      res.status(404).json({ message: 'No active stream found' });
      return;
    }

    // Determine which server URL to proxy
    const serverName = req.query.serverName as string;
    let targetServer = activeStream.servers[0];
    if (serverName) {
      const found = activeStream.servers.find(s => s.name === serverName);
      if (found) targetServer = found;
    }

    // Generate token
    const tokenStr = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await StreamToken.create({
      token: tokenStr,
      userId: user.userId,
      streamId: activeStream._id,
      originUrl: targetServer.url,
      expiresAt,
      isValid: true,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    await StreamAccessLog.create({
      userId: user.userId,
      streamId: activeStream._id,
      action: 'GRANTED',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });

    res.json({ playbackToken: tokenStr });
  } catch (error) {
    console.error('Get Stream Access Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Renew an existing stream token to prevent expiration during long streams
export const renewStreamAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { playbackToken } = req.body;
    if (!playbackToken) {
      res.status(400).json({ message: 'Playback token required' });
      return;
    }

    const streamToken = await StreamToken.findOne({ token: playbackToken });
    if (!streamToken) {
      res.status(404).json({ message: 'Token not found' });
      return;
    }

    // Extend by 4 hours
    streamToken.expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
    await streamToken.save();

    res.json({ message: 'Token renewed successfully', expiresAt: streamToken.expiresAt });
  } catch (error) {
    console.error('Renew Stream Access Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
