const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/carbonprint');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️  MongoDB connection failed: ${error.message}`);
    console.warn('⚠️  Server will continue WITHOUT MongoDB — DB-dependent features will be limited.');
    // Do NOT exit — let the server run so AI and non-DB routes still work
  }
};

module.exports = connectDB;
