import mongoose from 'mongoose';
const orderSchema = new mongoose.Schema({
  order_id: String,
  city: String,
  pickup_area: String,
  delivery_area: String,
  distance_km: Number,
  weather: String,
  traffic_level: String,
  late_delivery: Number,
  status: { type: String, enum: ['Pending', 'Active', 'Picked_Up', 'Delivered'], default: 'Pending' },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });
export default mongoose.model('Order', orderSchema);
