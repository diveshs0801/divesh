# Divesh S
**Coimbatore, Tamil Nadu, India** | **+91 6382184458** | **diveshs0801@gmail.com**  
[LinkedIn](https://linkedin.com/in/divesh-s-57bbaa8236) | [GitHub](https://github.com/diveshs0801)

---

## PROFESSIONAL SUMMARY
Software Engineer with 1+ year of professional experience designing and scaling high-concurrency backend services, distributed systems, and full-stack web platforms using **NestJS**, **Next.js 16 (React 19)**, **Go (Golang)**, and **TypeScript**. Proven track record architecting enterprise production platforms including **TaxiBy** (ride-hailing & fleet mobility), **ProductCRM** (internal CRM scaling to commercial SaaS with MCP AI Copilot), and distributed **Go microservices** with Kafka and gRPC. Experienced delivering end-to-end client applications across custom CMS portals, e-commerce applications, real-time analytics dashboards, and interactive web experiences.

---

## TECHNICAL SKILLS
- **Programming Languages:** TypeScript, JavaScript (ES6+), Go (Golang), SQL
- **Backend & Frameworks:** NestJS, Node.js, Express.js, RESTful APIs, WebSockets (Socket.IO), gRPC
- **Frontend Technologies:** Next.js 16 (App Router), React 19, Tailwind CSS, Zustand, Redux, TanStack Query, HTML5/CSS3
- **Distributed Systems & Queues:** Microservices Architecture, Apache Kafka, RabbitMQ, BullMQ, Redis (Pub/Sub, Caching, H3), KrakenD Gateway
- **Databases & ORMs:** PostgreSQL, MySQL, Prisma ORM
- **Cloud, Tools & Integrations:** Docker, Docker Compose, AWS (EC2, S3), Razorpay, Cashfree Payouts, Interakt (WhatsApp API), Fast2SMS, IVR Integrations, Google Search Console (GSC), Model Context Protocol (MCP) / AI Copilot, Git, GitHub, Linux, Postman

---

## PROFESSIONAL EXPERIENCE

### **Webnox Technologies** | Coimbatore, India
**Software Engineer** | *August 2025 – September 2026*

**TaxiBy — Enterprise Ride-Hailing & Fleet Mobility Platform** *(NestJS, Next.js 16, Redis, Uber H3, WebSockets, PostgreSQL, Cashfree)*
- Architected high-concurrency **NestJS** microservices (`core`, `tracking`, `notifications`), managing real-time driver telemetry, dynamic surge pricing, and automated dispatch.
- Engineered sub-second driver dispatch using **Uber’s H3 Hexagonal Spatial Index (Res 7)** and **Redis Sets**, replacing expensive database polygonal queries with **O(1) lookups (<2ms latency)**.
- Engineered real-time driver GPS telemetry streaming via **WebSockets** and **Redis**, implementing distance-threshold throttling and debouncing to eliminate redundant location pings and reduce network payload by **~75%**.
- Slashed third-party **Google Maps API overhead by 70–80%** (saving ₹25k–₹35k/month) via coordinate-rounding Redis cache and built an **immutable double-entry wallet ledger** with automated **Cashfree Payouts**.

**ProductCRM — Enterprise Multi-Tenant CRM & AI Copilot Platform** *(NestJS, Next.js, Prisma, PostgreSQL, Docker, DeepSeek LLM, MCP)*
- Engineered an enterprise multi-tenant CRM currently powering internal company operations, architecting request-level data isolation via **NestJS** and Node.js **`AsyncLocalStorage`** for upcoming commercial SaaS rollout to external customers.
- Integrated an internal **AI Copilot** powered by **DeepSeek LLM** and a custom **Model Context Protocol (MCP)** tool execution framework, featuring RBAC-aware tool access and 2-phase human write confirmation safeguards.
- Built an idempotent multi-entity lead conversion and customer onboarding pipeline using **Prisma transactions (`$transaction`)**, guaranteeing zero duplicate company, contact, or opportunity records during onboarding.

**Enterprise Multi-Tenant ERP Microservices (EFS)** *(Go (Golang), Apache Kafka, gRPC, PostgreSQL, Redis, KrakenD, Docker)*
- Architected an enterprise multi-tenant ERP platform spanning 11 microservices in **Go (Golang)**, **Apache Kafka**, **gRPC**, and **PostgreSQL**, processing work orders, procurement, and fleet dispatching across isolated tenant domains.
- Implemented the **Transactional Outbox Pattern** in Go with background workers and exponential backoff retry logic, eliminating dual-write failures and guaranteeing at-least-once delivery across 15+ Kafka domain topics.
- Engineered an in-memory GPS dispatch & route optimization engine in Go using the **Haversine formula** (<12ms latency) and designed a **KrakenD API Gateway** layer handling **8,000+ req/sec** with sub-5ms proxy overhead.

**Client Web Applications & Production Deliverables** *(Next.js 16, React 19, Node.js, WebSockets, Tailwind CSS)*
- Delivered 10+ production web applications including custom CMS platforms, high-conversion e-commerce portals with secure payment checkouts (Razorpay, Cashfree), real-time analytics dashboards, and interactive 3D web experiences.
- Built responsive, SEO-optimized frontends in **Next.js 16** and **React 19** with Tailwind CSS, integrating WhatsApp messaging via **Interakt**, transactional SMS via **Fast2SMS**, and **IVR telematics**.

---

## EDUCATION
- **Bachelor of Engineering in Computer Science and Engineering** | *CGPA: 7.93 / 10*  
  Sri Shakthi Institute of Engineering and Technology, Coimbatore *(Oct 2021 – Apr 2025)*
- **Higher Secondary Certificate (Class 12)** | *Percentage: 93%*  
  Sai Vidhya Nikethan Matric Higher Secondary School, Alamarai Thottam *(Jun 2020 – Mar 2021)*
- **Secondary School Certificate (Class 10)** | *Percentage: 93.2%*  
  SRMV Swami Shivananda Higher Secondary School, Periyanaickenpalayam *(May 2018 – May 2019)*
