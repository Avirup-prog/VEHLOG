import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const trimmedEmail = email.trim();
    // Search case-insensitively for the registered email
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') } 
    });
    
    if (user && (await user.matchPassword(password))) {
      // Role is automatically detected from the user's database record
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update driver GPS location
// @route   PUT /api/auth/location
// @access  Private (Driver)
export const updateLocation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user && user.role === 'Driver') {
      user.location = {
        lat: req.body.lat,
        lng: req.body.lng,
        updatedAt: Date.now()
      };
      await user.save();
      res.json({ message: 'GPS Location updated successfully' });
    } else {
      res.status(404).json({ message: 'Driver not found or invalid permissions' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const trimmedEmail = email.trim();
    const userExists = await User.findOne({ 
      email: { $regex: new RegExp(`^${trimmedEmail}$`, 'i') } 
    });

    if (userExists) {
      return res.status(400).json({ 
        message: `This email exists as ${userExists.role} already.` 
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail.toLowerCase(),
      password,
      role,
      vehicleId: role === 'Driver' ? `VH-${Math.floor(Math.random()*9000)+1000}` : null
    });

    res.status(201).json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      vehicleId: user.vehicleId 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'Admin') return res.status(400).json({ message: 'Cannot delete Admin root' });
      await user.deleteOne();
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
