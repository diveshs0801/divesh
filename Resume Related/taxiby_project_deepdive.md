# TaxiBy: Enterprise Ride-Hailing & Fleet Mobility Platform
## Comprehensive Architecture, Deep-Dive & Interview Playbook

---

## 1. Project Overview (Elevator Pitch)

**"TaxiBy"** is an enterprise-grade, high-concurrency ride-hailing and fleet mobility platform (comparable to Uber / Ola) architected as a distributed monorepo. It features:
* **High-throughput NestJS microservices backend** (`core`, `tracking`, `notifications`).
* **Real-time bidirectional telemetry** via WebSockets (Socket.IO) + Redis Pub/Sub Adapter.
* **Sub-second spatial querying** using **Uber’s H3 Hexagonal Spatial Indexing**.
* **Asynchronous message-driven notification pipeline** using **RabbitMQ** and **BullMQ**.
* **Financial double-entry ledgering** and automated banking disbursals with **Cashfree / Razorpay**.
* **Multi-tenant web portals** (Superadmin, Employee/Call-Center CRM, and Rider Web Booking App) built with **Next.js 16 (React 19)**, **TanStack Query**, and **Tailwind CSS**.

---

## 2. Ready-to-Use Resume Bullet Points

### 💼 For a Backend / Distributed Systems Role
* **Microservices Architecture:** Architected a high-concurrency ride-hailing backend in **NestJS** using a microservices pattern (`core`, `tracking`, `notifications`), processing real-time driver telemetry, dynamic surge pricing, and automated ride dispatching for thousands of active drivers.
* **Uber H3 Geospatial Lookups:** Engineered a sub-second driver dispatch & tracking engine leveraging **Uber’s H3 Spatial Index (Resolution 7)** and **Redis in-memory sets**, replacing expensive polygonal database spatial queries with $O(1)$ geohash lookups (<2ms latency).
* **Kalman Filter & Telemetry Compression:** Implemented real-time GPS noise reduction & smoothing via a custom **1D Kalman Filter** and **Ramer-Douglas-Peucker (RDP)** polyline simplification, eliminating stationary GPS drift, preventing customer over-billing disputes, and slashing telemetry payload sizes by **~85%**.
* **Google Maps API Optimization (70–80% Cost Cut):** Cut third-party Google Maps API overhead by **70–80%** (saving ₹25k–₹35k/month) by designing a centralized backend Directions & Geocoding proxy with coordinate-rounding Redis cache and building an offline pure-TypeScript pricing engine.
* **Double-Entry Financial Ledger:** Built an **immutable double-entry wallet ledger** using **PostgreSQL (Prisma)** transactions with strict Decimal precision and idempotency keys to eliminate race conditions, double-crediting, and IEEE-754 floating-point drift across ride payments, commissions, and negative-balance debt carryforwards.
* **Dynamic RSA-OAEP 2FA Disbursals:** Integrated automated banking disbursals via **Cashfree Payouts V2**, engineering dynamic **RSA-OAEP cryptographic 2FA signatures** (`X-Cf-Signature`) to bypass static IP whitelisting and enable elastic cloud container scaling.
* **Asynchronous Alerting Pipeline:** Decoupled notification and alerting pipelines using **RabbitMQ** topic exchanges and **BullMQ**, ensuring at-least-once delivery for FCM mobile push, Web Push, and urgent SOS alerts to emergency call centers.

### 💼 For a Full-Stack Role
* **Modern Next.js 16 / React 19 Portals:** Spearheaded development of 3 **Next.js 16 (React 19)** enterprise dashboards (Superadmin, Employee Call-Center CRM, and Customer Booking Web App) backed by TanStack Query, Tailwind CSS, and Leaflet/Mapbox.
* **Real-time Live Telematics:** Implemented real-time fleet telematics & SOS monitoring on interactive live maps using **Socket.IO** with **Redis Pub/Sub adapter**, enabling sub-second latency across distributed server instances.
* **Call-Center CRM & Audio Waveforms:** Engineered an in-house Call-Center CRM integrating **Exotel IVR webhooks**, click-to-call session masking, and audio waveform playback using **WaveSurfer.js** for immediate auditability of customer-driver calls.
* **Document Verification State Machine:** Designed a granular document verification state machine for driver onboarding (Aadhaar, PAN, DL, RC) featuring automated status invalidation (`PENDING` reset) upon any credential modification to eliminate fraud.

---

## 3. Architectural Trade-offs (What Interviewers LOVE to Ask)

### ⚖️ Trade-off 1: Uber H3 Hexagonal Indexing vs. PostGIS ST_DWithin / MongoDB 2dsphere
* **The Problem:** Traditional relational spatial queries (`WHERE ST_DWithin(...)`) perform heavy CPU-bound trigonometry on database disks. Under high concurrent driver location pings (every 3–5 seconds), DB connection pools saturated and CPU usage spiked to 90%+.
* **The Solution:** Indexed online drivers into 64-bit integer H3 hexagonal cells (`latLngToCell(lat, lng, 7)`) stored directly in Redis Sets (`h3:<h3Index>:drivers`).
* **The Trade-off:** Hexagons cover boundaries slightly less smoothly than exact circular radii (a driver 1.1 km away might be in an adjacent ring). However, spatial lookup dropped from $O(N)$ with heavy DB locks to an **$O(1)$ in-memory lookup taking $<2\text{ ms}$**, taking all tracking pressure off PostgreSQL.

