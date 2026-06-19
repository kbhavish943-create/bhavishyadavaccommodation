const { createClient } = require('redis');
const logger = require('../config/logger');

const DEFAULT_TTL_SECONDS = Number(process.env.PUBLIC_CACHE_TTL_SECONDS || 30);
const localCache = new Map();
let redisClient = null;
let redisReady = false;

const now = () => Date.now();

const normalize = (value) => {
  if (!value || typeof value !== 'string') return null;
  return value.trim().toLowerCase();
};

const toRedisUrl = () => {
  const url = normalize(process.env.REDIS_URL);
  if (!url) return null;
  if (url === 'disabled' || url === 'false') return null;
  return process.env.REDIS_URL.trim();
};

const initCache = async () => {
  const redisUrl = toRedisUrl();
  if (!redisUrl) {
    logger.info('Cache mode: local memory (REDIS_URL not set)');
    return false;
  }

  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (error) => {
      redisReady = false;
      logger.warn(`Redis client error: ${error.message}`);
    });
    await redisClient.connect();
    redisReady = true;
    logger.info('Cache mode: Redis');
    return true;
  } catch (error) {
    redisReady = false;
    redisClient = null;
    logger.warn(`Redis unavailable, falling back to memory cache: ${error.message}`);
    return false;
  }
};

const setLocal = (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  localCache.set(key, {
    value,
    expiresAt: now() + (ttlSeconds * 1000)
  });
};

const getLocal = (key) => {
  const entry = localCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now()) {
    localCache.delete(key);
    return null;
  }
  return entry.value;
};

const deleteByPrefixLocal = (prefix) => {
  for (const key of localCache.keys()) {
    if (key.startsWith(prefix)) {
      localCache.delete(key);
    }
  }
};

const setCacheJSON = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  if (redisReady && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    } catch (error) {
      redisReady = false;
      logger.warn(`Redis set failed, using memory cache: ${error.message}`);
    }
  }
  setLocal(key, value, ttlSeconds);
};

const getCacheJSON = async (key) => {
  if (redisReady && redisClient) {
    try {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      redisReady = false;
      logger.warn(`Redis get failed, using memory cache: ${error.message}`);
    }
  }
  return getLocal(key);
};

const deleteByPrefix = async (prefix) => {
  deleteByPrefixLocal(prefix);
  if (redisReady && redisClient) {
    try {
      const keys = [];
      for await (const key of redisClient.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
        keys.push(key);
      }
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      redisReady = false;
      logger.warn(`Redis prefix delete failed: ${error.message}`);
    }
  }
};

const closeCache = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      logger.warn(`Failed to close redis connection: ${error.message}`);
    } finally {
      redisReady = false;
      redisClient = null;
    }
  }
};

module.exports = {
  initCache,
  closeCache,
  getCacheJSON,
  setCacheJSON,
  deleteByPrefix
};
