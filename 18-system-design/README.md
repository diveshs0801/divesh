# System Design — Complete Interview Guide

---

## 1. How to Approach System Design

### Step-by-step framework:
```
1. CLARIFY REQUIREMENTS (2-3 min)
   - Functional: What should the system do?
   - Non-functional: Scale, latency, availability, consistency?
   - Constraints: Users, QPS, data size?

2. ESTIMATE SCALE (2-3 min)
   - Users: DAU, concurrent users
   - Traffic: QPS (queries per second)
   - Storage: Data per user × users × retention
   - Bandwidth: Request size × QPS

3. HIGH-LEVEL DESIGN (5-10 min)
   - Draw main components
   - Define APIs
   - Choose database

4. DEEP DIVE (10-15 min)
   - Data model & schema
   - Caching strategy
   - Scaling approach
   - Handle edge cases

5. WRAP UP (2-3 min)
   - Bottlenecks
   - Future improvements
   - Trade-offs made
```

---

## 2. Key Concepts

### Scaling
```
Vertical Scaling: Bigger machine (more CPU, RAM)
  - Simple but limited (hardware ceiling)

Horizontal Scaling: More machines
  - Load balancer distributes traffic
  - Stateless services (no session on server)
  - Database replication/sharding
```

### Load Balancing
```
Algorithms:
  - Round Robin: Distribute equally
  - Weighted Round Robin: More to powerful servers
  - Least Connections: Send to server with fewest active connections
  - IP Hash: Same client → same server (session affinity)

Layer 4 (TCP): Faster, less flexible
Layer 7 (HTTP): Can route based on URL, headers, cookies
```

### Caching
```
Where to cache:
  - Client-side (browser cache, CDN)
  - Application level (Redis, Memcached)
  - Database level (query cache)

Strategies:
  - Cache-Aside (Lazy Loading): Read → check cache → miss → DB → store in cache
  - Write-Through: Write to cache + DB simultaneously
  - Write-Behind: Write to cache → async sync to DB
  - Read-Through: Cache handles DB reads transparently

Cache Invalidation:
  - TTL (Time-To-Live) expiry
  - Event-based invalidation (on update → delete cache)
  - Write-through (update cache on write)

Cache Eviction:
  - LRU (Least Recently Used) — most common
  - LFU (Least Frequently Used)
  - FIFO (First In, First Out)
```

### Database Selection
```
Relational (PostgreSQL, MySQL):
  - ACID transactions
  - Complex queries/JOINs
  - Structured data
  - Use for: Financial data, user accounts, orders

NoSQL Document (MongoDB):
  - Flexible schema
  - Horizontal scaling
  - Hierarchical data
  - Use for: Product catalogs, CMS, user profiles

Key-Value (Redis):
  - Sub-ms latency
  - Caching, sessions, rate limiting
  - Use for: Cache, leaderboards, real-time counters

Wide-Column (Cassandra):
  - Massive write throughput
  - Time-series data
  - Use for: IoT, logs, analytics

Graph (Neo4j):
  - Relationship-heavy queries
  - Use for: Social networks, recommendation engines

Search (Elasticsearch):
  - Full-text search, fuzzy matching
  - Use for: Search functionality, log analysis
```

### Database Scaling
```
Replication:
  - Primary (write) → Replica(s) (read)
  - Read-heavy workloads: scale reads
  - Failover: if primary dies, promote replica

Sharding (Horizontal Partitioning):
  - Split data across multiple databases
  - Shard key determines which shard stores data
  - Range-based: users A-M → shard1, N-Z → shard2
  - Hash-based: hash(userId) % numShards → shardN
  
  Challenges:
  - Cross-shard queries (expensive)
  - Rebalancing when adding shards
  - No cross-shard JOINs
```

### CAP Theorem
```
In a distributed system, you can only guarantee 2 of 3:

Consistency (C): Every read gets the most recent write
Availability (A): Every request gets a response
Partition Tolerance (P): System works despite network failures

In practice (network failures are inevitable, so P is required):
  CP: Consistent but may be unavailable (PostgreSQL, MongoDB)
  AP: Available but may return stale data (Cassandra, DynamoDB)

Most real systems: Eventual Consistency
  - Writes propagate eventually
  - Brief window of stale reads
  - Better availability and performance
```

### Consistent Hashing
```
Problem: Simple hash (key % N) breaks when adding/removing servers
Solution: Consistent hashing — only K/N keys remap when server changes

Ring: Servers and keys mapped to positions on a circular ring
Key → clockwise to nearest server

Adding server: Only keys between new server and its predecessor remap
Removing server: Only its keys remap to next server

Virtual nodes: Each server has multiple positions on ring for better distribution
```

---

## 3. Common System Design Questions

