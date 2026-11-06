import express from 'express';
import { handleCopilotChat } from '../controllers/aiController.js';

const router = express.Router();

router.post('/copilot', handleCopilotChat);
router.post('/chat', handleCopilotChat);

export default router;
