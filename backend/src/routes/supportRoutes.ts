import express from 'express';
import { createSupportQuery, getAllSupportQueries, deleteSupportQuery } from '../controllers/supportController';
import { authMiddleware, adminMiddleware, adminOrOpsMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', createSupportQuery);
router.get('/', authMiddleware, adminOrOpsMiddleware, getAllSupportQueries);
router.delete('/:id', authMiddleware, adminOrOpsMiddleware, deleteSupportQuery);

export default router;
