/* ===================================
   DATABASE CONNECTION
   MongoDB Connection with Mongoose
   =================================== */

const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/live-shopping';

        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(MONGO_URI, options);

        console.log('✅ MongoDB Connected Successfully');
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Host: ${mongoose.connection.host}`);

        // Connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB Connection Error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB Disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB Reconnected');
        });

    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        console.error('   Please ensure MongoDB is running');
        // process.exit(1); // Do not crash the server if DB is down for the demo
    }
};

// Graceful shutdown
const disconnectDatabase = async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
};

module.exports = connectDatabase;
module.exports.disconnect = disconnectDatabase;
