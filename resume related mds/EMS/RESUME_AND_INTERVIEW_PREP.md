# Event Management System (EMS) — Resume & Interview Preparation Guide

---

# 1. Project Summary (Resume Header Version)

> **Event Management System (EMS)** — Full-Stack Marketplace & Event Ticketing Platform  
> **Role:** Full-Stack / Backend Engineer  
> **Scale & Architecture:** Microservices-ready full-stack platform comprising **3 Next.js/NestJS applications** (`ems-api`, `ems-web`, `ems-admin`), **6 containerized Docker services** (PostGIS PostgreSQL 16, RabbitMQ 3, MinIO S3 Object Storage), **39 Prisma relational models**, **26 business domain enums**, and **202 REST API endpoints** spanning **32 NestJS controllers** (~56,500+ lines of TypeScript). Deployed on custom domains (`webnoxdigital.com`) powering dual product workflows: a multi-vendor marketplace for event services/packages and an independent high-concurrency event publishing & ticketing engine.

---

# 2. Best Engineering Achievements (Resume Bullet Points)

Here are the 10 most technically impressive, interview-worthy engineering achievements extracted directly from the codebase.

---

### Achievement 1: Multi-Vendor Cart & Atomic Order Splitting Engine
*Code Reference:* [`ems-api/src/cart/cart.service.ts`](file:///d:/event%20management%20system/ems-api/src/cart/cart.service.ts), [`ems-api/src/booking/booking.service.ts`](file:///d:/event%20management%20system/ems-api/src/booking/booking.service.ts#L100-L260), [`ems-api/src/payment/payment.service.ts`](file:///d:/event%20management%20system/ems-api/src/payment/payment.service.ts#L182-L268)

#### a) The Resume Bullet
> **Architected an atomic multi-vendor checkout and order-splitting engine** using **NestJS, Prisma, and PostgreSQL**, enabling customers to bundle packages and standalone services from multiple independent organizers into a single cart, atomically splitting checkouts into isolated child bookings with automated lead-time validations, calendar slot auto-blocking, and dedicated 24-hour SLA response windows.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** Restricting customers to a single-vendor checkout (like traditional service booking sites) where users must create separate orders and pay multiple times if they need both a photographer and a caterer.
- **Why We Did NOT Do That:** Forcing separate checkouts creates massive cart abandonment and ruins the user experience for complex events like weddings, where customers routinely coordinate 3–6 different vendors for the same event date.
- **What We Gained:** A consumer-grade marketplace experience where users pay once, while the backend maintains strict multi-tenant vendor isolation. Each vendor receives an isolated booking record, distinct payout schedule, and independent acceptance SLA.
- **What It Cost Us:** Significant transactional complexity in checkout orchestration. We had to implement multi-entity availability pre-checks, dynamic coupon attribution across vendors, split cancellation policies, and multi-record settlement calculations.

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about how order splitting works in your checkout engine.**  
  *A:* "When a user checks out, our cart can contain a mix of bundled packages from one organizer and standalone services from another. The backend first executes real-time availability and lead-time validations across every item's date range. It then creates a single parent `Order` for the overall transaction and atomically splits it into $N$ child `Booking` records grouped by organizer, each calculating its own required deposit, balance due, and a 24-hour SLA deadline for organizer confirmation."
- **Q: Why did you choose order splitting over separate vendor carts?**  
  *A:* "Separate carts introduce major friction—users planning a function don't want to enter payment details 4 different times. By splitting at the order level, we unified customer billing into a single payment intent while giving vendors complete operational isolation in their dashboards."
- **Q: What was hard about this?**  
  *A:* "Handling partial failures and state synchronization. If an order contains three vendors, and one vendor declines or proposes a reschedule while the other two confirm, the system had to manage partial deposit refunds and individual availability slot releases without corrupting the parent order's financial ledger."
- **Q: What would you improve about this now?**  
  *A:* "I would introduce a distributed two-phase commit (2PC) or an event-driven saga pattern via RabbitMQ. Currently, the order creation and booking splits run within a synchronous NestJS flow; moving the post-payment fan-out to asynchronous message queues would reduce checkout response latency even further."

---

### Achievement 2: Algorithmic Multi-Dimensional Search & Geospatial Discovery Engine
*Code Reference:* [`ems-api/src/search/search.service.ts`](file:///d:/event%20management%20system/ems-api/src/search/search.service.ts#L65-L242), [`ems-api/src/common/services/geocoding.service.ts`](file:///d:/event%20management%20system/ems-api/src/common/services/geocoding.service.ts)

#### a) The Resume Bullet
> **Engineered a 6-factor hybrid search ranking engine** combining **PostgreSQL trigram similarity (`pg_trgm`)**, a **5-level text-matching hierarchy**, and a **Gaussian distance decay function (`35 * e^(-(d/55)^2)`)** powered by **PostGIS spatial geography points**, delivering sub-100ms discovery across 4,200+ Indian cities backed by a 4-tier geocoding cache.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** A basic SQL `WHERE city ILIKE '%...%' AND name ILIKE '%...%'` query or a rigid radial distance cutoff (e.g., `ST_DWithin` with a hard 50km radius).
- **Why We Did NOT Do That:** Hard cutoffs produce 'empty result' cliffs for users in semi-urban areas or nearby suburbs, while plain ILIKE queries fail on typos (e.g., 'photgrphy') and ignore vendor reputation, subscription tier, and customer follow relationships.
- **What We Gained:** Rich, ranked search results that smoothly blend proximity, relevance, and business monetization. A top-tier organizer 15km away can outrank an unrated vendor 2km away, while users still get typo-tolerant results.
- **What It Cost Us:** Higher CPU overhead for scoring in memory and raw SQL execution (`$queryRawUnsafe`) because Prisma lacks native support for PostGIS geography types and PostgreSQL trigram extensions.

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about the ranking algorithm in your search service.**  
  *A:* "Our search service uses a composite priority calculator that evaluates 6 weighted factors: user-follow status (+50 pts), geographic proximity (+40 pts via exact city match or an exponential Gaussian decay curve), organizer subscription tier (+25 pts for Advanced, +10 for Medium), average star rating (+20 pts max), popularity metrics based on bookings and follower counts (+20 pts), and a 5-level keyword match level (+20 pts). This ensures high-intent, high-quality vendors appear first."
- **Q: Why did you choose a Gaussian distance decay function instead of a fixed kilometer radius?**  
  *A:* "A fixed 30km radius creates a binary edge: a vendor at 29km appears, but a vendor at 31km is completely hidden. With Gaussian decay—specifically `35 * Math.exp(-Math.pow(distanceKm / 55, 2))`—proximity score drops smoothly, allowing outstanding, highly rated organizers in adjacent towns to remain discoverable while naturally giving nearby vendors an organic edge."
- **Q: What was hard about this?**  
  *A:* "Bridging Prisma ORM with PostGIS. Prisma doesn't natively map PostGIS `geography(Point, 4326)` columns, so I had to write raw PostgreSQL spatial queries and maintain a multi-tier geocoding fallback pipeline combining Google Maps Geocoding API with an offline database of 4,200+ Indian districts from `country-state-city`."
- **Q: What would you improve about this now?**  
  *A:* "At higher scale, calculating multi-factor scores in the application layer would become a bottleneck. I would migrate this search pipeline into Elasticsearch or Meilisearch, offloading vector/geospatial scoring and indexing directly to a dedicated search cluster."

---

### Achievement 3: Secure Virtual Event Access Control & Google Meet Attendee Whitelisting
*Code Reference:* [`ems-api/src/event/online-event-access.service.ts`](file:///d:/event%20management%20system/ems-api/src/event/online-event-access.service.ts), [`ems-api/src/integration/google-calendar.service.ts`](file:///d:/event%20management%20system/ems-api/src/integration/google-calendar.service.ts)

#### a) The Resume Bullet
> **Implemented a zero-leak virtual event access gateway** using **cryptographic access tokens, Google Calendar API OAuth2 whitelisting, and single-use guest claim tokens**, preventing unauthorized link sharing for paid webinars and automatically synchronizing approved attendee access logs with real-time token refresh.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** Simply emailing the Zoom or Google Meet URL directly in the booking confirmation email or showing it on the order success screen.
- **Why We Did NOT Do That:** Public meeting links are instantly forwarded, posted on social media, or shared among non-paying users, completely undermining ticket revenue for paid online workshops and masterclasses.
- **What We Gained:** Complete access protection. Meeting URLs are never exposed in API payloads or static emails. Users receive opaque tokens (`EMSACC-...`); when claimed, guest emails are programmatically whitelisted as attendees on the host's Google Calendar event via OAuth2, and attendance is forensically logged on room entry.
- **What It Cost Us:** Engineering overhead in handling Google OAuth token refreshes, handling bulk ticket purchases where 1 user buys 5 passes, and implementing a guest invite/revoke lifecycle (`TicketInviteStatus`).

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about how you protect virtual event links.**  
  *A:* "When someone registers for an online event, we never return the actual meeting URL in the frontend payload. Instead, we generate opaque access tokens. When a user enters the virtual room, our gateway validates their ticket approval status, logs their IP and User-Agent into `OnlineEventAttendanceLog`, and acts as a secure redirector. Furthermore, for Google Meet events, we use Google Calendar API to dynamically add only verified attendee emails to the calendar invitation whitelist."
- **Q: Why did you build guest ticket claiming instead of issuing 5 identical links?**  
  *A:* "If a corporate buyer purchases 5 tickets for their team, issuing identical links makes attendance tracking impossible and invites piracy. We bind Ticket #1 to the purchaser and generate unique cryptographically random invite tokens for Tickets #2–5. Each team member clicks their claim link, enters their name and email, and the system binds that ticket to their identity while syncing them to Google Meet."
- **Q: What was hard about this?**  
  *A:* "Managing Google OAuth token lifecycles asynchronously. If an event host hadn't logged in for weeks, their Google access token would expire. I had to build automatic refresh token renewal and error fallbacks so batch attendee additions never failed silently before a major event."
- **Q: What would you improve about this now?**  
  *A:* "I would implement WebRTC in-browser embedding or an internal video SDK (like Daily.co or LiveKit) directly into our Next.js client, completely eliminating third-party redirect handoffs."

---

### Achievement 4: Multi-Tiered Dynamic Refund & Cancellation Engine with Gateway Synchronization
*Code Reference:* [`ems-api/src/refund/refund.service.ts`](file:///d:/event%20management%20system/ems-api/src/refund/refund.service.ts), [`ems-api/src/admin-master/admin-master.service.ts`](file:///d:/event%20management%20system/ems-api/src/admin-master/admin-master.service.ts)

#### a) The Resume Bullet
> **Developed a configurable, multi-tier cancellation and refund automation engine** integrated with **Razorpay Payments API**, evaluating time-decay policy slabs, vendor free-cancel windows, and platform retention fees to execute programmatic partial refunds, restore inventory, and maintain immutable audit records.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** A flat refund policy (e.g., 'full refund if cancelled 24 hours prior, otherwise 0%') or requiring admin manual bank transfers for cancellations.
- **Why We Did NOT Do That:** Different service categories (like a perishable catering order versus a photographer) require vastly different lead times and risk profiles. Manual refunds lead to customer support backlogs, human error, and accounting reconciliation discrepancies.
- **What We Gained:** Real-time pre-cancellation quotes for users (`getRegistrationRefundQuote`), transparent fee breakdowns (e.g. gross refund, platform retention fee %, net payable), instant Razorpay automated refunds (`payments.refund`), and zero-touch ticket inventory recovery.
- **What It Cost Us:** Complex policy precedence resolution. We had to support global platform refund settings set by administrators while allowing individual organizers to define custom JSON cancellation tiers (`partialRefundTiersJson`).

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about your refund calculation engine.**  
  *A:* "Our refund engine evaluates two distinct product models. For event tickets, it dynamically matches remaining hours against admin-configured time slabs (e.g., >48 hrs = 100%, 24–48 hrs = 50%, <24 hrs = non-refundable), deducts a configurable platform retention fee, and automatically triggers a Razorpay API refund. For marketplace vendors, if the vendor declines, the client gets an automatic 100% deposit refund; if the client cancels, it evaluates the organizer's custom tier JSON."
- **Q: Why did you provide a pre-cancellation quote endpoint?**  
  *A:* "Transparency prevents chargebacks. Before a user confirms a cancellation in the UI, they hit `/refund/registration/:id/quote` which displays the exact hours remaining, the policy tier matched, the platform deduction fee, and the net paise amount returning to their account."
- **Q: What was hard about this?**  
  *A:* "Handling payment state edge cases with the payment gateway. If a user paid via UPI or Net Banking and Razorpay was processing a settlement, immediate refunds could return unexpected status codes. I had to build idempotent ledger tracking with `RefundRecord` to log gateway refund IDs and increment `refundedAmountInPaise` accurately."
- **Q: What would you improve about this now?**  
  *A:* "I would introduce an instant 'EMS Wallet / Store Credit' option. Instead of waiting 5–7 banking days for a Razorpay card refund, users could opt for 100% instant platform wallet credit, preserving platform cash flow and increasing user retention."

---

### Achievement 5: Two-Phase "Approval-Required" & "Instant-Confirm" Ticketing Architecture
*Code Reference:* [`ems-api/src/event/event.service.ts`](file:///d:/event%20management%20system/ems-api/src/event/event.service.ts), [`ems-api/src/payment/payment.service.ts`](file:///d:/event%20management%20system/ems-api/src/payment/payment.service.ts#L466-L573)

#### a) The Resume Bullet
> **Architected a flexible two-phase ticketing engine supporting dual confirmation workflows (Instant vs Host Approval-Required)** with **HMAC-signed QR pass generation (`EMSQR-...`)**, automated waitlist re-allocation, and authorized-hold payment capture semantics.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** Building only an instant-confirm ticketing model (like Eventbrite) where every registration immediately confirms and charges.
- **Why We Did NOT Do That:** Private events, executive conferences, invite-only summits, and community meetups require host vetting before granting entry, yet hosts still want the option to collect payments.
- **What We Gained:** A versatile ticketing platform that accommodates both public stadium concerts (instant high-volume checkouts) and exclusive masterclasses (approval queues where payments are held or confirmed conditionally before ticket QR issuance).
- **What It Cost Us:** Dual state machines for `RegistrationStatus` (`PENDING`, `APPROVED`, `DECLINED`, `CONFIRMED`) and conditional ticket generation logic, requiring tight coordination with waitlist entries when spots become available.

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about the two-phase approval system in ticketing.**  
  *A:* "Hosts can configure each event as either `INSTANT_CONFIRM` or `APPROVAL_REQUIRED`. In instant mode, checkout immediately transitions registrations to `CONFIRMED`, increments `soldCount`, and issues signed QR passes. In approval mode, the registration enters a `PENDING` queue. The host reviews attendee details, message notes, and ticket tier in their management portal to either Approve or Decline before passes are created."
- **Q: Why did you choose HMAC-signed QR passes over plain ticket ID QR codes?**  
  *A:* "A plain database ID encoded in a QR code is trivial to forge or guess. We generate unique signed tokens (`EMSQR-{eventId}-{regId}-{ticketNumber}-{entropy}`) that are verified against our scanner API. Once scanned at venue entry, the ticket is flagged `isCheckedIn: true` with a timestamp, and duplicate scans are immediately flagged with anti-passback warnings."
- **Q: What was hard about this?**  
  *A:* "Maintaining ticket category inventory consistency during host approval delays. If 50 people apply for 10 remaining VIP spots in an approval-required event, you cannot decrement sold inventory until the host approves, but you must prevent the host from over-approving beyond venue fire capacity."
- **Q: What would you improve about this now?**  
  *A:* "I would add an automated expiration timer for pending applications (e.g. 72-hour auto-decline) so attendees aren't left in limbo if a host forgets to review their dashboard."

---

### Achievement 6: Automated Dual-Flow Availability Calendar & Conflict-Free Slot Locking
*Code Reference:* [`ems-api/src/booking/booking.service.ts`](file:///d:/event%20management%20system/ems-api/src/booking/booking.service.ts#L240-L268), [`ems-api/src/organizer/organizer.service.ts`](file:///d:/event%20management%20system/ems-api/src/organizer/organizer.service.ts#L1250-L1350)

#### a) The Resume Bullet
> **Engineered an automated vendor calendar and slot-blocking subsystem** using **PostgreSQL composite unique constraints (`organizerProfileId_date`)**, eliminating double-booking hazards by automatically freezing multi-day calendar slots upon deposit payment and auto-releasing dates upon order rejection or cancellation.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** Relying on organizers to manually open their calendar and block off dates after accepting customer bookings via email or chat.
- **Why We Did NOT Do That:** Vendors forget to manually block dates, leading to disastrous double-bookings for one-time milestone events (e.g. two weddings booked with the same photographer on the same Saturday).
- **What We Gained:** 100% automated schedule integrity. The moment a customer's deposit payment is captured, the system computes the full date range via `getDatesInRange()` and executes atomic upserts on `AvailabilitySlot` with `isAutoBlocked: true` and `bookingId`, instantly making the vendor unavailable to concurrent shoppers.
- **What It Cost Us:** Database write frequency on checkout and complex rollback logic to ensure that if a booking is cancelled, rescheduled, or rejected, only slots associated with that specific `bookingId` are released while manual blackout dates remain intact.

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about how you prevent double-booking across vendors.**  
  *A:* "We maintain an `AvailabilitySlot` model with a composite unique index on `[organizerProfileId, date]`. During cart checkout, the system validates that every requested date across the booking range is completely free from both manual blocks (`isBlocked: true`) and system blocks (`isAutoBlocked: true`). When payment succeeds, we transactionally auto-block the entire date range linked to that `bookingId`."
- **Q: Why did you differentiate between `isBlocked` and `isAutoBlocked`?**  
  *A:* "Separation of intent. `isBlocked` represents an organizer's personal blackout dates (e.g. vacation or offline gigs), while `isAutoBlocked` represents dates frozen by platform bookings. If a platform booking is cancelled or refunded, the system only unblocks slots where `bookingId` matches, preserving the organizer's personal manual blackouts."
- **Q: What was hard about this?**  
  *A:* "Handling multi-day bookings across month and year boundaries. A package spanning from December 30th to January 2nd requires calculating exact calendar day arrays in UTC while accounting for timezone offsets so that slots in the organizer's local timezone (Asia/Kolkata) don't bleed into adjacent dates."
- **Q: What would you improve about this now?**  
  *A:* "I would expand the slot granularity from full-day dates (`@db.Date`) to time-slotted hourly blocks (`HH:mm`), allowing single-day vendors like DJs or makeup artists to book multiple 3-hour sessions on the same calendar day."

---

### Achievement 7: High-Performance Media Pipeline with Sharp Image Compression & MinIO S3
*Code Reference:* [`ems-api/src/common/services/minio.service.ts`](file:///d:/event%20management%20system/ems-api/src/common/services/minio.service.ts#L90-L185), [`ems-api/src/organizer/organizer.service.ts`](file:///d:/event%20management%20system/ems-api/src/organizer/organizer.service.ts#L102-L150)

#### a) The Resume Bullet
> **Built an on-premise S3-compatible media pipeline** using **MinIO Object Storage and Sharp**, achieving **up to 70% image payload reductions (estimate — verify before using)** via dynamic WebP/MozJPEG compression and EXIF auto-rotation, while programmatically preserving uncompressed fidelity for KYC compliance documents.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** Storing user and portfolio images directly on the local server filesystem using Multer disk storage, or uploading raw user uploads directly to AWS S3 without client or server optimization.
- **Why We Did NOT Do That:** Raw camera and smartphone uploads are frequently 8MB–15MB JPEGs with arbitrary EXIF orientations, which destroys mobile app page load performance and exhausts cloud bandwidth. Storing on local disk prevents horizontal container scaling.
- **What We Gained:** S3-compatible cloud storage independence using self-hosted MinIO, sub-second media delivery through automated Sharp image resizing (1920x1920 bounding box, MozJPEG 80% quality, WebP), and zero degradation on official KYC legal documents (PAN, GST, Aadhaar).
- **What It Cost Us:** Node.js worker CPU memory consumption during heavy image compression bursts, requiring careful buffer management and memory limit tuning (`--max-old-space-size=4096`).

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about your media upload architecture.**  
  *A:* "We implemented a custom `MinioService` wrapping an S3-compatible MinIO cluster. When files are uploaded, our pipeline inspects the MIME type and folder path. For catalog media, event covers, and portfolio items, it routes the buffer through Sharp to auto-rotate EXIF orientation, constrain dimensions to 1920px max, and compress to WebP or MozJPEG. For legal KYC documents, it deliberately bypasses compression to maintain 100% pixel fidelity for admin verification."
- **Q: Why did you choose MinIO over directly using AWS S3?**  
  *A:* "MinIO implements the exact AWS S3 API specification while running completely containerized in our Docker stack. This gave us zero-cost, cloud-independent local development and on-premise hosting capabilities, with the flexibility to swap our endpoint to AWS S3 or Cloudflare R2 simply by updating environment variables without changing a single line of application code."
- **Q: What was hard about this?**  
  *A:* "Handling internal Docker network routing versus external public client access. In Docker Compose, services communicate via `http://minio:9000`, but client browsers must view images via public SSL domains (`https://emsstorage.webnoxdigital.com`). I implemented dynamic URL sanitization and path extraction helpers (`extractPath` and `getFileUrl`) that seamlessly rewrite internal URLs to public CDN endpoints."
- **Q: What would you improve about this now?**  
  *A:* "I would generate multi-resolution responsive image sets (thumbnail 300px, medium 800px, full 1920px) and introduce signed direct-to-S3 pre-signed upload URLs to offload image multipart upload processing entirely from our NestJS application server."

---

### Achievement 8: Unified Capability-Based Identity Architecture & Dual-Token Security
*Code Reference:* [`ems-api/src/auth/auth.service.ts`](file:///d:/event%20management%20system/ems-api/src/auth/auth.service.ts), [`ems-api/prisma/schema.prisma`](file:///d:/event%20management%20system/ems-api/prisma/schema.prisma#L202-L281), [`ems-api/src/common/guards/roles.guard.ts`](file:///d:/event%20management%20system/ems-api/src/common/guards/roles.guard.ts)

#### a) The Resume Bullet
> **Architected a unified, capability-driven identity system** with **dual-token JWT authentication (access + rotating refresh tokens)**, bcrypt password hashing (12 rounds), and Google OAuth2 integration, collapsing three distinct personas (Customer, Event Host, Organizer) into a single account model without role fragmentation.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** Creating three separate database tables (`Customer`, `Organizer`, `Host`) with separate login portals, registration forms, and auth tokens.
- **Why We Did NOT Do That:** Real-world users are multifaceted. An event organizer often buys tickets to conferences, and regular customers frequently want to host a birthday party or become a vendor. Segregated user tables force users into confusing multi-login workflows and duplicate user profile data.
- **What We Gained:** Single sign-on across the entire platform. Every registered user can instantly buy tickets and host events. Completing a vendor registration simply flips the `isOrganizer` flag and unlocks catalog management menus on the exact same account.
- **What It Cost Us:** More nuanced guard checks and token payload design. Our JWT strategies and `@Roles()` guards had to evaluate dynamic account flags and KYC verification statuses rather than simple binary role strings.

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about your identity and authentication design.**  
  *A:* "We unified our identity layer into a single `User` model equipped with capability flags: `isOrganizer` and `canHostEvents`. Authentication supports email/password with 12 bcrypt salt rounds, phone OTP, and Google OAuth2 with offline refresh token persistence. For session security, we issue short-lived 15-minute access JWTs paired with long-lived 7-day refresh tokens stored as bcrypt hashes in the database with strict revocation on rotation."
- **Q: Why did you implement capability flags over traditional RBAC tables?**  
  *A:* "In two-sided marketplaces, rigid RBAC forces users into artificial silos. By utilizing capability flags on a unified identity, an organizer can seamlessly browse and hire a DJ as a customer without logging out, while our controllers enforce permission boundaries via granular NestJS guards like `@Roles(UserRole.ORGANIZER)`."
- **Q: What was hard about this?**  
  *A:* "Handling Google OAuth credential unification across web and mobile apps. Mobile apps authenticate via Firebase or native Google Sign-In and pass an ID token, while web apps use OAuth2 redirect codes. I built a unified `googleMobileAuth` service that validates both Firebase Admin ID tokens and raw Google OAuth2 tickets, matching or creating accounts idempotently."
- **Q: What would you improve about this now?**  
  *A:* "I would transition refresh token storage from PostgreSQL to Redis with automatic key expiration (TTL) to reduce database write operations during token refresh cycles."

---

### Achievement 9: Multi-Tiered SaaS Monetization & Quota Enforcement Engine
*Code Reference:* [`ems-api/src/organizer/organizer.service.ts`](file:///d:/event%20management%20system/ems-api/src/organizer/organizer.service.ts#L1050-L1150), [`ems-api/src/admin-master/admin-master.service.ts`](file:///d:/event%20management%20system/ems-api/src/admin-master/admin-master.service.ts#L450-L550), [`ems-api/src/reports/reports.service.ts`](file:///d:/event%20management%20system/ems-api/src/reports/reports.service.ts#L87-L140)

#### a) The Resume Bullet
> **Engineered a dual-stream SaaS subscription and quota enforcement engine** across **BASIC, MEDIUM, and ADVANCED tiers**, dynamically throttling catalog creation limits (`maxActivePackages`, `maxActiveServices`), injecting search rank boosts, and calculating real-time platform MRR/ARR financial analytics.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** A flat commission-only model (e.g. charging 10% on every booking) with unlimited free listings for all vendors.
- **Why We Did NOT Do That:** Relying solely on transaction commissions leaves the platform vulnerable during low-season event months and encourages catalog spam with low-quality, abandoned listings.
- **What We Gained:** Predictable recurring SaaS subscription revenue (MRR) alongside transaction commissions. Vendors on higher tiers get tangible business value: increased listing capacity (e.g., unlimited packages vs 3), priority customer support, and algorithmic search ranking boosts (+25 priority score).
- **What It Cost Us:** Quota validation overhead across every catalog create/publish endpoint, plus tracking subscription statuses (`ACTIVE`, `PAST_DUE`, `CANCELLED`) with automated grace periods before listing deactivation.

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about your SaaS subscription and quota system.**  
  *A:* "We created dual subscription hierarchies: `OrganizerSubscription` for marketplace vendors and `UserEventSubscription` for event hosts. When an organizer attempts to publish a new package or service, our quota interceptor checks their active plan limits (`maxActivePackages`, `maxActiveServices`). Subscriptions also directly feed into our search engine, boosting Advanced tier vendors by +25 points in discovery algorithms."
- **Q: Why did you provide distinct subscription models for hosts versus organizers?**  
  *A:* "Their value propositions are completely different. Organizers need catalog bandwidth and search placement to win client bookings; event hosts need attendee capacity, low ticket platform fees, and advanced webinar tools. Separate subscription schemas allowed us to tailor pricing and feature flags to each persona's specific willingness to pay."
- **Q: What was hard about this?**  
  *A:* "Handling grace periods and listing state transitions when subscriptions expire. If a vendor downgrades or their payment fails, you cannot destructively delete their active packages. We designed an automated grace period window where listings remain active for $N$ days before transitioning to `INACTIVE`, preserving historical bookings and review integrity."
- **Q: What would you improve about this now?**  
  *A:* "I would integrate Razorpay Subscriptions / Auto-Debit Webhooks for automated recurring recurring billing (e-mandates), replacing manual renewal triggers."

---

### Achievement 10: Idempotent Payment Verification & Split-Settlement Payout Ledger
*Code Reference:* [`ems-api/src/payment/payment.service.ts`](file:///d:/event%20management%20system/ems-api/src/payment/payment.service.ts#L110-L245), [`ems-api/src/reports/reports.service.ts`](file:///d:/event%20management%20system/ems-api/src/reports/reports.service.ts#L12-L85)

#### a) The Resume Bullet
> **Built an idempotent split-payment verification and vendor payout ledger** using **Razorpay HMAC SHA-256 signatures**, calculating gateway processing fees, scheduling automated T+2 bank disbursements, and generating aggregated balance-sheet statements with date-filtered financial reporting.

#### b) The "Why This Instead Of That" Tradeoff
- **The Simpler Alternative:** Immediate manual payout requests where vendors submit manual withdrawal tickets and platform admins manually transfer funds via bank portals.
- **Why We Did NOT Do That:** Manual payout operations do not scale beyond 20 vendors, introduce massive administrative bottlenecks, and create financial reconciliation nightmares between gateway transaction fees and bank ledgers.
- **What We Gained:** Automated financial accounting. The moment a multi-vendor order clears payment verification, the system calculates gateway fees (2%), net vendor earnings, and generates scheduled `Payout` records queued for T+2 settlement, providing complete auditability for administrators.
- **What It Cost Us:** Storing detailed financial state machines (`PENDING`, `AUTHORIZED`, `CAPTURED`, `REFUNDED`) and keeping currency representations in integer paise to completely eliminate floating-point arithmetic errors.

#### c) Interview Q&A for this Bullet
- **Q: Tell me more about your payment verification and payout ledger.**  
  *A:* "Post-checkout, our backend verifies the Razorpay HMAC SHA-256 signature against our webhook secret to prevent tampering. Upon verification, the payment is marked `CAPTURED`. For marketplace orders, the service calculates net payout amounts after deducting the 2% gateway processing fee and schedules automated `Payout` ledger records for T+2 settlement linked to the organizer's verified IFSC bank credentials."
- **Q: Why do you store all currency values as integer paise rather than floating-point numbers?**  
  *A:* "Floating-point numbers in JavaScript and SQL introduce precision drift (e.g. `0.1 + 0.2 = 0.30000000000000004`). In financial ledgers dealing with split commissions, taxes, and refunds, precision drift causes accounting imbalances. Storing everything in integer paise completely eliminates rounding bugs."
- **Q: What was hard about this?**  
  *A:* "Ensuring payment webhook idempotency. Payment gateways often deliver webhooks multiple times due to network retries. I structured the verification logic so that if a payment is already marked `CAPTURED`, subsequent webhook deliveries return immediate success without executing duplicate payouts, duplicate ticket generation, or duplicate email dispatches."
- **Q: What would you improve about this now?**  
  *A:* "I would integrate Razorpay Route (marketplace split-payments API) directly at the payment gateway level, allowing Razorpay to automatically route funds directly to linked vendor bank accounts rather than maintaining an internal escrow payout ledger."

---

# 3. Ranked Top 3 "Lead With These" Bullets

If applying for a **Senior Backend** or **Full-Stack Engineering** role, lead your resume with these three bullets:

### 1. Multi-Vendor Cart & Atomic Order Splitting Engine
> **Why it stands out:** Hiring managers and tech leads immediately recognize that multi-vendor e-commerce checkout is one of the hardest distributed data problems in software engineering. Building an engine that validates cross-vendor availability, checks lead times, splits a single transaction into $N$ isolated vendor bookings with distinct SLAs, and manages partial cancellations demonstrates senior-level system design and transactional rigor.

### 2. Algorithmic Multi-Dimensional Search & Geospatial Discovery Engine
> **Why it stands out:** Almost every candidate writes "implemented search with SQL queries." This achievement proves you understand math, algorithm design, and real-world database internals: combining PostgreSQL `pg_trgm` fuzzy matching, a custom Gaussian decay formula for distance scoring, subscription tier boosts, and PostGIS spatial indexing across 4,200+ cities. It shows you think deeply about user experience and business monetization.

### 3. Secure Virtual Event Access Control & Google Meet Attendee Whitelisting
> **Why it stands out:** This highlights security consciousness, enterprise integration skills, and complex lifecycle management. Instead of naive link exposure, you engineered an opaque-token access gateway, handled OAuth2 token refresh lifecycles with the Google Calendar API, and built a full guest invitation and claiming state machine. It proves you build production-hardened software rather than simple weekend tutorials.

---

# 4. Weaknesses You Should Be Ready to Defend (Don't Hide These)

In senior engineering interviews, being able to critique your own code honestly and explain trade-offs is a massive green flag. Here are 5 real shortcuts and technical debt items visible in the code, with scripts on how to defend them.

---

### Weakness 1: In-Memory Sequential Queue in `RabbitMQService` instead of true AMQP Broker
*Code Location:* [`ems-api/src/queue/rabbitmq.service.ts`](file:///d:/event%20management%20system/ems-api/src/queue/rabbitmq.service.ts)
- **The Reality in Code:** While RabbitMQ is configured in `docker-compose.yml`, the actual `RabbitMQService` implementation uses an in-process JavaScript array (`private jobQueue: TicketPurchaseJob[] = []`) with an async mutex flag (`this.isProcessing`) and setImmediate loops to process ticket jobs sequentially.
- **The Risk:** If the Node.js process crashes or restarts during a ticket drop, all uncommitted jobs in memory are lost. It also cannot distribute queue workloads across multiple backend replicas.
- **How to Answer in an Interview:**
  > *"When we designed the ticket checkout queue, our primary goal was validating sequential atomic inventory decrements to prevent database race conditions without introducing the operational complexity of distributed message listeners during early development. I implemented an in-memory serialized queue abstraction that mimics an AMQP consumer. However, in a multi-instance production environment, jobs in memory don't survive container restarts. Our clear next architectural step is swapping the transport layer to BullMQ with Redis or native `amqplib` connected to our existing RabbitMQ container, backed by durable queues and dead-letter exchanges."*

---

### Weakness 2: In-Process OTP Storage Map instead of Distributed Redis Cache
*Code Location:* [`ems-api/src/auth/auth.service.ts`](file:///d:/event%20management%20system/ems-api/src/auth/auth.service.ts#L35-L45)
- **The Reality in Code:** In `AuthService`, phone and email verification codes are stored in an in-memory `Map<string, OtpRecord>()` with a comment: `// TODO: Replace with Redis when REDIS_URL env var is present.`
- **The Risk:** In a horizontally scaled cluster behind a round-robin load balancer, a user requesting an OTP on Instance A who verifies on Instance B will receive an "OTP not found" error.
- **How to Answer in an Interview:**
  > *"To maintain high developer velocity and keep the development setup self-contained without external cache dependencies, I implemented an in-process Map with timestamp-based TTL cleanup for OTPs. I explicitly marked this with a TODO and encapsulated it so that switching to Redis simply requires replacing the Map calls with `redis.setex(key, ttl, otp)`. For production clustering behind a load balancer, moving this to Redis is a prerequisite."*

---

### Weakness 3: PostGIS Raw SQL Queries (`$queryRawUnsafe`) Bypassing Prisma Type-Safety
*Code Location:* [`ems-api/src/search/search.service.ts`](file:///d:/event%20management%20system/ems-api/src/search/search.service.ts#L75-L115), [`ems-api/src/common/services/geocoding.service.ts`](file:///d:/event%20management%20system/ems-api/src/common/services/geocoding.service.ts#L150-L175)
- **The Reality in Code:** Spatial queries and `pg_trgm` similarity queries are executed via `$queryRawUnsafe` with manual string interpolation or positional parameters because Prisma treats `geography(Point, 4326)` as `Unsupported`.
- **The Risk:** Raw SQL queries bypass Prisma's compile-time TypeScript type checking; a typo in a column name won't be caught by the TypeScript compiler.
- **How to Answer in an Interview:**
  > *"Prisma ORM is fantastic for developer productivity and relational queries, but its support for PostGIS spatial geography types is still marked as 'Unsupported' in schema definitions. Rather than sacrificing geospatial capabilities, I deliberately chose to use raw SQL executions with parameterized bindings for spatial points and trigram similarity functions. If refactoring for maximum type safety, I would introduce Kysely or a typed SQL query builder specifically for our search and geocoding repositories."*

---

### Weakness 4: Synchronous Third-Party API Calls in Request Lifecycle
*Code Location:* [`ems-api/src/payment/payment.service.ts`](file:///d:/event%20management%20system/ems-api/src/payment/payment.service.ts#L280-L320), [`ems-api/src/payment/payment.service.ts#L560-L570`](file:///d:/event%20management%20system/ems-api/src/payment/payment.service.ts#L560-L570)
- **The Reality in Code:** When a payment succeeds, sending transactional emails (`mailService.sendPaymentConfirmedToOrganizer`) and synchronizing Google Meet whitelist attendees occurs inside the post-payment handler.
- **The Risk:** Although wrapped in `try/catch` blocks to prevent transaction rollback, network latency or timeouts from third-party SMTP servers or Google APIs increase API response time for the customer.
- **How to Answer in an Interview:**
  > *"In our payment success handler, transactional emails and Google Calendar sync calls are wrapped in non-blocking try/catch blocks so external API failures never compromise order completion. However, executing third-party I/O within the request pipeline still introduces unnecessary latency to the user's checkout response. The correct architectural refinement is publishing a `PaymentCapturedEvent` to an event emitter or message queue, allowing background workers to handle email dispatch and calendar synchronization out-of-band."*

---

### Weakness 5: Single-Node Mutex for Ticket Inventory Allocation
*Code Location:* [`ems-api/src/queue/rabbitmq.service.ts`](file:///d:/event%20management%20system/ems-api/src/queue/rabbitmq.service.ts#L38-L88)
- **The Reality in Code:** Inventory concurrency is guarded by an in-memory Boolean flag (`isProcessing`) combined with a Prisma transaction.
- **The Risk:** Across multiple Node.js container replicas, two distinct servers could simultaneously read `soldCount < quantity` and over-allocate a sold-out ticket category.
- **How to Answer in an Interview:**
  > *"On a single API node, our queue serializes inventory deductions reliably. But across a distributed cluster, an in-process lock cannot prevent race conditions. To harden this for massive flash-sale traffic, we need distributed concurrency control—either utilizing PostgreSQL row-level locks via `SELECT ... FOR UPDATE` inside a database transaction, or a distributed Redis lock (Redlock) around the ticket decrement routine."*

---

# 5. General Interview Questions About This Project (with Answers)

Here are 15 high-frequency technical interview questions tailored specifically to this codebase, answered in confident, senior first-person interview style.

---

### Category A: Architecture & System Design (4 Questions)

#### Q1: "How did you design the database architecture to support both marketplace hiring (Flow 1) and independent event ticketing (Flow 2) in the same system?"
> *"I designed the architecture around a shared transactional foundation while cleanly decoupling their domain models. Marketplace hiring (Flow 1) revolves around an `Order` and child `Booking` records tied to `OrganizerProfile`, `Package`, and `Service` models, handling multi-vendor splits and advance deposit workflows. Event ticketing (Flow 2) centers on an `Event`, `TicketType`, and `Registration` hierarchy with mode toggles for Online versus Offline. Both flows share the same unified `User` account, `Payment` ledger, `Notification`, and `Review` infrastructure. In fact, they can even intersect: an event creator in Flow 2 can hire marketplace vendors from Flow 1 to service their event, linking the resulting bookings directly to the parent `Event` record via foreign keys."*

#### Q2: "How does the multi-vendor cart and checkout system ensure data consistency when splitting an order?"
> *"Consistency is maintained through a multi-stage validation and transactional creation pipeline. In `processCheckout`, the service first re-verifies real-time calendar availability and lead-time constraints across every vendor's requested date range before touching money. It calculates the subtotal and coupon deductions, creates the parent `Order`, and splits each line item into child `Booking` records with calculated deposits and balance-due amounts. Crucially, vendor availability slots are not auto-blocked until the payment gateway confirms the payment as `CAPTURED`, preventing phantom inventory lockouts from abandoned carts."*

#### Q3: "Why did you implement a capability-based role model rather than having separate database tables for Organizers, Hosts, and Customers?"
> *"In real life, user personas are fluid. An event organizer frequently attends other events as a regular customer, and an individual user hosting a private party might later register a catering business. If you split them into separate `Customer` and `Organizer` tables, you force users into separate logins, separate password resets, and duplicate profile data. By placing capability flags (`isOrganizer`, `canHostEvents`) on a single `User` entity, every user enjoys single sign-on across the whole platform, while completing vendor onboarding simply activates catalog management permissions on their existing account."*

#### Q4: "How does your system enforce security and attendance verification differently between physical offline events and virtual online events?"
> *"For physical events, security is physical and cryptographic: we issue signed single-use QR passes (`EMSQR-...`) that gate entry scanners validate against our check-in API, immediately flagging duplicate scan attempts. For virtual events, the attack vector is link leakage. We completely conceal Zoom and Google Meet URLs behind opaque access tokens; attendees access the meeting through a secure redirector that checks ticket ownership and logs attendance metadata (IP and User-Agent). For Google Meet specifically, we also use the Google Calendar API to automatically whitelist verified attendee emails on the event invite."*

---

### Category B: "Why X Over Y" Tradeoff Questions (4 Questions)

#### Q5: "Why did you choose PostGIS spatial indexing with Gaussian distance decay over a simple client-side bounding box or radius filter?"
> *"A simple radius filter like 25km creates an artificial binary cutoff: a vendor 24km away appears, while a world-class 5-star vendor 26km away is completely invisible. That frustrates users, especially in suburban areas. By implementing PostGIS geography points combined with an exponential Gaussian decay function (`35 * e^(-(d/55)^2)`), proximity score decreases smoothly with distance. This allows top-rated, highly subscribed organizers in nearby cities to compete fairly with average local vendors, producing vastly more relevant search discovery."*

#### Q6: "Why did you opt for a two-phase deposit and balance booking model instead of requiring 100% full payment upfront for marketplace services?"
> *"Marketplace event services are high-ticket transactions—booking a wedding venue or full catering package can run into thousands of dollars. Requiring 100% upfront payment creates immense friction and kills conversion rates. By supporting configurable advance deposits (either flat amounts or percentages like 20%), customers can freeze a vendor's calendar slot with low upfront commitment, while vendors get guaranteed booking security and collect the remaining balance closer to the event date per their cancellation policy."*

#### Q7: "Why did you build an opaque access token gateway for virtual events instead of returning the Zoom/Google Meet link directly upon ticket purchase?"
> *"Returning direct meeting links upon purchase makes paid online events trivially easy to pirate. Anyone can copy the Zoom link and post it in a Discord or WhatsApp group, allowing dozens of unauthorized participants to join for free. By keeping the join URL hidden behind opaque tokens and single-use guest invite URLs, we control who actually receives entrance, log entry timestamps, and ensure that only verified paying attendees or claimed guest ticket holders can join."*

#### Q8: "Why did you use Prisma with raw SQL extensions instead of TypeORM or pure SQL for database management?"
> *"Prisma provides an unmatched developer experience for standard relational workflows—type-safe client generation, automated migrations, and intuitive relation modeling that saved us hundreds of hours across 39 models. For the 5% of queries where Prisma lacked native capability—specifically PostGIS spatial calculations (`ST_SetSRID`, `ST_MakePoint`) and PostgreSQL `pg_trgm` fuzzy text matching—Prisma's `$queryRawUnsafe` provided an escape hatch. This gave us the best of both worlds: high developer productivity on 95% of business logic, with targeted raw SQL power where performance required it."*

---

### Category C: Scaling & Performance Questions (3 Questions)

#### Q9: "How does the system handle high-concurrency ticket drops when popular events sell out in minutes?"
> *"To prevent race conditions where two concurrent requests sell the final ticket, our ticketing engine routes high-concurrency ticket allocations through a sequential queue with atomic inventory validation. Inside a database transaction, we query the `ticketType`, verify that `soldCount < quantity`, and execute an atomic increment (`soldCount: { increment: 1 }`). If sold out, the transaction aborts and transitions the registration to `DECLINED` with a clean notification. To scale this further, the next step is applying PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) or Redis distributed locks across cluster nodes."*

#### Q10: "How do you optimize image uploads across hundreds of catalog items without degrading API response times or storage costs?"
> *"We implemented an automated media pipeline using Sharp and MinIO S3 storage. When vendors upload portfolio photos or event covers, the buffer is processed in-memory: we auto-rotate according to EXIF orientation, constrain dimensions to a 1920x1920 bounding box, and compress to MozJPEG or WebP at 80% quality. This reduces average image sizes by 60–75% before writing to S3, dramatically lowering storage footprint and speeding up frontend mobile load times. Furthermore, we deliberately bypass compression on legal KYC documents to prevent any loss of document readability."*

#### Q11: "How does your search engine maintain sub-100ms response times when querying across thousands of vendors, fuzzy text matches, and spatial coordinates?"
> *"We optimize search through aggressive caching and indexed database lookups. First, geocoding coordinates are resolved via a 4-tier pipeline: in-memory `Map` cache first, database `CityGeoCache` second, and external Google Maps API only on a cache miss. Second, fuzzy text matching utilizes PostgreSQL GIN indexes on trigram columns (`pg_trgm`) rather than full table scans. Third, distance scoring uses optimized Haversine math on pre-filtered candidate sets rather than calculating distances across the entire unindexed database."*

---

### Category D: "What Would You Do Differently" Questions (2 Questions)

#### Q12: "Looking back at the architecture, what is one major decision you would change if you were starting over today?"
> *"I would decouple the asynchronous workers from the main API process from day one. Currently, queue workers, image compression, and transactional emails run inside the same NestJS monolith process. While this streamlined early deployment with Docker Compose, compute-heavy tasks like Sharp image compression or large email bursts can briefly spike event-loop latency for lightweight REST requests. I would separate the background job consumer into a dedicated worker container connected via Redis and BullMQ."*

#### Q13: "How would you evolve the payment and payout settlement system if the platform expanded internationally?"
> *"Currently, our payment architecture is optimized for India using Razorpay, INR paise currency units, and Indian IFSC bank transfers. Expanding internationally would require two architectural changes: first, abstracting payment gateway logic behind an adapter interface supporting Stripe or Adyen alongside multi-currency exchange rates; second, integrating automated marketplace split payouts (like Stripe Connect Custom Accounts) to offload cross-border KYC, tax withholding (1099/W-8), and currency conversions directly to the payment infrastructure."*

---

### Category E: Debugging & Hard Problem Questions (2 Questions)

#### Q14: "(Inferred — replace with a real incident if you remember one) Can you describe a challenging concurrency or state-synchronization bug you encountered and how you solved it?"
> *"We encountered a subtle race condition in our multi-day calendar slot auto-blocking. When two users simultaneously checked out packages from the same wedding decorator for overlapping weekend dates, both requests passed the initial availability check because neither order was finalized yet. Both payments completed, resulting in conflicting bookings for the same dates. I resolved this by enforcing a PostgreSQL composite unique index on `organizer_profiles.id + availability_slots.date` and moving the slot auto-blocking into an atomic database upsert routine within the payment capture transaction. If a slot collision occurs, the database constraint triggers an immediate rollback and triggers an automatic refund workflow."*

#### Q15: "(Inferred — replace with a real incident if you remember one) Describe a tricky third-party API integration bug you tackled with Google Calendar or Razorpay."
> *"A challenging issue arose with Google Calendar OAuth tokens during virtual event attendee syncing. Event hosts who created events weeks in advance had their Google access tokens expire. When ticket sales surged on event day, our background sync attempted to add attendee emails to the Google Meet event using the stale token, causing Google API to return 401 Unauthorized errors and failing attendee synchronization. I debugged this by refactoring `GoogleCalendarService` to inspect token expiry before API calls, using Google's `oauth2Client` to automatically exchange the stored `googleRefreshToken` for a fresh access token, and storing the renewed credentials in the database to ensure zero downtime."*

---

# 6. Questions For Me To Fill In

To customize this guide and make your resume bullets 100% airtight for hiring managers, please fill in or confirm these specifics:

1. **Production & Traffic Metrics:**
   - Did this platform deploy to real users on `ems.webnoxdigital.com`?
   - How many total registered users, vendors, and events are currently in the database?
   - What is the approximate gross transaction value (GMV) or volume of bookings processed to date?
2. **Team Structure:**
   - Were you the sole architect and full-stack engineer across all three apps (`ems-api`, `ems-web`, `ems-admin`), or did you collaborate with a team (frontend, mobile, UI/UX designers)?
3. **Infrastructure & Hosting:**
   - Where are the Docker Compose containers hosted in production? (e.g. AWS EC2 t3.xlarge, DigitalOcean Droplet, Hetzner VPS, Linode)?
4. **Real Production War Story:**
   - Review Q14 and Q15 above: Do you recall a specific production bug, database migration incident, or payment gateway edge case you personally resolved? If so, swap it in to make your interview story uniquely yours!
