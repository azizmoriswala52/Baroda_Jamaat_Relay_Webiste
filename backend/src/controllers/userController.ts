import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { activeSessions, blacklistedSessions } from './authController';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById((req as any).user.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!(req as any).user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { fullName, email, mobile, password } = req.body;

    const user = await User.findById((req as any).user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    
    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin Endpoints

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    const now = Date.now();
    const usersWithSession = users.map(user => {
      const u = user.toObject();
      const lastSeen = activeSessions.get(u.itsId);
      const isSessionActive = lastSeen && (now - lastSeen < 15000);
      
      let sessionDuration = null;
      if (isSessionActive && u.sessionStartTime) {
        sessionDuration = Math.floor((now - new Date(u.sessionStartTime).getTime()) / 60000);
      }

      return {
        ...u,
        sessionStatus: isSessionActive ? 'inUse' : 'idle',
        sessionDuration
      };
    });

    res.json(usersWithSession);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itsId, password, fullName, email, mobile, jamaatName, role, isActive } = req.body;

    if (!itsId || !fullName || !mobile || !password || !role) {
      res.status(400).json({ message: 'All required fields must be provided' });
      return;
    }

    if (!/^\d{8}$/.test(itsId)) {
      res.status(400).json({ message: 'ITS ID must be exactly 8 digits' });
      return;
    }

    const existingUser = await User.findOne({ itsId });
    if (existingUser) {
      res.status(400).json({ message: 'ITS ID is already registered' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || '1234', salt);

    const newUser = new User({
      itsId,
      password: hashedPassword,
      fullName,
      email,
      mobile,
      jamaatName: jamaatName || 'Baroda Jamaat',
      role: role || 'USER',
      isActive: isActive !== undefined ? isActive : true
    });

    await newUser.save();
    
    const userWithoutPassword = await User.findById(newUser._id).select('-password');
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { itsId, fullName, email, mobile, password, jamaatName, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (itsId) user.itsId = itsId;
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (jamaatName) user.jamaatName = jamaatName;
    if (role) user.role = role;
    if (isActive !== undefined) {
      user.isActive = isActive;
      if (!isActive) {
        // Forcefully log out the user when deactivated
        activeSessions.delete(user.itsId);
        blacklistedSessions.add(user.itsId);
        user.sessionStartTime = undefined;
      }
    }

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update User By ID Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Prevent an admin from deleting themselves
    if ((req as any).user?.userId === id) {
      res.status(400).json({ message: 'Cannot delete your own account' });
      return;
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forceLogoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Terminate their session
    activeSessions.delete(user.itsId);
    blacklistedSessions.add(user.itsId);

    // Also update their status in the DB optionally
    user.sessionStartTime = undefined;
    await user.save();

    res.json({ message: 'User forcefully logged out' });
  } catch (error) {
    console.error('Force Logout Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
