import { Router } from 'express';
import { generateMessage, sendTelegramMessage, getUserTelegramId } from '../controllers/telegramController';

const router = Router();

// POST /api/telegram/generate-message
router.post('/generate-message', generateMessage);

// POST /api/telegram/send-message
router.post('/send-message', sendTelegramMessage);

// GET /api/telegram/user/:userId/telegram-id
router.get('/user/:userId/telegram-id', getUserTelegramId);

export default router;
