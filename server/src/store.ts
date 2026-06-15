import Redis from 'ioredis'
import { Room, serializeRoom, hydrateRoom, RoomSnapshot } from './game'

// Persistence is opt-in: with REDIS_URL set, live game state is written through
// to Redis so in-progress games survive a server restart. Without it (local dev
// and tests), everything stays in memory and these calls are no-ops.
const url = process.env.REDIS_URL
export const persistenceEnabled = !!url

const TTL_SECONDS = 60 * 60 * 6 // abandoned rooms expire after 6h
const roomKey = (id: string) => `fishbowl:room:${id}`
const INDEX_KEY = 'fishbowl:rooms'

let redis: Redis | null = null
if (url) {
  redis = new Redis(url, { maxRetriesPerRequest: 3 })
  redis.on('error', (e) => console.error('[redis]', e.message))
  redis.on('connect', () => console.log('[redis] connected'))
}

/** Write-through a room's current state (called after every mutation). */
export async function persistRoom(room: Room): Promise<void> {
  if (!redis) return
  try {
    const data = JSON.stringify(serializeRoom(room))
    await redis.multi().set(roomKey(room.id), data, 'EX', TTL_SECONDS).sadd(INDEX_KEY, room.id).exec()
  } catch (e) {
    console.error('[redis] persist failed:', (e as Error).message)
  }
}

export async function removeRoom(id: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(roomKey(id))
    await redis.srem(INDEX_KEY, id)
  } catch (e) {
    console.error('[redis] remove failed:', (e as Error).message)
  }
}

/** Close the Redis connection (lets the test process exit cleanly). */
export async function closeStore(): Promise<void> {
  if (redis) {
    await redis.quit().catch(() => redis?.disconnect())
    redis = null
  }
}

/** Load all surviving rooms on startup (drops index entries that have expired). */
export async function loadRooms(): Promise<Room[]> {
  if (!redis) return []
  try {
    const ids = await redis.smembers(INDEX_KEY)
    const out: Room[] = []
    for (const id of ids) {
      const data = await redis.get(roomKey(id))
      if (data) out.push(hydrateRoom(JSON.parse(data) as RoomSnapshot))
      else await redis.srem(INDEX_KEY, id)
    }
    return out
  } catch (e) {
    console.error('[redis] load failed:', (e as Error).message)
    return []
  }
}
