import { Request, Response } from 'express';
import Announcement from '../models/Announcement';

export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Get Announcements Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, type, time } = req.body;
    const newAnnouncement = new Announcement({ content, type, time });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, type, time, isActive } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      res.status(404).json({ message: 'Announcement not found' });
      return;
    }

    if (content !== undefined) announcement.content = content;
    if (type !== undefined) announcement.type = type;
    if (time !== undefined) announcement.time = time;
    if (isActive !== undefined) announcement.isActive = isActive;

    await announcement.save();
    res.json(announcement);
  } catch (error) {
    console.error('Update Announcement Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Announcement not found' });
      return;
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete Announcement Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
