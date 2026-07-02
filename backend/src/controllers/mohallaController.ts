import { Request, Response } from 'express';
import Mohalla from '../models/Mohalla';

export const getAllMohallas = async (req: Request, res: Response) => {
  try {
    const mohallas = await Mohalla.find().sort({ name: 1 });
    res.json(mohallas);
  } catch (error) {
    console.error('Error fetching mohallas:', error);
    res.status(500).json({ message: 'Server error fetching mohallas' });
  }
};

export const createMohalla = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Mohalla name is required' });
    }

    const existing = await Mohalla.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Mohalla already exists' });
    }

    const newMohalla = new Mohalla({ name: name.trim() });
    await newMohalla.save();
    res.status(201).json(newMohalla);
  } catch (error) {
    console.error('Error creating mohalla:', error);
    res.status(500).json({ message: 'Server error creating mohalla' });
  }
};

export const deleteMohalla = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Mohalla.findByIdAndDelete(id);
    res.json({ message: 'Mohalla deleted successfully' });
  } catch (error) {
    console.error('Error deleting mohalla:', error);
    res.status(500).json({ message: 'Server error deleting mohalla' });
  }
};
