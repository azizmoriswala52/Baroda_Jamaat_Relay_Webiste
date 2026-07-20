import { Request, Response } from 'express';
import LoginIssue from '../models/LoginIssue';
import User from '../models/User';

export const createLoginIssue = async (req: Request, res: Response) => {
  try {
    const { itsId, issueDescription } = req.body;
    
    if (!itsId || !issueDescription) {
      return res.status(400).json({ message: 'ITS ID and Issue Description are required' });
    }

    if (!/^\d{8}$/.test(itsId)) {
      return res.status(400).json({ message: 'ITS ID must be exactly 8 digits' });
    }

    // Check if the user is registered
    const existingUser = await User.findOne({ itsId });
    if (!existingUser) {
      return res.status(404).json({ message: 'Your ITS ID is not registered' });
    }

    const newIssue = new LoginIssue({
      itsId,
      issueDescription
    });

    await newIssue.save();
    res.status(201).json({ message: 'Login issue submitted successfully', issue: newIssue });
  } catch (error) {
    console.error('Error creating login issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllLoginIssues = async (req: Request, res: Response) => {
  try {
    const issues = await LoginIssue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error('Error fetching login issues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteLoginIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedIssue = await LoginIssue.findByIdAndDelete(id);
    
    if (!deletedIssue) {
      return res.status(404).json({ message: 'Login issue not found' });
    }
    
    res.json({ message: 'Login issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting login issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const verifyItsId = async (req: Request, res: Response) => {
  try {
    const { itsId } = req.params;
    
    if (!/^\d{8}$/.test(itsId as string)) {
      return res.status(400).json({ message: 'ITS ID must be exactly 8 digits' });
    }

    const existingUser = await User.findOne({ itsId: itsId as string });
    if (!existingUser) {
      return res.status(404).json({ message: 'This ITS ID is not registered in Baroda Jamaat.' });
    }
    
    res.json({ exists: true });
  } catch (error) {
    console.error('Error verifying ITS ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
