import express from 'express';
import { getAllMohallas, createMohalla, deleteMohalla, updateMohalla } from '../controllers/mohallaController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', authMiddleware, getAllMohallas);
router.post('/', authMiddleware, adminMiddleware, createMohalla);
router.put('/:id', authMiddleware, adminMiddleware, updateMohalla);
router.delete('/:id', authMiddleware, adminMiddleware, deleteMohalla);

export default router;
