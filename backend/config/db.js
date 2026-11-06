import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_logistics';

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected! Retrying connection...');
    setTimeout(connectWithRetry, 3000);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err.message}`);
  });

  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`Error Connecting to DB: ${error.message}. Retrying in 3 seconds...`);
      setTimeout(connectWithRetry, 3000);
    }
  };

  await connectWithRetry();
};

export default connectDB;
