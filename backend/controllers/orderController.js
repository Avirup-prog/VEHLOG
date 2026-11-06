import Order from '../models/Order.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res) => {
  try {
    const activeDeliveries = await Order.countDocuments({ status: { $in: ['Pending', 'Active', 'Picked_Up'] } });
    const availableDrivers = Math.floor(activeDeliveries * 0.35); 
    const aiPredictedDelays = await Order.countDocuments({ status: { $in: ['Pending', 'Active', 'Picked_Up'] }, late_delivery: 1 });
    res.json({ activeDeliveries, availableDrivers, aiPredictedDelays });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['Pending', 'Active', 'Picked_Up'] } }).limit(50).sort({ createdAt: -1 }).populate('driver_id', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFleetStatus = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'Driver' }).select('-password');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const order = new Order({
      order_id: req.body.order_id || `ORD-LIVE-${Math.floor(Math.random()*10000)}`,
      city: 'Bengaluru',
      pickup_area: req.body.pickup_area,
      delivery_area: req.body.delivery_area,
      distance_km: req.body.distance_km,
      weather: req.body.weather,
      traffic_level: req.body.traffic_level,
      late_delivery: req.body.late_delivery || 0,
      status: 'Pending'
    });
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyActiveOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ driver_id: req.user.id, status: { $in: ['Active', 'Picked_Up'] } });
    res.json(order || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const claimOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order && order.status === 'Pending') {
      order.status = 'Active';
      order.driver_id = req.user.id;
      await order.save();
      res.json(order);
    } else {
      res.status(400).json({ message: 'Sorry, this order was just claimed by another partner!' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const pickupOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order && order.driver_id.toString() === req.user.id && order.status === 'Active') {
      order.status = 'Picked_Up';
      await order.save();
      res.json(order);
    } else {
      res.status(400).json({ message: 'Invalid permissions or status' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order && order.driver_id.toString() === req.user.id) {
      order.status = 'Delivered';
      await order.save();
      res.json({ message: 'Delivery completed successfully!' });
    } else {
      res.status(400).json({ message: 'Invalid permissions' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
