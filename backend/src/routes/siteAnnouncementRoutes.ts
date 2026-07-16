import { Router } from 'express';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, submitResponse, getAnnouncementResponses, updateResponseStatus, revokeResponse } from '../controllers/siteAnnouncementController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authMiddleware, getAnnouncements);
router.post('/', authMiddleware, createAnnouncement);
router.put('/:id', authMiddleware, updateAnnouncement);
router.delete('/:id', authMiddleware, deleteAnnouncement);
router.post('/:id/rsvp', authMiddleware, submitResponse);
router.post('/:id/revoke', authMiddleware, revokeResponse);
router.get('/:id/responses', authMiddleware, getAnnouncementResponses);
router.patch('/:id/responses/:responseId/status', authMiddleware, updateResponseStatus);

export default router;
