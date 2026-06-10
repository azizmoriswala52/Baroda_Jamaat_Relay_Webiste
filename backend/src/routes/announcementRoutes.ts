import express from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcementController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', authMiddleware, getAnnouncements); // All logged-in users can view
router.post('/', authMiddleware, adminMiddleware, createAnnouncement);
router.put('/:id', authMiddleware, adminMiddleware, updateAnnouncement);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAnnouncement);

export default router;
