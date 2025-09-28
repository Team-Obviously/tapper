import { Router } from 'express';
import { generateMessage, sendTelegramMessage, getUserTelegramId } from '../controllers/telegramController';
const router = Router();
/**
 * @route POST /api/telegram/generate-message
 * @desc Generate a personalized message based on similarity analysis
 * @access Public
 */
router.post('/generate-message', generateMessage);
/**
 * @route POST /api/telegram/send-message
 * @desc Send a message via Telegram (returns URL to open Telegram)
 * @access Public
 */
router.post('/send-message', sendTelegramMessage);
/**
 * @route GET /api/telegram/user/:userId/telegram-id
 * @desc Get user's telegram ID
 * @access Public
 */
router.get('/user/:userId/telegram-id', getUserTelegramId);
export default router;
