import express from 'express';
import { createLoginIssue, getAllLoginIssues, deleteLoginIssue } from '../controllers/loginIssueController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', createLoginIssue);
router.get('/', authMiddleware, adminMiddleware, getAllLoginIssues);
router.delete('/:id', authMiddleware, adminMiddleware, deleteLoginIssue);

export default router;
