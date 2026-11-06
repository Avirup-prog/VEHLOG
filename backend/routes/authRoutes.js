import express from 'express';
import { loginUser, getMe, updateLocation, registerUser, getAllUsers, deleteUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/location', protect, updateLocation);

// Admin User Management
router.post('/register', registerUser);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

export default router;