### Design a URL Shortener (like bit.ly)
```
Requirements: Create short URL, redirect to original

API:
  POST /api/shorten { url: "https://..." } → { short: "abc123" }
  GET /{shortCode} → 301 Redirect to original URL

Components:
  Client → Load Balancer → App Server → Database + Cache

Key decisions:
  - Short code: Base62 encoding of auto-increment ID (a-z, A-Z, 0-9)
  - 6 chars = 62^6 = 56 billion unique URLs
  - Database: Key-value (shortCode → originalUrl)
  - Cache: Redis for hot URLs (cache-aside)
  - Analytics: Kafka → analytics pipeline (clicks, referrers)

Scale:
  - 100M URLs, 10B redirects/month
  - Reads >> Writes (cache-heavy)
  - Storage: 100M × 500 bytes = ~50 GB
```

### Design a Rate Limiter
```
Algorithms:
1. Fixed Window: Count requests in fixed time windows
   - Simple but spiky at window boundaries

2. Sliding Window Log: Store timestamp of each request
   - Accurate but memory-heavy

3. Sliding Window Counter: Weighted count from current + previous window
   - Balanced approach

4. Token Bucket: Bucket refills at constant rate
   - Allows bursts up to bucket size
   - Most commonly used

5. Leaky Bucket: Requests queue, processed at constant rate
   - Smooth output

Implementation (Redis Token Bucket):
  MULTI
  SET bucket:{userId} {maxTokens} NX EX {window}
  DECR bucket:{userId}
  EXEC
  If count < 0 → 429 Too Many Requests
```

### Design a Chat System
```
Components:
  Client ←→ WebSocket Gateway ←→ Chat Service → Message Store
                                 ←→ Presence Service (online/offline)
                                 ←→ Notification Service

Messages: Store in Cassandra (write-optimized, time-series)
  Partition key: chat_id
  Clustering key: timestamp

Online status: Redis (SET user:{id}:online "true" EX 30)
Group chat: Fan-out on write (store message for each recipient)
Read receipts: Event-based (message_read event)
```

---

## 4. Your System Designs (Resume-Based)

### TaxiBy — Real-time Ride-Hailing

```
Architecture:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Rider App    │    │  Driver App  │    │  Dashboard   │
│ (Next.js)    │    │  (Mobile)    │    │  (Next.js)   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
              ┌────────────▼────────────┐
              │     API Gateway /       │
              │     NGINX               │
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────▼──────┐ ┌───────▼───────┐ ┌──────▼───────┐
│ Core Service  │ │ Tracking Svc  │ │ Notification │
│ (NestJS)      │ │ (NestJS)      │ │ (NestJS)     │
│ Rides, Users, │ │ GPS, H3,      │ │ Push, SMS,   │
│ Wallet, Surge │ │ WebSocket     │ │ Email        │
└──────┬────────┘ └──────┬────────┘ └──────────────┘
       │                 │
  ┌────▼────┐    ┌──────▼──────┐
  │ Postgres │    │   Redis     │
  │ (Prisma) │    │ H3 cells,  │
  │ rides,   │    │ cache,     │
  │ wallet   │    │ pub/sub    │
  └──────────┘    └────────────┘

Key Design Decisions:
1. H3 Hexagonal Spatial Index — O(1) driver lookup (< 2ms)
2. Kalman Filter — GPS noise reduction, prevent overbilling
3. RDP Polyline — 85% telemetry payload reduction
4. Redis Directions Cache — 70-80% Google Maps cost reduction
5. Double-entry Wallet Ledger — Decimal precision, idempotency
6. Dynamic RSA-OAEP 2FA — Cashfree Payouts without static IPs
7. Socket.IO + Redis Adapter — Real-time across multiple instances
```

---

## 5. Estimation Cheatsheet

```
Powers of 2:
  2^10 = 1 Thousand (1 KB)
  2^20 = 1 Million (1 MB)
  2^30 = 1 Billion (1 GB)
  2^40 = 1 Trillion (1 TB)

Time:
  1 day = 86,400 seconds ≈ 10^5 seconds
  1 month = 2.5 × 10^6 seconds
  1 year = 3 × 10^7 seconds

Latency:
  L1 cache:        0.5 ns
  L2 cache:        7 ns
  RAM:             100 ns
  SSD random read: 150 μs
  HDD seek:        10 ms
  Network (same DC): 0.5 ms
  Network (cross DC): 150 ms

QPS:
  1 million DAU × 10 requests/day = 10M requests/day
  = 10M / 86400 ≈ 115 QPS (average)
  Peak = 2-3x average ≈ 300 QPS
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Scaling | Vertical (bigger) vs Horizontal (more machines) |
| Load Balancer | Distributes traffic. Round-robin, least connections. |
| Cache | Redis. Cache-aside. LRU eviction. TTL. |
| CAP | CP or AP (can't have all 3 in distributed system) |
| Sharding | Split data across DBs. Hash-based or range-based. |
| Replication | Primary-Replica. Scale reads. Failover. |
| Consistent Hashing | Minimal key remapping when servers change. |
| Rate Limiting | Token bucket most common. Redis-based. |
| CDN | Cache static content close to users. |
| Message Queue | Decouple services. Kafka, RabbitMQ. |
| Idempotency | Same request multiple times = same result. |
