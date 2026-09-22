# Redis — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is Redis?
In-memory key-value data structure store. Used as database, cache, message broker, and queue.

**Key features:** Single-threaded (no locks), sub-millisecond latency, persistent (RDB/AOF), data structures beyond simple K/V.

---

## 2. Data Structures & Commands

### Strings
```redis
SET user:1:name "Divesh"
GET user:1:name                    -- "Divesh"
SET session:abc123 "data" EX 3600  -- Expires in 1 hour
SETNX lock:order:1 "locked"       -- Set if Not eXists (distributed lock)
INCR counter                       -- Atomic increment → 1, 2, 3...
INCRBY counter 10                  -- Increment by 10
MSET key1 "val1" key2 "val2"      -- Set multiple
MGET key1 key2                     -- Get multiple
TTL key                            -- Time to live (seconds)
EXPIRE key 300                     -- Set TTL
DEL key                            -- Delete
```

### Hashes (objects)
```redis
HSET user:1 name "Divesh" age 22 city "Coimbatore"
HGET user:1 name                -- "Divesh"
HGETALL user:1                  -- All fields and values
HINCRBY user:1 age 1            -- Increment field
HDEL user:1 city                -- Delete field
HEXISTS user:1 email            -- Check field exists
```

### Lists (queues)
```redis
LPUSH queue:emails "email1" "email2"   -- Push to left (head)
RPUSH queue:emails "email3"            -- Push to right (tail)
LPOP queue:emails                      -- Pop from left
RPOP queue:emails                      -- Pop from right
BRPOP queue:emails 30                  -- Blocking pop (wait up to 30s)
LRANGE queue:emails 0 -1               -- Get all elements
LLEN queue:emails                      -- Length
```

### Sets (unique values)
```redis
SADD online:users "user:1" "user:2" "user:3"
SREM online:users "user:1"             -- Remove
SMEMBERS online:users                   -- All members
SISMEMBER online:users "user:2"         -- Is member? → 1 (true)
SCARD online:users                      -- Count
SINTER set1 set2                        -- Intersection
SUNION set1 set2                        -- Union
SDIFF set1 set2                         -- Difference
```

### Sorted Sets (leaderboards, priority queues)
```redis
ZADD leaderboard 100 "Divesh" 90 "Alice" 80 "Bob"
ZRANGE leaderboard 0 -1 WITHSCORES     -- Ascending
ZREVRANGE leaderboard 0 2 WITHSCORES   -- Top 3 descending
ZSCORE leaderboard "Divesh"             -- Get score → 100
ZINCRBY leaderboard 5 "Divesh"          -- Increment score
ZRANK leaderboard "Divesh"              -- Rank (0-based, ascending)
ZRANGEBYSCORE leaderboard 80 100        -- Score range
ZCARD leaderboard                       -- Count
```

### Pub/Sub
```redis
-- Subscriber
SUBSCRIBE channel:orders
PSUBSCRIBE channel:*                   -- Pattern subscribe

-- Publisher
PUBLISH channel:orders '{"orderId": 1, "status": "created"}'
```

---

## 3. Caching Patterns

### Q: Cache-Aside (Lazy Loading)

```typescript
async function getUser(id: string): Promise<User> {
  // 1. Check cache
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);
  
  // 2. Cache miss → query database
  const user = await db.user.findUnique({ where: { id } });
  
  // 3. Store in cache with TTL
  await redis.set(`user:${id}`, JSON.stringify(user), "EX", 300); // 5 min
  
  return user;
}

// Invalidate on update
async function updateUser(id: string, data: Partial<User>) {
  await db.user.update({ where: { id }, data });
  await redis.del(`user:${id}`); // Invalidate cache
}
```

### Q: Write-Through Cache
```typescript
async function updateUser(id: string, data: Partial<User>) {
  const user = await db.user.update({ where: { id }, data });
  await redis.set(`user:${id}`, JSON.stringify(user), "EX", 300);
  return user;
}
```

