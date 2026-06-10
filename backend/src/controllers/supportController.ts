import { Request, Response } from 'express';
import SupportQuery from '../models/SupportQuery';

export const createSupportQuery = async (req: Request, res: Response) => {
  try {
    const { name, mobile, city, mohalla, query } = req.body;
    
    if (!name || !mobile || !city || !mohalla || !query) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newQuery = new SupportQuery({
      name,
      mobile,
      city,
      mohalla,
      query
    });

    await newQuery.save();
    res.status(201).json({ message: 'Support query submitted successfully', query: newQuery });
  } catch (error) {
    console.error('Error creating support query:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllSupportQueries = async (req: Request, res: Response) => {
  try {
    const queries = await SupportQuery.find().sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    console.error('Error fetching support queries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSupportQuery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedQuery = await SupportQuery.findByIdAndDelete(id);
    
    if (!deletedQuery) {
      return res.status(404).json({ message: 'Support query not found' });
    }
    
    res.json({ message: 'Support query deleted successfully' });
  } catch (error) {
    console.error('Error deleting support query:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
