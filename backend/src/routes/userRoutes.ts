import express from 'express';
import { getProfile, updateProfile, getAllUsers, createUser, updateUserById, deleteUser, forceLogoutUser } from '../controllers/userController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Publicly accessible routes (must be logged in)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Admin-only routes
router.get('/', authMiddleware, adminMiddleware, getAllUsers);
router.post('/', authMiddleware, adminMiddleware, createUser);
router.put('/:id', authMiddleware, adminMiddleware, updateUserById);
router.delete('/:id', authMiddleware, adminMiddleware, deleteUser);
router.post('/:id/logout', authMiddleware, adminMiddleware, forceLogoutUser);

export default router;
