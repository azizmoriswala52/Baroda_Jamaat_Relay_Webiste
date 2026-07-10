import { Request, Response } from 'express';
import StreamSession from '../models/StreamSession';
import Announcement from '../models/Announcement';
import SupportQuery from '../models/SupportQuery';
import User from '../models/User';
import Mohalla from '../models/Mohalla';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const clearLiveMedia = async () => {
  try {
    const liveDir = path.join(__dirname, '../../media/live');
    if (fs.existsSync(liveDir)) {
      // Read all stream directories (e.g. streamA, streamB)
      const dirs = await fs.promises.readdir(liveDir);
      for (const dir of dirs) {
        const streamPath = path.join(liveDir, dir);
        const stat = await fs.promises.stat(streamPath);
        if (stat.isDirectory()) {
          // Delete all .ts and .m3u8 files in the stream directory
          const files = await fs.promises.readdir(streamPath);
          for (const file of files) {
            if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
              // Fire and forget unlink to speed up
              fs.promises.unlink(path.join(streamPath, file)).catch(e => console.error(e));
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error clearing live media:', error);
  }
};

// Get all stream sessions
export const getAllStreams = async (req: Request, res: Response): Promise<void> => {
  try {
    let streams = await StreamSession.find().sort({ createdAt: -1 });
    
    const reqUser = (req as any).user;
    if (reqUser && reqUser.role !== 'ADMIN') {
      const freshUser = await User.findById(reqUser.userId);
      const userMohalla = freshUser?.mohalla || 'Burhani';
      const userGender = freshUser?.gender || 'Male';
      
      const userMohallaDoc = await Mohalla.findOne({ name: userMohalla });
      const userParentMohalla = userMohallaDoc?.parentMohalla;
      
      streams = streams.filter(stream => {
        if (stream.visibility !== 'USERS') return false;
        
        const hasParentRestriction = stream.allowedParentMohallas && stream.allowedParentMohallas.length > 0 && !stream.allowedParentMohallas.includes('All');
        const hasChildRestriction = stream.allowedChildMohallas && stream.allowedChildMohallas.length > 0 && !stream.allowedChildMohallas.includes('All');
        
        let mohallaAccess = true;
        if (hasParentRestriction || hasChildRestriction) {
          mohallaAccess = false;
          
          if (hasChildRestriction) {
            // Strict child restriction overrides parent
            if (stream.allowedChildMohallas.includes(userMohalla)) {
              mohallaAccess = true;
            }
          } else if (hasParentRestriction) {
            // If child is 'All', grant access to everyone under the allowed parents
            if (
              (userParentMohalla && stream.allowedParentMohallas.includes(userParentMohalla)) ||
              stream.allowedParentMohallas.includes(userMohalla)
            ) {
              mohallaAccess = true;
            }
          }
        }
        
        const genderAccess = (!stream.allowedGender || stream.allowedGender === 'All' || stream.allowedGender === userGender);
        
        return mohallaAccess && genderAccess;
      });
    }
    
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

    const reqUser = (req as any).user;
    
    if (!reqUser || reqUser.role !== 'ADMIN') {
      if (activeStream.visibility !== 'USERS') {
        res.status(403).json({ message: 'This relay is currently visible only to Admins.' });
        return;
      }

      // Fetch fresh user to ensure we have the latest mohalla and gender (in case JWT is old)
      const freshUser = await User.findById(reqUser.userId);
      const userMohalla = freshUser?.mohalla || 'Burhani';
      const userGender = freshUser?.gender || 'Male';
      
      const hasParentRestriction = activeStream.allowedParentMohallas && activeStream.allowedParentMohallas.length > 0 && !activeStream.allowedParentMohallas.includes('All');
      const hasChildRestriction = activeStream.allowedChildMohallas && activeStream.allowedChildMohallas.length > 0 && !activeStream.allowedChildMohallas.includes('All');
      
      if (hasParentRestriction || hasChildRestriction) {
        const userMohallaDoc = await Mohalla.findOne({ name: userMohalla });
        const userParentMohalla = userMohallaDoc?.parentMohalla;
        
        let hasAccess = false;
        
        if (hasChildRestriction) {
          if (activeStream.allowedChildMohallas.includes(userMohalla)) {
            hasAccess = true;
          }
        } else if (hasParentRestriction) {
          if (
            (userParentMohalla && activeStream.allowedParentMohallas.includes(userParentMohalla)) ||
            activeStream.allowedParentMohallas.includes(userMohalla)
          ) {
            hasAccess = true;
          }
        }

        if (!freshUser || !hasAccess) {
          res.status(403).json({ message: 'This relay is restricted to specific Mohallas.' });
          return;
        }
      }

      if (activeStream.allowedGender && activeStream.allowedGender !== 'All') {
        if (!freshUser || userGender !== activeStream.allowedGender) {
          res.status(403).json({ message: `This relay is restricted to ${activeStream.allowedGender}s only.` });
          return;
        }
      }
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
    const { title, speaker, description, servers, streamType, scheduledDate, isLive, thumbnail, allowedParentMohallas, allowedChildMohallas, allowedGender, visibility } = req.body;

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
      thumbnail,
      allowedParentMohallas: allowedParentMohallas || [],
      allowedChildMohallas: allowedChildMohallas || [],
      allowedGender: allowedGender || 'All',
      visibility: visibility || 'ADMIN'
    });

    await newStream.save();

    // Cascade delete existing announcements and queries to start fresh
    await Promise.all([
      Announcement.deleteMany({}),
      SupportQuery.deleteMany({})
    ]);

    // Clear old video files from disk asynchronously (fire and forget)
    clearLiveMedia().catch(e => console.error(e));

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
    const updatePayload: any = { ...req.body };

    // If setting this stream as live, deactivate all others
    if (updatePayload.isLive === true) {
      await StreamSession.updateMany({ _id: { $ne: id } }, { $set: { isLive: false } });
    }

    // If stream is going offline, clean the media folder
    if (updatePayload.isLive === false) {
      clearLiveMedia().catch(e => console.error('Clear media error:', e));
    }

    const updatedStream = await StreamSession.findByIdAndUpdate(
      id,
      { $set: updatePayload },
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

    // Clear old video files from disk
    clearLiveMedia();

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
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

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

    const streamFormat = activeStream.streamType || 'HLS';
    
    // Always use proxy for HLS to hide origin
    res.json({ playbackToken: tokenStr, streamFormat });
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
