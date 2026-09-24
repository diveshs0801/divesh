# High-Converting Referral & Outreach Playbook
### Engineered for Divesh S | Backend & Full-Stack Software Engineer (NestJS, Go, TypeScript)

---

## ⚡ The Psychology: Why 90% of Referral Requests Fail (And How to Win)

Most candidates send messages like:  
> *"Hi Sir, I saw an opening for SDE at your company. Please refer me. Here is my resume."*

**Why this gets ignored 99% of the time:**
1. **High Friction:** The employee doesn't know which job ID to refer you for, has to search internal portals, and closes LinkedIn.
2. **No Social Proof:** The employee risks their reputation referring a stranger with no demonstrated proof of work.
3. **No Time:** The employee is busy coding. If submitting a referral takes more than 60 seconds, they will not do it.

### The 4 Rules of the 50%+ Conversion Formula:
1. **The Domain Hook:** Reference their exact stack or architectural challenge in the first sentence.
2. **The 2-Bullet Proof of Work:** Cite concrete metrics from your production systems (**TaxiBy**, **ProductCRM**, **Go/Kafka ERP**).
3. **The Zero-Friction Package:** Always provide the **Job Requisition ID**, **Direct Job URL**, and a **Google Drive Resume Link**.
4. **The "Plug-and-Play Internal Portal Blurb":** Provide a ready-made 3-sentence blurb that the employee can copy-paste directly into their internal referral system (Workday, Greenhouse, Lever).

---

