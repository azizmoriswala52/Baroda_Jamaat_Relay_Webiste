import express from 'express';
import { createLoginIssue, getAllLoginIssues, deleteLoginIssue, verifyItsId } from '../controllers/loginIssueController';
import { authMiddleware, adminMiddleware, adminOrOpsMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/verify-its/:itsId', verifyItsId);
router.post('/', createLoginIssue);
router.get('/', authMiddleware, adminOrOpsMiddleware, getAllLoginIssues);
router.delete('/:id', authMiddleware, adminOrOpsMiddleware, deleteLoginIssue);

export default router;
