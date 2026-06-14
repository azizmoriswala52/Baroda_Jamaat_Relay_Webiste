import { Router } from 'express';
import { login, register, ping, logout } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/ping', authMiddleware, ping);
router.post('/logout', authMiddleware, logout);

export default router;
