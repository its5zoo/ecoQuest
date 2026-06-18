const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URI || 'redis://127.0.0.1:6379',
      socket: {
        reconnectStrategy: false
      }
    });

    // Suppress repeated error events since we handle the initial catch
    redisClient.on('error', () => {});

    await redisClient.connect();
    console.log('Redis Connected');
  } catch (error) {
    console.warn('Redis not available locally. The app will run smoothly without cache.');
    redisClient = null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
