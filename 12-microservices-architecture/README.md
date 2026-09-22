# Microservices Architecture — Complete Interview Guide

---

## 1. Core Concepts

### Q: What are Microservices?
An architectural style where an application is a collection of small, independent services that:
- Are independently deployable
- Own their own data
- Communicate over network (HTTP, gRPC, messaging)
- Are organized around business capabilities

### Q: Monolith vs Microservices

| Monolith | Microservices |
|----------|--------------|
| Single deployable unit | Multiple independent services |
| Shared database | Database per service |
| Simple to develop initially | Complex infrastructure |
| Scales as a whole | Scale individual services |
| One failure can crash all | Fault isolation |
| Easy local development | Needs Docker/K8s |

---

## 2. Communication Patterns

### Synchronous
```
REST (HTTP/JSON) — Simple, stateless, widely supported
gRPC (HTTP/2, Protobuf) — Fast, type-safe, bidirectional streaming
```

### Asynchronous (Event-Driven)
```
Message Broker (Kafka, RabbitMQ) — Decoupled, resilient, eventual consistency
Event Sourcing — Store events, not state
CQRS — Separate read and write models
```

### Q: When to use Sync vs Async?

| Sync (REST/gRPC) | Async (Kafka/RabbitMQ) |
|-------------------|----------------------|
| Need immediate response | Fire and forget |
| Simple request-response | Event notification |
| User-facing APIs | Background processing |
| Low latency required | High throughput |
| Strong consistency | Eventual consistency OK |

---

## 3. Patterns — Based on Your Experience

### API Gateway Pattern
```
Client → API Gateway → Microservice A
                     → Microservice B
                     → Microservice C

Responsibilities:
- Request routing
- Authentication/Authorization
- Rate limiting
- Load balancing
- Response aggregation
- CORS termination
- Request/Response transformation

Your experience: KrakenD — stateless JWT auth, CORS termination,
tenant context injection (X-Tenant-ID), 8000+ req/sec, <5ms overhead
```

### Database Per Service
```
Each service owns its database. No shared databases.

Order Service → orders_db (PostgreSQL)
User Service → users_db (PostgreSQL)
Analytics Service → analytics_db (MongoDB)
Cache Service → Redis

Benefits: Independent schema evolution, technology choice per service
Challenge: Cross-service queries, distributed transactions
```

### Saga Pattern (Distributed Transactions)
```
Problem: You can't use ACID transactions across services.

Choreography Saga (event-driven):
  Order Service → emit "OrderCreated"
  Payment Service → listens, processes payment → emit "PaymentCompleted"
  Inventory Service → listens, reserves stock → emit "StockReserved"
  
  If Payment fails → emit "PaymentFailed"
  → Inventory Service → compensate (release stock)
  → Order Service → compensate (cancel order)

Orchestration Saga (central coordinator):
  Saga Orchestrator:
    1. Call Order Service → create order
    2. Call Payment Service → charge payment
    3. Call Inventory Service → reserve stock
    If step 2 fails → call Order Service → cancel order
```

### Transactional Outbox Pattern (Your ERP project!)
```
Problem: Dual-write — updating DB AND publishing event can partially fail.

Solution:
1. Write to DB + outbox table in SAME transaction
2. Background worker reads outbox → publishes to Kafka → marks as sent

BEGIN TRANSACTION;
  INSERT INTO orders (id, ...) VALUES (...);
  INSERT INTO outbox (event_type, payload, status)
    VALUES ('OrderCreated', '{"orderId": 1}', 'PENDING');
COMMIT;

// Background relay worker:
// SELECT * FROM outbox WHERE status = 'PENDING'
// For each: publish to Kafka → UPDATE outbox SET status = 'SENT'
// With exponential backoff retry on failure

Guarantees: At-least-once delivery (consumers must be idempotent)
```

### Circuit Breaker Pattern
```
Prevents cascading failures when a downstream service is down.

States:
CLOSED → normal operation, requests pass through
OPEN → service is down, fail fast (don't even try)
HALF-OPEN → after timeout, allow one test request

       success
CLOSED ←──── HALF-OPEN
  │  failure     ↑  timeout
  │              │
  └──→ OPEN ────┘
     (fail fast)
```

