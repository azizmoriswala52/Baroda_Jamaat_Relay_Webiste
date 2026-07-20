import express from 'express';
import { createLoginIssue, getAllLoginIssues, deleteLoginIssue, verifyItsId } from '../controllers/loginIssueController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/verify-its/:itsId', verifyItsId);
router.post('/', createLoginIssue);
router.get('/', authMiddleware, adminMiddleware, getAllLoginIssues);
router.delete('/:id', authMiddleware, adminMiddleware, deleteLoginIssue);

export default router;
