import express from 'express';
import { 
  getDashboardStats, 
  getActiveOrders, 
  getFleetStatus, 
  createOrder,
  getPendingOrders,
  getMyActiveOrder,
  claimOrder,
  pickupOrder,
  completeOrder
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Manager Routes
router.get('/stats', getDashboardStats);
router.get('/active', getActiveOrders);
router.get('/fleet', getFleetStatus);
router.post('/', createOrder);

// Driver Gig-Economy Routes
router.get('/pending', protect, getPendingOrders);
router.get('/my-order', protect, getMyActiveOrder);
router.put('/:id/claim', protect, claimOrder);
router.put('/:id/pickup', protect, pickupOrder);
router.put('/:id/complete', protect, completeOrder);

export default router;
