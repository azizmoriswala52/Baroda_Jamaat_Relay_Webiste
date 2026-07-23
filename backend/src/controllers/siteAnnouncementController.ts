import { Request, Response } from 'express';
import mongoose from 'mongoose';
import SiteAnnouncement from '../models/SiteAnnouncement';
import SiteAnnouncementResponse from '../models/SiteAnnouncementResponse';
import User from '../models/User';
import Mohalla from '../models/Mohalla';

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    let announcements = await SiteAnnouncement.find().sort({ createdAt: -1 });

    const reqUser = (req as any).user;
    if (reqUser && reqUser.role !== 'ADMIN') {
      const freshUser = await User.findById(reqUser.userId);
      const userMohalla = freshUser?.mohalla || 'Burhani';
      
      const userMohallaDoc = await Mohalla.findOne({ name: userMohalla });
      const userParentMohalla = userMohallaDoc?.parentMohalla;
      
      announcements = announcements.filter(announcement => {
        const hasParentRestriction = announcement.targetParentMohallas && announcement.targetParentMohallas.length > 0 && !announcement.targetParentMohallas.includes('All');
        const hasChildRestriction = announcement.targetChildMohallas && announcement.targetChildMohallas.length > 0 && !announcement.targetChildMohallas.includes('All');
        
        let mohallaAccess = true;
        if (hasParentRestriction || hasChildRestriction) {
          mohallaAccess = false;
          
          if (hasChildRestriction) {
            if (announcement.targetChildMohallas!.includes(userMohalla)) {
              mohallaAccess = true;
            }
          } else if (hasParentRestriction) {
            if (
              (userParentMohalla && announcement.targetParentMohallas!.includes(userParentMohalla)) ||
              announcement.targetParentMohallas!.includes(userMohalla)
            ) {
              mohallaAccess = true;
            }
          }
        }
        return mohallaAccess;
      });
    }
    
    // Fetch their responses regardless of role
    const userResponses = await SiteAnnouncementResponse.find({ userId: (req as any).user?.userId });
    const responseMap = userResponses.reduce((acc, curr) => {
      acc[curr.announcementId.toString()] = {
        response: curr.response,
        status: curr.status,
        submissionCount: curr.submissionCount
      };
      return acc;
    }, {} as Record<string, { response: string; status: string; submissionCount: number }>);

      const announcementsWithResponse = announcements.map(a => {
        const obj = a.toObject();
        const userResp = responseMap[obj._id.toString()];
        return {
          ...obj,
          userResponse: userResp ? userResp.response : null,
          userResponseStatus: userResp ? userResp.status : null,
          submissionCount: userResp ? userResp.submissionCount : 0
        };
      });
      return res.json(announcementsWithResponse);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error fetching announcements' });
  }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    if ((req as any).user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { title, content, responseType, rsvpOptions, targetParentMohallas, targetChildMohallas, deadline } = req.body;
    
    const newAnnounce = new SiteAnnouncement({ 
      title, 
      content, 
      responseType, 
      rsvpOptions, 
      targetParentMohallas: targetParentMohallas || ['All'],
      targetChildMohallas: targetChildMohallas || ['All'],
      deadline
    });
    await newAnnounce.save();
    res.status(201).json(newAnnounce);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    if ((req as any).user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const updatedAnnounce = await SiteAnnouncement.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    
    if (!updatedAnnounce) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(updatedAnnounce);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    if ((req as any).user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;

    const approvedResponses = await SiteAnnouncementResponse.find({ announcementId: id, status: 'APPROVED' });
    const userIdsToRevoke = approvedResponses.map(r => r.userId);

    if (userIdsToRevoke.length > 0) {
      await User.updateMany({ _id: { $in: userIdsToRevoke } }, { hasRelayAccess: false });
    }

    await SiteAnnouncement.findByIdAndDelete(id);
    await SiteAnnouncementResponse.deleteMany({ announcementId: id });
    res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error deleting announcement' });
  }
};

export const submitResponse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const announcement = await SiteAnnouncement.findById(id);
    if (!announcement || announcement.responseType === 'NONE') {
      return res.status(400).json({ error: 'Invalid announcement or response not required' });
    }

    if (announcement.deadline && new Date() > new Date(announcement.deadline)) {
      return res.status(400).json({ error: 'No longer accepting responses.' });
    }

    const existing = await SiteAnnouncementResponse.findOne({ announcementId: id, userId });
    
    if (existing) {
      if (announcement.responseType === 'RSVP' && existing.submissionCount >= 3) {
        return res.status(400).json({ error: 'You have reached the maximum number of RSVP updates (3).' });
      }
      if (announcement.responseType === 'APPROVAL' && existing.submissionCount >= 2) {
        return res.status(400).json({ error: 'You have reached the maximum number of approval requests (2).' });
      }

      existing.response = response;
      if (announcement.responseType === 'APPROVAL') {
        existing.status = 'PENDING';
      }
      existing.submissionCount += 1;
      await existing.save();
    } else {
      await SiteAnnouncementResponse.create({ 
        announcementId: new mongoose.Types.ObjectId(id as string), 
        userId: new mongoose.Types.ObjectId(userId as string), 
        response,
        submissionCount: 1,
        status: 'PENDING'
      });
    }

    res.json({ message: 'Response recorded successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error submitting response' });
  }
};

export const getAnnouncementResponses = async (req: Request, res: Response) => {
  try {
    if ((req as any).user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const responses = await SiteAnnouncementResponse.find({ announcementId: id }).populate('userId', 'fullName itsId mobile jamaatName mohalla');
    res.json(responses);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error fetching responses' });
  }
};

export const updateResponseStatus = async (req: Request, res: Response) => {
  try {
    if ((req as any).user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
    
    const { id, responseId } = req.params;
    const { status } = req.body;
    
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const response = await SiteAnnouncementResponse.findOneAndUpdate(
      { _id: responseId, announcementId: id },
      { status },
      { new: true }
    );

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Automatically update the user's relay access based on this approval
    if (status === 'APPROVED') {
      await User.findByIdAndUpdate(response.userId, { hasRelayAccess: true });
    } else if (status === 'REJECTED') {
      await User.findByIdAndUpdate(response.userId, { hasRelayAccess: false });
    }

    res.json({ message: 'Status updated successfully', response });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error updating response status' });
  }
};

export const revokeResponse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const response = await SiteAnnouncementResponse.findOne({ announcementId: id, userId });
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    response.status = 'REVOKED';
    await response.save();

    res.json({ message: 'Request revoked successfully', response });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error revoking response' });
  }
};
