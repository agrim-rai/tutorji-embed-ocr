// lib/redis.js
import { createClient } from 'redis'

/** 
 * Create a single, eagerly‐connected Redis client 
 * that lives across cold starts / requests.
 */
export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
})

redis.on('error', err => console.error('Redis Error', err))
redis.connect()
     .then(() => console.log('Redis connected'))
     .catch(err => console.error('Redis failed to connect', err))

/**
 * Fetch the last `count` messages for this chatId
 */
export async function getChatMessages(chatId, count = 50) {
  // LRANGE -count -1 returns the last `count` elements
  const list = await redis.lRange(chatId, -count, -1)
  // Parse each JSON‐stringified message
  return list.map(item => JSON.parse(item))
}

/**
 * Append one or more messages and keep the list at maxLen
 */
export async function appendChatMessages(chatId, messages, maxLen = 50, ttlSec = 86400) {
  // Use MULTI/EXEC to batch RPUSH, LTRIM, EXPIRE in one network round‐trip
  const pipeline = redis.multi()
  for (const msg of messages) {
    pipeline.rPush(chatId, JSON.stringify(msg))
  }
  pipeline.lTrim(chatId, -maxLen, -1)
  pipeline.expire(chatId, ttlSec)
  await pipeline.exec()
}