## 📋 Table of Contents
1. [Domain-Specific Templates (Fintech, Mobility, SaaS, Go/Infra, Regional Tech)](#1-domain-specific-templates)
2. [Role-Specific Outreach (SDE-2 Peer, Engineering Manager, Recruiter)](#2-role-specific-outreach)
3. [Character-Capped Formats (LinkedIn Connection Note <200 chars, InMail)](#3-character-capped-formats)
4. [The "Plug-and-Play" Internal Portal Referral Blurbs](#4-the-plug-and-play-internal-portal-blurbs)
5. [Follow-Up Sequences (48 Hours & 5 Days)](#5-follow-up-sequences)

---

## 1. Domain-Specific Templates

### Template 1: Fintech & Payments
**Target Companies:** *Razorpay, Cashfree Payments, PhonePe, Juspay, Groww, CRED, Pine Labs, M2P Fintech, Decentro, Stripe, PayPal*

```text
Subject: Referral Request — SDE Backend (Job ID: [JOB_ID]) — Divesh S

Hi [Name],

I came across your work on the engineering team at [Company Name] and was really impressed by how you guys handle high-throughput financial transactions and payments infrastructure.

I'm a Backend Engineer with 1+ year of production experience building high-concurrency distributed systems with NestJS, Go (Golang), PostgreSQL, and Redis. A quick snapshot of relevant work:

• Engineered an immutable double-entry wallet ledger and automated payouts pipeline with Cashfree and Razorpay APIs, eliminating reconciliation discrepancies.
• Architected idempotent transaction workflows using Prisma transactions ($transaction) and Go background workers, guaranteeing zero duplicate payment records.
• Built high-throughput microservices using Go, Redis caching, and Kafka with transactional outbox guarantees handling 8,000+ req/sec.

I noticed an opening for [Role Title] (Requisition ID: [JOB_ID]) on your careers page: [JOB_LINK]. 

If you feel my background aligns with your team, would you be open to referring me internally? I have attached my resume and included a ready-to-paste referral blurb below to save you time.

Resume: [YOUR_GOOGLE_DRIVE_OR_NOTION_RESUME_LINK]
Portfolio / GitHub: https://github.com/diveshs0801

Either way, thank you for your time and keep up the great work at [Company Name]!

Best regards,
Divesh S
Coimbatore, India | +91 6382184458 | diveshs0801@gmail.com
```

---

### Template 2: Mobility, Quick-Commerce & Logistics
**Target Companies:** *Swiggy, Meesho, Flipkart, Myntra, Porter, Delhivery, Ola, Uber, Ather Energy, Locus.sh, Shiprocket, WayCool*

```text
Subject: Referral Request — SDE I / Backend Engineer (Job ID: [JOB_ID]) — Divesh S

Hi [Name],

I’ve been following [Company Name]’s engineering blog, especially your scaling work around driver dispatch, routing, and real-time order tracking.

I am a Backend Engineer with 1+ year of hands-on production experience architecting high-scale mobility systems (TaxiBy) using NestJS, Redis, WebSockets, and Go. Key highlights relevant to [Company Name]:

• Replaced expensive polygonal spatial queries with Uber’s H3 Hexagonal Spatial Index (Resolution 7) and Redis Sets, achieving sub-second driver dispatch with O(1) lookups (<2ms latency).
• Slashed third-party Google Maps API overhead by 70–80% via coordinate-rounding Redis caching, saving ₹25k–₹35k/month.
• Engineered real-time driver GPS telemetry streaming over WebSockets + Redis with distance-threshold throttling, reducing network payload by ~75%.

I would love to bring this experience to [Company Name] for the [Role Title] position (Job ID: [JOB_ID]): [JOB_LINK].

Would you be open to submitting an internal referral for me? To make it effortless for you, I’ve prepared an internal portal blurb below.

Resume: [YOUR_GOOGLE_DRIVE_OR_NOTION_RESUME_LINK]
LinkedIn: https://linkedin.com/in/divesh-s-57bbaa8236

Thank you so much for your time!

Best regards,
Divesh S
```

---

### Template 3: SaaS, CRM & AI Copilot Platforms
**Target Companies:** *Freshworks, Zoho, LeadSquared, Chargebee, Darwinbox, Postman, DevRev, Glean, Yellow.ai, Kapture CX, Rocketlane, Vymo*

```text
Subject: Referral Request — Backend / Full-Stack Engineer (Job ID: [JOB_ID]) — Divesh S

Hi [Name],

Hope you're having a great week! I’ve been closely tracking [Company Name]’s SaaS platform growth and appreciate the engineering precision behind your multi-tenant systems.

I am a Software Engineer with 1+ year of production experience designing enterprise SaaS platforms using NestJS, TypeScript, Next.js 16, and PostgreSQL. Highlights from my recent work:

• Architected ProductCRM (multi-tenant SaaS platform), engineering request-level tenant data isolation using NestJS and Node.js AsyncLocalStorage.
• Built an internal AI Copilot powered by DeepSeek LLM integrated with a custom Model Context Protocol (MCP) framework, implementing RBAC guardrails and 2-phase write confirmations.
• Designed idempotent multi-entity lead conversion and customer onboarding pipelines with Prisma $transaction, ensuring zero data duplication across tenant domains.

I saw the opening for [Role Title] (Job ID: [JOB_ID]) on your careers board: [JOB_LINK].

Given my direct background in multi-tenant SaaS and AI integrations, I would love the chance to be considered. Could you refer me internally? I have included an internal summary blurb below to make it quick for you.

Resume: [YOUR_GOOGLE_DRIVE_OR_NOTION_RESUME_LINK]
GitHub: https://github.com/diveshs0801

Thanks for your consideration!

Best regards,
Divesh S
```

---

### Template 4: High-Throughput Go & Kafka Distributed Systems
**Target Companies:** *Zerodha, Hasura, SigNoz, Confluent, CleverTap, Druva, BrowserStack, GitLab, Datadog*

```text
Subject: Referral Request — Backend / Distributed Systems Engineer (Job ID: [JOB_ID]) — Divesh S

Hi [Name],

I came across your work on [Company Name]’s engineering team. As an engineer deeply passionate about high-throughput systems, Go, and event-driven architecture, [Company Name] is at the top of my wishlist.

I have 1+ year of experience building distributed backend systems in Go (Golang), Kafka, and gRPC:

• Architected an enterprise multi-tenant ERP platform spanning 11 microservices in Go, gRPC, Apache Kafka, and PostgreSQL.
• Implemented the Transactional Outbox Pattern in Go with background worker relays and exponential backoff retry logic, eliminating dual-write failures across 15+ Kafka domain topics.
• Designed a KrakenD API Gateway layer handling 8,000+ req/sec with sub-5ms proxy overhead, paired with an in-memory Haversine routing engine in Go (<12ms latency).

I noticed the opening for [Role Title] (Job ID: [JOB_ID]): [JOB_LINK].

Would you be open to putting in a referral for me? I’ve added a ready-to-copy blurb below along with my resume link.

Resume: [YOUR_GOOGLE_DRIVE_OR_NOTION_RESUME_LINK]
GitHub: https://github.com/diveshs0801

Really appreciate your help!

Best regards,
Divesh S
```

---

### Template 5: Coimbatore & Regional Tech Powerhouses (Tamil Nadu)
**Target Companies:** *Kovai.co, Payoda, Kissflow, SurveySparrow, Soliton Technologies, Onwords, KGISL, Aspire Systems, Ramco, Tiger Analytics*

```text
Subject: Application / Referral — Software Engineer (Backend/Fullstack) — Divesh S (Coimbatore)

Hi [Name],

I hope you’re doing well! I’m reaching out as a fellow tech professional based right here in Coimbatore. I’ve been following [Company Name]’s journey and immense engineering footprint in Tamil Nadu.

I am a Software Engineer with 1+ year of production experience delivering end-to-end backend and full-stack systems with NestJS, Go (Golang), Next.js 16, and PostgreSQL. Key highlights:

• Architected real-time mobility microservices using NestJS, Uber H3 spatial index, and Redis Sets for sub-second driver dispatch.
• Built enterprise multi-tenant CRM platforms with AsyncLocalStorage isolation and MCP-based AI integrations.
• Based in Coimbatore / Tamil Nadu with immediate availability (minimal notice period) and zero relocation overhead for Coimbatore/Chennai offices.

I’m very keen on joining [Company Name] for the [Role Title] role (Job ID: [JOB_ID]): [JOB_LINK].

Could you refer me internally for this position? I have attached my resume and provided an internal portal blurb below.

Resume: [YOUR_GOOGLE_DRIVE_OR_NOTION_RESUME_LINK]
LinkedIn: https://linkedin.com/in/divesh-s-57bbaa8236

Thank you for supporting fellow local engineering talent!

Best regards,
Divesh S
Coimbatore | +91 6382184458
```

---

## 2. Role-Specific Outreach

### Pitch A: To an SDE-2 or Senior Backend Engineer (The Peer Hook — Highest Response Rate)
*Why this works:* SDE-2s get internal referral bonuses (₹40,000–₹1,50,000), remember the job search grind, and love talking engineering with peers.

```text
Hi [Name],

Saw your post/profile regarding your backend work at [Company Name] — really cool scale you're handling!

I'm a backend engineer (NestJS/Go/PostgreSQL/Kafka) with 1+ year of production experience building high-concurrency mobility and CRM platforms. Recently built an Uber H3 hexagonal spatial dispatch engine (<2ms latency) and a Kafka transactional outbox relay in Go.

I saw your team is hiring for [Role Title] (Job ID: [JOB_ID]). Would you be open to reviewing my resume and referring me internally if it looks like a fit?

Job Link: [JOB_LINK]
Resume: [RESUME_LINK]

Happy to share any code or details! Thanks a ton.
```

---

### Pitch B: To an Engineering Manager / Tech Lead (The Direct Problem-Solver Pitch)
*Why this works:* Engineering Managers care about candidates who can hit the ground running without hand-holding.

```text
Hi [Name],

I saw you lead the backend engineering efforts for [Team/Domain] at [Company Name]. 

If your team is currently scaling services that demand high concurrency, sub-second latency, and fault tolerance, I’d love to connect. Over the past year at Webnox, I:
1. Replaced polygon DB queries with Uber H3 indexing & Redis, achieving sub-second dispatch (<2ms) and cutting Google Maps API costs by 70%.
2. Built Go microservices with Kafka Transactional Outbox pattern eliminating dual-write failures across 15+ domain topics.
3. Designed multi-tenant CRM systems with AsyncLocalStorage tenant isolation and LLM tool execution.

I applied to the [Role Title] (Job ID: [JOB_ID]), but wanted to reach out directly to share how my hands-on experience matches your architecture. 

Resume: [RESUME_LINK]
GitHub: https://github.com/diveshs0801

I’d welcome 5 minutes to chat if you see a potential match for your team.
```

---

### Pitch C: To a Technical Recruiter / Talent Acquisition Specialist
*Why this works:* Recruiters want clear bullet points matching job descriptions, immediate availability, and a link to the resume.

```text
Hi [Name],

I noticed you are hiring for Software Engineers at [Company Name] and wanted to put myself on your radar for the [Role Title] role (Req ID: [JOB_ID]).

Brief summary of my qualifications:
• Experience: 1+ Year hands-on production software engineering
• Tech Stack: NestJS, Node.js, Go (Golang), TypeScript, PostgreSQL, Redis, Kafka, Docker
• Projects: Built real-time ride-hailing backend (TaxiBy) with Uber H3 spatial index, and multi-tenant CRM (ProductCRM) with AsyncLocalStorage & DeepSeek LLM
• Notice Period: Immediate / 15 Days
• Current Location: Coimbatore / open to Bangalore, Chennai, or Remote

Direct Requisition: [JOB_LINK]
Resume: [RESUME_LINK]

I would appreciate the opportunity to be considered for an interview. Thank you!
```

---

## 3. Character-Capped Formats

### Format A: LinkedIn Connection Request Note (<200 Characters)
*Use when adding an employee as a connection on LinkedIn without premium InMail.*

```text
Hi [Name], admire your work at [Company]! I'm a Backend Eng (NestJS/Go/Kafka, 1+ yr exp) keen on the [Role Title] role (ID: [JOB_ID]). Would love to connect and share a quick referral blurb if open!
```
*(Character count: ~194 characters — fits LinkedIn's 200 limit)*

### Format B: LinkedIn Connection Note (<200 Chars — Alternative)
```text
Hi [Name], fellow backend dev here (NestJS, Go, Redis). Saw [Company] hiring for [Role Title]. Built Uber H3 dispatch & Kafka microservices. Would appreciate connecting for a referral!
```
*(Character count: ~184 characters)*

---

## 4. The "Plug-and-Play" Internal Portal Referral Blurbs

> [!IMPORTANT]
> Always send this blurb to the employee right after they agree to refer you! When they open Workday, Greenhouse, or Lever, they are asked: **"Why do you recommend this candidate / How do you know them?"**  
> Giving them this snippet means they can submit your referral in 10 seconds flat!

### Copy-Paste Blurb for the Referrer:
```text
"I strongly recommend Divesh S for the Software Engineer role (Job ID: [JOB_ID]). He has 1+ year of production experience architecting high-concurrency backend services using NestJS, Go (Golang), TypeScript, PostgreSQL, and Redis. His work includes building real-time geospatial dispatch systems using Uber's H3 spatial index (<2ms latency), implementing the Transactional Outbox pattern across Kafka topics in Go, and architecting multi-tenant SaaS platforms with Node.js AsyncLocalStorage and AI tool integrations. He is an immediate joiner with strong problem-solving skills and clean architecture practices. Email: diveshs0801@gmail.com | Phone: +91 6382184458 | Resume: [RESUME_LINK]"
```

---

## 5. Follow-Up Sequences

### Follow-Up 1 (48 Hours Later):
```text
Hi [Name], hope you're having a productive week! Just following up on my note regarding the [Role Title] (Job ID: [JOB_ID]). I know you’re super busy, so no worries if you haven’t had a chance yet. Let me know if you need any additional info from my end. Thanks again!
```

### Follow-Up 2 (5 Days Later - Graceful Close):
```text
Hi [Name], following up one last time regarding the [Role Title] role. I’ve submitted my application through the portal as well. If you get a chance to flag my profile to the hiring team, that would be wonderful. Regardless, wishing you and the [Company] team continued success!
```
