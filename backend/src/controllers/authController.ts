import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_please_change_in_production';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itsId, password } = req.body;

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

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated. Please contact admin.' });
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, itsId: user.itsId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        itsId: user.itsId,
        fullName: user.fullName,
        role: user.role,
        jamaatName: user.jamaatName
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itsId, password, fullName, email, mobile, jamaatName } = req.body;

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
      jamaatName
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};
