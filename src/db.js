import mongoose from 'mongoose';
import { logger } from './logger.js';

export const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            socketTimeoutMS: 30000, // 30 seconds
            connectTimeoutMS: 30000, // 30 seconds
        });
        // mongoose.set('debug', true);
        logger.info('Connected to MongoDB locally');
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
    logger.info('Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('close', () => {
    logger.info('Mongoose connection closed');
});

// Logs connection pool state using serverStatus
const logConnectionPoolState = async () => {
    try {
        const poolStats = await mongoose.connection.db.command({ serverStatus: 1 });
        const connections = poolStats.connections;
        logger.info('MongoDB connection pool state:');
        logger.info(`  - Current: ${connections.current}`);
        logger.info(`  - Available: ${connections.available}`);
        logger.info(`  - Total Created: ${connections.totalCreated}`);
    } catch (error) {
        logger.error('Error fetching connection pool state:', error.message);
    }
};

export const isConnectionReady = () => mongoose.connection.readyState === 1;

export const gracefulShutdown = async (signal) => {
    try {
        logger.info(`Graceful shutdown initiated: ${signal}`);
        if (mongoose.connection.readyState !== 0) {
            await logConnectionPoolState();
            logger.info(`MongoDB connection state before closing: ${mongoose.connection.readyState}`);
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
        } else {
            logger.info('MongoDB connection already closed');
        }
    } catch (error) {
        logger.error(`Error during graceful shutdown: ${error.message}`);
        throw error;
    } finally {
        logger.info(`Graceful shutdown completed: ${signal}`);
    }
};