### Q: Write-Behind (Write-Back)
Write to cache immediately, sync to DB asynchronously (in batches). Risky but fast.

---

## 4. Your TaxiBy Use Cases (Resume-Specific)

### H3 Geospatial Index with Redis Sets
```typescript
// Store driver in H3 hex cell
const h3Index = h3.latLngToCell(lat, lng, 7); // Resolution 7
await redis.sAdd(`h3:${h3Index}`, driverId);

// Find nearby drivers — get adjacent hex cells
const neighbors = h3.gridDisk(h3Index, 1); // k=1 ring
const driverIds = await Promise.all(
  neighbors.map(hex => redis.sMembers(`h3:${hex}`))
);
// O(1) lookup per cell! < 2ms vs expensive PostGIS polygon queries

// When driver moves, update cell
await redis.sRem(`h3:${oldH3Index}`, driverId);
await redis.sAdd(`h3:${newH3Index}`, driverId);
```

### Google Maps Directions Cache (70-80% cost reduction)
```typescript
function roundCoord(coord: number): number {
  return Math.round(coord * 1000) / 1000; // ~111m precision
}

async function getDirections(origin: LatLng, destination: LatLng) {
  const key = `directions:${roundCoord(origin.lat)},${roundCoord(origin.lng)}:${roundCoord(destination.lat)},${roundCoord(destination.lng)}`;
  
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached); // Cache HIT — saved API call!
  
  const result = await googleMapsClient.directions({ origin, destination });
  await redis.set(key, JSON.stringify(result), "EX", 86400); // 24h TTL
  return result;
}
```

### Redis Pub/Sub for Real-time Socket.IO
```typescript
// Socket.IO with Redis adapter — scales across multiple server instances
import { createAdapter } from "@socket.io/redis-adapter";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
// Now events broadcast across ALL server instances!
```

---

## 5. Distributed Lock (Redlock)

```typescript
async function acquireLock(key: string, ttl: number): Promise<boolean> {
  const lockKey = `lock:${key}`;
  const lockValue = crypto.randomUUID();
  
  // SET NX (set if not exists) + EX (expiry)
  const acquired = await redis.set(lockKey, lockValue, "NX", "EX", ttl);
  
  if (acquired === "OK") {
    return true; // Lock acquired
  }
  return false; // Already locked
}

async function releaseLock(key: string, value: string) {
  // Lua script — atomic check-and-delete
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(script, 1, `lock:${key}`, value);
}
```

---

## 6. Persistence

| Method | How | Pros | Cons |
|--------|-----|------|------|
| RDB (Snapshot) | Point-in-time snapshots | Fast recovery, small files | Data loss between snapshots |
| AOF (Append-Only File) | Logs every write | Minimal data loss | Larger files, slower |
| RDB + AOF | Both | Best of both | More disk usage |

---

## 7. Eviction Policies

When Redis runs out of memory:
- `noeviction` — return errors for writes (default)
- `allkeys-lru` — evict least recently used keys
- `volatile-lru` — evict LRU keys with TTL set
- `allkeys-random` — evict random keys
- `volatile-ttl` — evict keys with shortest TTL

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| String | SET/GET. Counters with INCR. Locks with SETNX. |
| Hash | Object fields. HSET/HGET/HGETALL. |
| List | Queue. LPUSH/RPUSH/LPOP/RPOP. Blocking with BRPOP. |
| Set | Unique values. SADD/SMEMBERS. Intersection/Union. |
| Sorted Set | Scores. ZADD/ZRANGE. Leaderboards. |
| Pub/Sub | PUBLISH/SUBSCRIBE. Real-time messaging. |
| Cache-Aside | Check cache → miss → query DB → store in cache |
| TTL | Set expiry. EX (seconds), PX (milliseconds) |
| Persistence | RDB (snapshots) + AOF (log every write) |
| Eviction | allkeys-lru most common. noeviction is default. |
| Distributed Lock | SETNX + EX + Lua script for atomic release |
