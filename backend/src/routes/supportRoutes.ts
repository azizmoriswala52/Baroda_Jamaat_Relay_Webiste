import express from 'express';
import { createSupportQuery, getAllSupportQueries, deleteSupportQuery } from '../controllers/supportController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', createSupportQuery);
router.get('/', authMiddleware, adminMiddleware, getAllSupportQueries);
router.delete('/:id', authMiddleware, adminMiddleware, deleteSupportQuery);

export default router;