```
Traditional PostGIS:
[Driver Ping] ──────> [Postgres Write Lock] ──> Disk Trigonometry ──> High CPU / DB Bottleneck

TaxiBy H3 Architecture:
[Driver Ping] ──────> [Kalman Filter] ───────> latLngToCell(lat, lng, 7) 
                                                      │
                                                      ▼
                                           Redis Set [O(1) Memory Lookup < 2ms]
```

---

### ⚖️ Trade-off 2: Kalman Filter & Stationary Snapping vs. Raw GPS Stream
* **The Problem:** When drivers wait at traffic lights, mobile GPS hardware drifts by 5–25 meters due to urban canyons and atmospheric noise. This caused the vehicle icon on rider screens to jitter randomly and inflated computed trip distance, leading to fare disputes.
* **The Solution:** Implemented a continuous in-memory filter state (`kalmanLat`, `kalmanLng`, `stationarySince`) via `GPSUtility`:
  1. Discards points with accuracy $>50\text{ meters}$.
  2. Snaps speed to 0 and fixes coordinates if displacement is $<10\text{ meters}$ or speed $<1\text{ m/s}$.
  3. Applies a 1D Kalman Filter matrix on moving points to smooth out zig-zag jitter.
* **The Trade-off:** Adds minor computational overhead (~$0.05\text{ ms}$ per ping) and requires maintaining driver state in Redis cache. The upside is zero zig-zag distance inflation, realistic map rendering, and eliminating customer billing complaints.

---

### ⚖️ Trade-off 3: Backend Directions Proxy with Coordinate Rounding vs. Direct Client Maps API
* **The Problem:** Every time a user opened booking details or selected a ride, the frontend called Google Directions API directly. Identical routes (e.g., Airport $\to$ Central Station) were queried thousands of times, bleeding ₹35,000–₹42,000/month.
* **The Solution:** Routed all requests through a NestJS proxy that rounds origin/destination coordinates to 3 decimal places (~110 meters) to create a cache key in Redis (`dir:cache:<lat1,lng1>:<lat2,lng2>`) with a multi-day TTL.
* **The Trade-off:** Coordinates within ~100m share cached polyline and distance results. For upfront price estimation, a ~100m variance produces a negligible fare difference ($\pm ₹2$), while reducing Google API billing by **70–80%**.

---

### ⚖️ Trade-off 4: Asynchronous Message Queuing (RabbitMQ) vs. Monolithic In-Memory Events
* **The Problem:** Sending FCM push notifications, transactional emails, and SOS alerts synchronously within HTTP request cycles introduced 300–800ms API latency and risked dropping notifications if third-party providers (FCM/SendGrid/SES) throttled or had network glitches.
* **The Solution:** Decoupled core from notifications microservice using RabbitMQ durable topic queues (`push_notification_queue`, `email_queue`, `sos_queue`) and BullMQ with Dead-Letter Exchanges (DLX).
* **The Trade-off:** Introduces infrastructure complexity (managing RabbitMQ broker, dead-letter exchanges, and consumer health checks). The gain is non-blocking API responses ($<50\text{ ms}$) and guaranteed at-least-once message delivery with automatic backoff retries.

---

### ⚖️ Trade-off 5: Strict Double-Entry Ledger & Decimals vs. Mutable Balances & Floats
* **The Problem:** In driver wallet systems, concurrency issues (network retries, simultaneous ride completions) and JavaScript floating-point arithmetic (`0.1 + 0.2 !== 0.3`) create irrecoverable balance mismatches.
* **The Solution:**
  1. No code ever updates `driver.walletBalance` directly; all changes go through an atomic `recordLedger()` within a Prisma interactive transaction.
  2. Every change writes an immutable `WalletLedger` row containing `transactionType`, `referenceId` (e.g., `bookingId`), running balance snapshot, and signed amount.
  3. Uses `referenceId + transactionType` unique database constraint to guarantee strict idempotency.
  4. All monetary calculations use arbitrary-precision `Decimal`.
* **The Trade-off:** Slightly higher write load on the database per transaction, but provides a 100% auditable accounting trail and zero duplicate credit/debit bugs.

---

## 4. Deep-Dive Optimizations & Code Highlights

### 1. Dynamic RSA-OAEP 2FA for Cashfree Disbursals
* **The Challenge:** Traditional payment gateways require static server IP whitelisting to disburse funds. In modern cloud setups (Docker / Kubernetes / AWS ECS), container IPs change dynamically upon deployment and autoscaling.
* **Your Solution:** Implemented dynamic asymmetric cryptographic authentication via Node.js `crypto.publicEncrypt(RSA_PKCS1_OAEP_PADDING)`. On every disbursal request, generated an encrypted header:
  $$\text{Base64}\left(\text{RSA_OAEP_Encrypt}\left(\text{clientId} + "." + \text{epochSeconds},\, \text{publicKey}\right)\right)$$
