// file: lib/redis/config.ts
import { Redis } from '@upstash/redis'

export type RedisConfig = {
  upstashRedisRestUrl: string
  upstashRedisRestToken: string
}

export const redisConfig: RedisConfig = {
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL!,
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN!
}

let redisWrapper: RedisWrapper | null = null

// Wrapper class for Redis client
export class RedisWrapper {
  private client: Redis

  constructor(client: Redis) {
    this.client = client
  }

  async zrange(
      key: string,
      start: number,
      stop: number,
      options?: { rev: boolean }
  ): Promise<string[]> {
    const result = await this.client.zrange(key, start, stop, options) as unknown as string[]
    console.log(`[INFO] zrange result for key "${key}" fetched from cache:`, result)
    return result
  }

  async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    const result = await this.client.hgetall(key)
    const typedResult = (result && Object.keys(result).length > 0) ? (result as T) : null
    console.log(`[INFO] hgetall result for key "${key}" fetched from cache:`, typedResult)
    return typedResult
  }

  async hmset(key: string, value: Record<string, any>): Promise<'OK' | number> {
    const result = await this.client.hmset(key, value)
    console.log(`[INFO] hmset result for key "${key}" stored in cache`)
    return result
  }

  async zadd(key: string, score: number, member: string): Promise<number | null> {
    const result = await this.client.zadd(key, { score, member })
    console.log(`[INFO] zadd result for key "${key}" stored in cache`)
    return result
  }

  async del(key: string): Promise<number> {
    const result = await this.client.del(key)
    console.log(`[INFO] del result for key "${key}" removed from cache`)
    return result
  }

  async zrem(key: string, member: string): Promise<number> {
    const result = await this.client.zrem(key, member)
    console.log(`[INFO] zrem result for key "${key}" removed from cache`)
    return result
  }

  async close(): Promise<void> {
    // Upstash Redis doesn't require explicit closing
  }
}

// Function to initialize Redis client
function initializeRedisClient(): Redis {
  if (!redisConfig.upstashRedisRestUrl || !redisConfig.upstashRedisRestToken) {
    throw new Error('Upstash Redis configuration is missing. Please check your environment variables.')
  }

  return new Redis({
    url: redisConfig.upstashRedisRestUrl,
    token: redisConfig.upstashRedisRestToken
  })
}

// Function to get a Redis client
export async function getRedisClient(): Promise<RedisWrapper> {
  if (redisWrapper) {
    console.log('[INFO] Reusing existing Redis client')
    return redisWrapper
  }

  try {
    const client = initializeRedisClient()
    redisWrapper = new RedisWrapper(client)
    console.log('[INFO] Connected to Upstash Redis')
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('unauthorized')) {
        console.error('Failed to connect to Upstash Redis: Unauthorized. Check your Upstash Redis token.')
      } else if (error.message.includes('not found')) {
        console.error('Failed to connect to Upstash Redis: URL not found. Check your Upstash Redis URL.')
      } else {
        console.error('Failed to connect to Upstash Redis:', error.message)
      }
    } else {
      console.error('An unexpected error occurred while connecting to Upstash Redis:', error)
    }
    throw new Error('Failed to connect to Upstash Redis. Check your configuration and credentials.')
  }

  return redisWrapper
}