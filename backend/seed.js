import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

const seedUsers = async () => {
  try {
    console.log('Connecting to MongoDB to seed users...');
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear existing users to avoid duplicates
    await User.deleteMany();

    // HASH THE PASSWORDS EXPLICITLY HERE!
    // Mongoose insertMany bypasses the .pre('save') middleware, which caused the login bug.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
      {
        name: 'Admin User',
        email: 'admin@pes.edu',
        password: hashedPassword,
        role: 'Admin'
      },
      {
        name: 'Manager User',
        email: 'manager@pes.edu',
        password: hashedPassword,
        role: 'Manager'
      },
      {
        name: 'John Doe',
        email: 'driver1@pes.edu',
        password: hashedPassword,
        role: 'Driver',
        vehicleId: 'VEH-9988'
      },
      {
        name: 'Jane Smith',
        email: 'driver2@pes.edu',
        password: hashedPassword,
        role: 'Driver',
        vehicleId: 'VEH-5544'
      }
    ];

    await User.insertMany(users);
    console.log('Database Seeded Successfully! Added Admin, Manager, and Drivers with correctly hashed passwords.');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();