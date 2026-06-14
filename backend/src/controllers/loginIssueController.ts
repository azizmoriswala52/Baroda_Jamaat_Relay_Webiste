import { Request, Response } from 'express';
import LoginIssue from '../models/LoginIssue';

export const createLoginIssue = async (req: Request, res: Response) => {
  try {
    const { itsId, issueDescription } = req.body;
    
    if (!itsId || !issueDescription) {
      return res.status(400).json({ message: 'ITS ID and Issue Description are required' });
    }

    if (!/^\d{8}$/.test(itsId)) {
      return res.status(400).json({ message: 'ITS ID must be exactly 8 digits' });
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
