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
    const { name, parentMohalla } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Mohalla name is required' });
    }

    const formattedName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();

    const existing = await Mohalla.findOne({ name: formattedName });
    if (existing) {
      return res.status(400).json({ message: 'Mohalla already exists' });
    }

    const newMohalla = new Mohalla({ 
      name: formattedName,
      parentMohalla: parentMohalla || ''
    });
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

export const updateMohalla = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parentMohalla } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Mohalla name is required' });
    }

    const formattedName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();

    const existing = await Mohalla.findOne({ name: formattedName, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Another Mohalla with this name already exists' });
    }

    const updatedMohalla = await Mohalla.findByIdAndUpdate(
      id,
      { name: formattedName, parentMohalla: parentMohalla || '' },
      { new: true }
    );
    
    if (!updatedMohalla) {
      return res.status(404).json({ message: 'Mohalla not found' });
    }
    
    res.json(updatedMohalla);
  } catch (error) {
    console.error('Error updating mohalla:', error);
    res.status(500).json({ message: 'Server error updating mohalla' });
  }
};
