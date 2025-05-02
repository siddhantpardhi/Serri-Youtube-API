import { createClient } from 'redis';

const redisClient = createClient();

redisClient.on('error', err => console.error('Redis Client Error', err));

redisClient.connect().then(() => console.log("Redis connected")); // If you're using top-level await (Node 16+)

export default redisClient;