* **Impact:** Satisfied Cashfree's 2FA requirement, allowing automated payouts without locking the infrastructure to static IPs.

### 2. S3 Presigned URL Multi-Tier Caching
* **The Challenge:** S3 presigned URLs expire in 60 minutes. Generating them on high-throughput endpoints (e.g., driver avatars, vehicle photos) involves repeated HMAC-SHA256 signature calculations and network latency.
* **Your Solution:** Implemented a Redis cache layer (`url:signed:<s3_key>`) with a 45-minute TTL (15-minute safety buffer before expiration), eliminating thousands of redundant AWS SDK calls.

### 3. Ramer-Douglas-Peucker (RDP) Polyline Simplification
* **The Challenge:** During an hour-long ride, a driver generates thousands of GPS coordinate points. Returning all raw points for route playback overloaded frontend maps and consumed high bandwidth.
* **Your Solution:** Applied the RDP algorithm (`simplifyPolyline(points, epsilon = 5.0)`) on the backend to reduce coordinate arrays by **80–90%** while preserving the visual geometry of the route.

### 4. Granular Document Verification & Invalidation Workflow
* **The Challenge:** Drivers could submit valid documents (Aadhaar, PAN, DL, RC), get approved, and then secretly edit metadata or re-upload invalid images.
* **Your Solution:** Implemented per-document lifecycle management where each document has independent approval statuses (`PENDING`, `APPROVED`, `REJECTED`). Added an automatic status reset trigger: any update to document numbers, expiry dates, or image assets immediately invalidates the status back to `PENDING`, preventing drivers from operating with altered credentials without admin re-verification.

---

## 5. Potential Interview Questions & Strong Model Answers

### Q1: "How did you scale real-time driver tracking without overloading the database?"
> **Strong Answer:**  
> *"Instead of writing raw GPS updates from thousands of drivers directly into PostgreSQL, we built a dedicated tracking microservice powered by Redis and Uber's H3 spatial indexing.*  
> 
> *When a driver sends a location ping, we pass the coordinates through a 1D Kalman filter for noise cancellation, compute the H3 cell at Resolution 7 (~1.2 km edge length), and update a Redis Hash and an H3 driver set with a rolling TTL.*  
> 
> *Spatial searches (finding nearest drivers) query Redis sets in $O(1)$ time. We only persist batched trip summaries and snap-to-road coordinates to PostgreSQL when the ride completes. This kept our database CPU at <15% even during peak load."*

### Q2: "How did you prevent double-spending or duplicate driver payouts?"
> **Strong Answer:**  
> *"We enforced three distinct layers of defense:*  
> 1. ***Client-Side Idempotency Keys:*** *Passed to our Cashfree disbursal service, preventing duplicate payment requests on network retries.*  
> 2. ***Database-Level Atomic Transactions:*** *Balance updates and ledger records are created inside a single Prisma interactive transaction (`$transaction`).*  
> 3. ***Immutable Double-Entry Ledger:*** *The `recordLedger()` function enforces an idempotency check against a unique constraint on `(referenceId, transactionType)`. If a request with the same booking or settlement ID is re-transmitted, the database rejects the duplicate transaction before modifying the wallet balance."*

### Q3: "How did you achieve a 70–80% cost reduction on Google Maps APIs?"
> **Strong Answer:**  
> *"We audited our GCP billing and discovered Directions and Places APIs accounted for nearly 90% of our expenses because web and mobile frontends were querying Google directly without caching.*  
> 
> *We resolved this through a three-pronged approach:*  
> 1. ***Offline Pricing Engine:*** *Built an internal pure-TypeScript pricing engine using the Haversine formula and historical traffic multipliers instead of calling the Distance Matrix API on every initial fare estimate.*  
> 2. ***Backend Directions Proxy with Coordinate Rounding:*** *Routed route queries through a NestJS proxy that rounds coordinates to ~110m resolution (3 decimal places) and caches the polyline in Redis with a multi-day TTL. Identical pickup/drop pairs hit cache in <5ms.*  
> 3. ***Autocomplete Session Tokens:*** *Grouped multiple autocomplete keystrokes into a single session SKU rather than paying per keystroke."*

---

## 6. Summary Checklist for Your Resume & LinkedIn

* **Core Stack:** NestJS, TypeScript, Next.js 16 (React 19), PostgreSQL (Prisma), Redis, RabbitMQ, BullMQ, Docker, Socket.IO.
* **Key Concepts:** Microservices, Geohashing (Uber H3), Kalman Filter, WebSockets (Socket.IO + Redis Adapter), Event-Driven Architecture, Double-Entry Financial Ledger, Idempotent APIs, Dynamic RSA-OAEP 2FA.
* **Measurable Impact:** 70–80% API cost reduction (saving ₹25k–₹35k/mo), sub-2ms geospatial lookups, 85% telemetry payload compression, automated zero-downtime banking payouts.