### Event Sourcing
```
Instead of storing current state, store ALL events:

events table:
| id | aggregate_id | event_type     | data                    | timestamp  |
|----|-------------|----------------|-------------------------|------------|
| 1  | order:1     | OrderCreated   | {items: [...]}          | 2025-01-01 |
| 2  | order:1     | PaymentReceived| {amount: 500}           | 2025-01-01 |
| 3  | order:1     | OrderShipped   | {trackingId: "ABC123"}  | 2025-01-02 |
| 4  | order:1     | OrderDelivered | {}                      | 2025-01-05 |

Current state = replay all events in order
Benefits: Complete audit trail, time-travel debugging, event replay
```

### CQRS (Command Query Responsibility Segregation)
```
Separate the read model from the write model:

Write Side (Commands):
  createOrder() → normalize data → PostgreSQL (source of truth)
  → Emit event → Update read model

Read Side (Queries):
  getOrders() → denormalized view → Redis/Elasticsearch (optimized for reads)

Benefits: Optimize reads and writes independently, scale separately
```

---

## 4. Service Discovery & Communication

```
Service Discovery:
- DNS-based (Docker Compose service names)
- Registry-based (Consul, etcd)
- Kubernetes built-in (ClusterIP services)

Load Balancing:
- Client-side (service knows all instances)
- Server-side (API Gateway, NGINX, HAProxy)
- Kubernetes (kube-proxy)

Health Checks:
- Liveness: "Is the process alive?" → restart if dead
- Readiness: "Can it handle traffic?" → remove from load balancer if not
```

---

## 5. Data Consistency

### Q: How to handle data consistency across services?

```
Strong Consistency → Synchronous calls, distributed transactions (avoid if possible)
Eventual Consistency → Events/messages, async updates, idempotent consumers

Idempotency:
- Same operation applied multiple times = same result
- Use idempotency keys (unique request ID)
- Example: Payment with idempotency key — if key exists, return cached result

Deduplication:
- Store processed event IDs
- Before processing: check if event already processed
- Skip if duplicate
```

---

## 6. Observability (The Three Pillars)

```
1. Logging — structured JSON logs
   { "level": "info", "service": "orders", "traceId": "abc", "message": "Order created" }

2. Metrics — numbers over time
   - Request rate, error rate, latency (RED method)
   - CPU, memory, disk (USE method)
   - Tools: Prometheus + Grafana

3. Tracing — follow a request across services
   - Distributed trace ID propagated via headers
   - Tools: Jaeger, Zipkin, OpenTelemetry
   - See: Client → Gateway → OrderService → PaymentService → DB
```

---

## 7. Your Architecture (TaxiBy + ERP)

```
TaxiBy (NestJS Microservices):
├── Core Service (rides, bookings, pricing)
├── Tracking Service (GPS, H3, Kalman Filter)
├── Notification Service (push, SMS, email)
├── Redis (H3 geospatial, directions cache, pub/sub)
├── PostgreSQL (rides, users, wallet ledger)
├── Socket.IO + Redis Adapter (real-time tracking)
└── Google Maps Proxy (cached directions)

ERP (Go Microservices):
├── 11 Go microservices
├── Apache Kafka (15+ domain topics)
├── gRPC (inter-service communication)
├── KrakenD API Gateway (8000+ req/sec)
├── Transactional Outbox Pattern
├── PostgreSQL (per-service databases)
└── Docker (containerized deployment)
```

---

## Quick Revision

| Pattern | When to Use |
|---------|-------------|
| API Gateway | Single entry point. Auth, rate limit, routing. |
| Database per Service | Each service owns its data. No shared DB. |
| Saga | Distributed transactions. Choreography or Orchestration. |
| Outbox | Reliable event publishing. DB + outbox in same transaction. |
| Circuit Breaker | Prevent cascading failures. Fail fast. |
| Event Sourcing | Audit trail. Store events, not state. |
| CQRS | Separate read/write models for performance. |
| Idempotency | Handle duplicate messages safely. |
| Eventual Consistency | Accept delays in data sync between services. |
