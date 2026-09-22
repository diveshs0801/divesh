# Divesh S — Software Engineer (1+ YOE) Master Interview Preparation Suite

> **Comprehensive, 360-degree technical interview preparation handbook covering theory, deep internals, production architecture, code implementations, and battle-tested answers from basic to advanced.**

---

## 📚 Table of Contents & Module Map

| # | Module Folder | Key Topics Covered | File Link |
|---|---|---|---|
| **01** | `01-javascript-es6+` | V8 Engine internals, Execution Context, Closures, Event Loop, Promises, Prototypes, Memory GC | [01-javascript-es6+](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/01-javascript-es6+/README.md) |
| **02** | `02-typescript` | Type system, Generics, Utility Types, Decorators, `never` vs `unknown`, Type Narrowing | [02-typescript](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/02-typescript/README.md) |
| **03** | `03-nodejs` | Libuv, Event Loop phases, Streams, Buffers, Worker Threads, Clustering, Child Processes | [03-nodejs](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/03-nodejs/README.md) |
| **04** | `04-nestjs` | Dependency Injection, Modules, Providers, Guards, Interceptors, Pipes, Filters, Microservices | [04-nestjs](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/04-nestjs/README.md) |
| **05** | `05-expressjs` | Routing, Middleware chaining, Error handling, Security headers, Rate limiting | [05-expressjs](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/05-expressjs/README.md) |
| **06** | `06-nextjs-react` | Next.js 16 App Router, React 19, Server Actions, SSR/SSG/ISR, Hydration, TanStack Query | [06-nextjs-react](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/06-nextjs-react/README.md) |
| **07** | `07-go-golang` | Goroutines, Channels, Mutexes, Select, Slices, Interfaces, Pointers, Error handling | [07-go-golang](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/07-go-golang/README.md) |
| **08** | `08-sql-postgresql` | ACID, Indexing (B-Tree, GIN, GiST), Transactions, Locks (`SELECT FOR UPDATE`), PostGIS | [08-sql-postgresql](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/08-sql-postgresql/README.md) |
| **09** | `09-mongodb` | Aggregation pipelines, Sharding, Replication, Indexing, Document schemas | [09-mongodb](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/09-mongodb/README.md) |
| **10** | `10-redis` | Data structures (Hashes, Sets, Sorted Sets), Pub/Sub, Eviction policies, Redis Streams | [10-redis](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/10-redis/README.md) |
| **11** | `11-docker` | Containerization, Multi-stage Dockerfiles, Compose, Networking, Volume mounts | [11-docker](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/11-docker/README.md) |
| **12** | `12-microservices-architecture`| Service Discovery, Circuit Breaker, Saga Pattern, Distributed Tracing, Event-Driven | [12-microservices-architecture](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/12-microservices-architecture/README.md) |
| **13** | `13-apache-kafka` | Topics, Partitions, Consumer Groups, Offsets, Exactly-Once vs At-Least-Once, Rebalancing | [13-apache-kafka](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/13-apache-kafka/README.md) |
| **14** | `14-rabbitmq` | Exchanges (Direct, Fanout, Topic), Queues, Bindings, Dead Letter Queues (DLQ), Prefetch | [14-rabbitmq](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/14-rabbitmq/README.md) |
| **15** | `15-websockets-socketio` | Full-duplex connections, Heartbeats, Rooms, Scaling with Redis Adapter, Reconnection | [15-websockets-socketio](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/15-websockets-socketio/README.md) |
| **16** | `16-grpc` | Protocol Buffers (proto3), HTTP/2, Unary & Streaming RPCs, gRPC vs REST benchmarks | [16-grpc](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/16-grpc/README.md) |
| **17** | `17-api-gateway` | Reverse Proxy, Rate limiting, Token Bucket, JWT Validation, KrakenD, Routing | [17-api-gateway](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/17-api-gateway/README.md) |
| **18** | `18-system-design` | Scaling, Caching strategies, CAP theorem, Database Sharding, Ride-Hailing System Design | [18-system-design](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/18-system-design/README.md) |
| **19** | `19-git-version-control` | Git Internals (Blobs, Trees, Commits), Reset vs Revert, Interactive Rebase, Bisect, Hooks | [19-git-version-control](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/19-git-version-control/README.md) |
| **20** | `20-dsa-coding-problems` | Arrays, Sliding Window, Linked Lists, Trees, Graphs, DP, LRU Cache, Rate Limiter | [20-dsa-coding-problems](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/20-dsa-coding-problems/README.md) |
| **21** | `21-resume-projects-deep-dive` | TaxiBy & ERP Multi-Tenant Defense: H3 Res 7, Kalman, RDP, Double-Entry, Cashfree 2FA, Outbox | [21-resume-projects-deep-dive](file:///home/webnox/.gemini/antigravity-ide/scratch/divesh-interview-prep/21-resume-projects-deep-dive/README.md) |

---

## 🎯 30-Day Master Study Roadmap

```
Week 1: Core Languages & Runtime Fundamentals
├── Day 1-2: JavaScript ES6+ internals (01) & TypeScript Advanced Types (02)
├── Day 3-4: Node.js Runtime, Libuv, Event Loop (03) & Express.js (05)
└── Day 5-7: Go (Golang) Concurrency & Memory (07)

Week 2: Backend Frameworks, Real-Time & Frontend
├── Day 8-9: NestJS Architecture, DI, Guards, Interceptors (04)
├── Day 10-11: Next.js 16 App Router, React 19, Server Actions, TanStack Query (06)
└── Day 12-14: WebSockets & Socket.IO + Redis Adapter Scaling (15)

Week 3: Databases, Caching & Distributed Systems
├── Day 15-16: SQL, PostgreSQL, Indexing, Transactions, PostGIS (08) & MongoDB (09)
├── Day 17-18: Redis Data Structures & Caching Patterns (10)
└── Day 19-21: Docker (11), Microservices (12), Kafka (13), RabbitMQ (14), gRPC (16), API Gateway (17)

Week 4: System Design, DSA & Resume Project Defense
├── Day 22-24: System Design Framework & Scaling (18) & Git (19)
├── Day 25-27: DSA Must-Solve Coding Problems & Real-World System DSA (20)
└── Day 28-30: Complete Resume Project Interrogation & Mock Interviews (21)
```

---

## 💼 Behavioral & HR Questions (STAR Method for 1 YOE)

### 1. "Tell me about yourself." (The 90-Second Winning Pitch)
> "I am a Software Engineer with 1+ year of professional experience building high-concurrency backend services, distributed systems, and modern full-stack platforms using NestJS, Go, Next.js, and PostgreSQL.
>
> In my recent role at Webnox Technologies, I architected the core distributed backend for TaxiBy, an enterprise ride-hailing and fleet mobility platform. Some of my key engineering accomplishments include slashing Google Maps API costs by 70–80% via an intelligent Redis caching proxy, engineering sub-second driver dispatch and live telematics using Uber's H3 Hexagonal Spatial Index, and eliminating stationary GPS drift using a 1D Kalman Filter and RDP algorithm.
>
> I've also worked on distributed microservices in Go, implementing the Transactional Outbox pattern with Kafka and high-throughput API gateways using KrakenD. I enjoy solving challenging distributed data and concurrency problems, and I'm excited to bring this strong engineering foundation to your team."

---

### 2. "Tell me about a challenging technical bug you encountered and how you resolved it."
- **Situation**: In our ride-hailing platform (TaxiBy), drivers waiting at pickup points or stoplights generated false distance readings due to stationary GPS signal fluctuation (multipath drift).
- **Task**: Over a 20-minute ride, accumulated phantom drift added 1.2 to 2.5 kilometers to the ride distance, causing overbilling complaints and customer dispute tickets.
- **Action**: I researched mathematical noise filtering algorithms and implemented a custom **1D Kalman Filter** in TypeScript that evaluates the uncertainty covariance of sensor readings versus actual vehicle velocity. I paired this with the **Ramer-Douglas-Peucker (RDP)** polyline simplification algorithm.
- **Result**: We eliminated stationary drift, completely resolved overbilling disputes, and reduced the telemetry payload stored and transferred over WebSockets by **~85%**.

---

### 3. "Tell me about a time you optimized performance or reduced infrastructure costs."
- **Situation**: Our ride-hailing app's Google Maps Directions API usage was driving monthly costs of ₹35,000–₹40,000 because riders frequently requested ride estimates and route previews.
- **Task**: Reduce external API costs without degrading user experience or pricing accuracy.
- **Action**: I noticed that nearby pickup coordinates differed only by a few meters (same street corner). I engineered a backend proxy with **coordinate rounding to 3 decimal places (~110-meter precision)** stored in Redis with a 7-day TTL. In addition, I created an offline pure-TypeScript pricing engine for preliminary screen estimates.
- **Result**: Achieved a **72–78% cache hit ratio**, reducing monthly Google Maps billing by **70–80%** (saving ₹25,000–₹35,000 each month) while improving API response time from 350ms to under 15ms.

---

### 4. "Why are you looking for a new opportunity after 1 year?"
> "Over the past year, I've had the opportunity to take on deep architectural ownership—from designing event-driven microservices in Go and Kafka to building real-time telematics with H3 and Redis. I am grateful for that rapid growth. Now, I am looking to step into a high-scale engineering team where I can solve deeper scalability challenges, work alongside seasoned staff engineers, and contribute to mission-critical distributed systems."

---

## ⚡ Quick-Fire Technical Cheatsheet for Interviews

| Topic | 10-Second Recall Hook |
|---|---|
| **Event Loop** | Timers $\rightarrow$ Pending I/O $\rightarrow$ Idle/Prepare $\rightarrow$ Poll $\rightarrow$ Check $\rightarrow$ Close. Microtasks run between every macrotask. |
| **Uber H3** | Hexagons have 6 equidistant neighbors; Res 7 = 1.22 km edge; O(1) Redis Set lookup via `SUNION`. |
| **Kalman Filter** | Blends predicted physical state with noisy GPS measurements via dynamic Kalman Gain $K$. |
| **Outbox Pattern** | Writes business entity + outbox event in the same DB transaction; background worker relays to Kafka. Eliminates dual-write failure. |
| **Double-Entry** | Every debit has an equal credit. Decimal precision + `SELECT FOR UPDATE` + Idempotency keys eliminate race conditions. |
| **RSA-OAEP 2FA** | Dynamic signature (`clientId.timestamp`) encrypted with public key; frees containers from static IP whitelisting. |
| **gRPC** | HTTP/2 binary Protocol Buffers. 7-10x faster serialization than JSON with strict type contracts. |
| **CAP Theorem** | You can only choose 2 of 3: Consistency, Availability, Partition Tolerance. In distributed networks, you choose CP or AP. |
| **Index B-Tree** | Balanced search tree; $O(\log n)$ lookup; supports range queries (`BETWEEN`, `<`, `>`). |
| **LRU Cache** | Hash Map ($O(1)$ lookup) + Doubly Linked List ($O(1)$ remove & insert to head). |

---

*Compiled specifically for Divesh S. All technical answers verified against active production architectures.*
