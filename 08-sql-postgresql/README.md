# SQL & PostgreSQL — Complete Interview Guide

---

## 1. SQL Fundamentals

### Q: Types of SQL Commands

| Category | Commands | Purpose |
|----------|----------|---------|
| DDL (Data Definition) | CREATE, ALTER, DROP, TRUNCATE | Define/modify schema |
| DML (Data Manipulation) | SELECT, INSERT, UPDATE, DELETE | Manipulate data |
| DCL (Data Control) | GRANT, REVOKE | Permissions |
| TCL (Transaction Control) | BEGIN, COMMIT, ROLLBACK, SAVEPOINT | Transactions |

---

### Q: SELECT — Complete Guide

```sql
-- Basic SELECT
SELECT name, email FROM users;
SELECT * FROM users; -- All columns (avoid in production)
SELECT DISTINCT city FROM users; -- Unique values

-- WHERE — filtering
SELECT * FROM users
WHERE age > 18
  AND status = 'active'
  AND email LIKE '%@gmail.com'
  AND city IN ('Chennai', 'Coimbatore', 'Bangalore')
  AND created_at BETWEEN '2025-01-01' AND '2025-12-31'
  AND phone IS NOT NULL;

-- ORDER BY
SELECT * FROM users ORDER BY created_at DESC, name ASC;

-- LIMIT & OFFSET (pagination)
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20; -- Page 3 (10 per page)

-- Aliases
SELECT u.name AS user_name, COUNT(o.id) AS order_count
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.name;
```

---

### Q: JOINs — All Types

```sql
-- INNER JOIN — only matching rows from both tables
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN — all from left + matching from right (NULL if no match)
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- Users without orders will have NULL for o.total

-- RIGHT JOIN — all from right + matching from left
SELECT u.name, o.total
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;

-- FULL OUTER JOIN — all from both (NULL where no match)
SELECT u.name, o.total
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;

-- CROSS JOIN — cartesian product (every combination)
SELECT u.name, p.name AS product
FROM users u
CROSS JOIN products p;

-- SELF JOIN — table joins with itself
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;
```

---

### Q: GROUP BY & Aggregate Functions

```sql
-- Aggregate functions: COUNT, SUM, AVG, MIN, MAX
SELECT 
  city,
  COUNT(*) AS total_users,
  AVG(age) AS avg_age,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
  MIN(created_at) AS first_user,
  MAX(created_at) AS latest_user
FROM users
GROUP BY city
HAVING COUNT(*) > 5   -- Filter AFTER grouping (WHERE filters BEFORE grouping)
ORDER BY total_users DESC;

-- HAVING vs WHERE:
-- WHERE filters rows BEFORE grouping
-- HAVING filters groups AFTER grouping
```

---

### Q: Subqueries

```sql
-- Scalar subquery (returns single value)
SELECT name, age,
  (SELECT AVG(age) FROM users) AS avg_age
FROM users;

-- IN subquery
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- EXISTS (more efficient than IN for large datasets)
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 1000
);

-- Correlated subquery (references outer query — runs once per row)
SELECT u.name,
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
FROM users u;

-- CTE (Common Table Expression) — cleaner than subqueries
WITH high_value_orders AS (
  SELECT user_id, SUM(total) AS total_spent
  FROM orders
  GROUP BY user_id
  HAVING SUM(total) > 5000
)
SELECT u.name, h.total_spent
FROM users u
JOIN high_value_orders h ON u.id = h.user_id;

-- Recursive CTE (hierarchical data)
WITH RECURSIVE org_tree AS (
  -- Base case: root employees (no manager)
  SELECT id, name, manager_id, 0 AS depth
  FROM employees
  WHERE manager_id IS NULL
  
  UNION ALL
  
  -- Recursive case
  SELECT e.id, e.name, e.manager_id, ot.depth + 1
  FROM employees e
  JOIN org_tree ot ON e.manager_id = ot.id
)
SELECT * FROM org_tree ORDER BY depth, name;
```

---

### Q: Window Functions

```sql
-- ROW_NUMBER — unique sequential number
SELECT name, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- RANK — same rank for ties, gaps after
-- DENSE_RANK — same rank for ties, NO gaps
SELECT name, salary,
  RANK() OVER (ORDER BY salary DESC) AS rank,
  DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM employees;
-- salary: 100, 90, 90, 80
-- RANK:      1,  2,  2,  4  (gap at 3)
-- DENSE_RANK: 1, 2,  2,  3  (no gap)

-- Partition by department
SELECT name, department, salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees;

-- Running totals
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date) AS running_total
FROM transactions;

-- Moving average
SELECT date, amount,
  AVG(amount) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7d
FROM daily_sales;

-- LAG / LEAD — access previous/next row
SELECT date, amount,
  LAG(amount, 1) OVER (ORDER BY date) AS prev_amount,
  LEAD(amount, 1) OVER (ORDER BY date) AS next_amount,
  amount - LAG(amount, 1) OVER (ORDER BY date) AS daily_change
FROM daily_sales;

-- NTILE — divide into N buckets
SELECT name, salary,
  NTILE(4) OVER (ORDER BY salary DESC) AS quartile
FROM employees;
```

---

## 2. DDL & Schema Design

```sql
-- Create table
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,        -- Auto-increment integer
  -- or: id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  balance       DECIMAL(12, 2) DEFAULT 0.00, -- Exact decimal (NOT float!)
  metadata      JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at DESC);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true; -- Partial index
CREATE INDEX idx_users_metadata ON users USING GIN(metadata); -- GIN for JSONB
CREATE UNIQUE INDEX idx_users_email_unique ON users(LOWER(email)); -- Case-insensitive unique

-- Foreign keys
CREATE TABLE orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total      DECIMAL(12, 2) NOT NULL,
  status     VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ALTER TABLE
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users ALTER COLUMN name TYPE TEXT;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;
ALTER TABLE users RENAME COLUMN name TO full_name;
```

---

## 3. Transactions & ACID

### Q: What is ACID?

| Property | Meaning | Example |
|----------|---------|---------|
| **Atomicity** | All or nothing | Transfer: debit AND credit both succeed or both fail |
| **Consistency** | Valid state before and after | Balance can't go negative if CHECK constraint exists |
| **Isolation** | Concurrent txns don't interfere | Two transfers don't read stale balances |
| **Durability** | Committed data survives crashes | After COMMIT, data is on disk |

```sql
-- Transaction example: Money transfer
BEGIN;

UPDATE wallets SET balance = balance - 100.00
WHERE user_id = 1 AND balance >= 100.00; -- Check sufficient balance

-- Check if debit succeeded (affected 1 row)
-- If 0 rows affected → insufficient balance → ROLLBACK

UPDATE wallets SET balance = balance + 100.00
WHERE user_id = 2;

-- Insert ledger entry for audit trail
INSERT INTO transactions (from_id, to_id, amount, type)
VALUES (1, 2, 100.00, 'transfer');

COMMIT;

-- If anything fails:
ROLLBACK;

-- Savepoints (partial rollback)
BEGIN;
SAVEPOINT sp1;
INSERT INTO orders (...) VALUES (...);
-- Error! Rollback only this part
ROLLBACK TO sp1;
INSERT INTO orders (...) VALUES (...); -- Try again
COMMIT;
```

### Q: Isolation Levels

| Level | Dirty Read | Non-repeatable Read | Phantom Read | Speed |
|-------|-----------|-------------------|-------------|-------|
| READ UNCOMMITTED | ✅ | ✅ | ✅ | Fastest |
| READ COMMITTED (PG default) | ❌ | ✅ | ✅ | Fast |
| REPEATABLE READ | ❌ | ❌ | ✅ | Medium |
| SERIALIZABLE | ❌ | ❌ | ❌ | Slowest |

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
-- Your queries here
COMMIT;
```

---

## 4. PostgreSQL-Specific Features

### Q: JSONB

```sql
-- Store JSON data
INSERT INTO users (name, metadata) VALUES
('Divesh', '{"skills": ["Go", "TypeScript"], "experience": 1}');

-- Query JSONB
SELECT * FROM users WHERE metadata->>'experience' = '1';
SELECT * FROM users WHERE metadata @> '{"skills": ["Go"]}'; -- Contains
SELECT metadata->'skills' FROM users;       -- Returns JSON
SELECT metadata->>'experience' FROM users;  -- Returns text
SELECT jsonb_array_length(metadata->'skills') FROM users;

-- Update JSONB
UPDATE users SET metadata = metadata || '{"city": "Coimbatore"}';
UPDATE users SET metadata = metadata - 'city'; -- Remove key
UPDATE users SET metadata = jsonb_set(metadata, '{experience}', '2');
```

### Q: Array type

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT,
  labels TEXT[] DEFAULT '{}'
);

INSERT INTO tags (name, labels) VALUES ('post1', ARRAY['tech', 'go', 'backend']);
SELECT * FROM tags WHERE 'go' = ANY(labels);
SELECT * FROM tags WHERE labels @> ARRAY['tech', 'go']; -- Contains all
```

### Q: EXPLAIN ANALYZE — Query Optimization

```sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id)
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.is_active = true
GROUP BY u.name
ORDER BY COUNT(o.id) DESC
LIMIT 10;

-- Reads the output:
-- Seq Scan → full table scan (BAD for large tables, needs index)
-- Index Scan → using index (GOOD)
-- Hash Join → joining tables via hash
-- Sort → sorting results
-- Actual time → real execution time
-- Rows → number of rows processed

-- Common optimizations:
-- 1. Add indexes on WHERE/JOIN/ORDER BY columns
-- 2. Use LIMIT with ORDER BY
-- 3. Avoid SELECT * (select only needed columns)
-- 4. Use EXISTS instead of IN for subqueries
-- 5. VACUUM ANALYZE to update statistics
-- 6. Use connection pooling (PgBouncer)
```

---

## 5. N+1 Query Problem

```sql
-- ❌ N+1 Problem (common in ORMs)
-- Query 1: SELECT * FROM users (returns 100 users)
-- Query 2-101: SELECT * FROM orders WHERE user_id = ? (one per user!)
-- Total: 101 queries!

-- ✅ Fix: JOIN or subquery
SELECT u.*, o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
-- 1 query!

-- ✅ Fix in ORM (Prisma example):
-- prisma.user.findMany({ include: { orders: true } })
-- Generates 2 queries: SELECT users, then SELECT orders WHERE user_id IN (...)
```

---

## 6. Normalization

| Normal Form | Rule | Example Violation |
|-------------|------|-------------------|
| 1NF | Atomic values, no repeating groups | skills = "Go, TypeScript" (should be separate rows/table) |
| 2NF | 1NF + no partial dependency on composite key | Non-key column depends on part of a composite PK |
| 3NF | 2NF + no transitive dependency | city → state → country (city shouldn't store state) |

```sql
-- Denormalized (bad)
CREATE TABLE orders (
  id INT, user_name TEXT, user_email TEXT, product TEXT, price DECIMAL
);

-- Normalized (good)
CREATE TABLE users (id INT PRIMARY KEY, name TEXT, email TEXT);
CREATE TABLE products (id INT PRIMARY KEY, name TEXT, price DECIMAL);
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  product_id INT REFERENCES products(id),
  quantity INT
);
```

---

## 7. Prisma ORM (TypeScript — used in your stack)

```typescript
// schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  orders    Order[]
  wallet    Wallet?
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("users")
}

model Order {
  id     Int     @id @default(autoincrement())
  total  Decimal @db.Decimal(12, 2)
  userId Int     @map("user_id")
  user   User    @relation(fields: [userId], references: [id])
  
  @@map("orders")
}

// Queries
const users = await prisma.user.findMany({
  where: { isActive: true },
  include: { orders: true }, // Eager load (avoids N+1)
  orderBy: { createdAt: "desc" },
  take: 10,
  skip: 0,
});

const user = await prisma.user.findUniqueOrThrow({
  where: { id: 1 },
});

// Transaction (atomic)
await prisma.$transaction(async (tx) => {
  await tx.wallet.update({
    where: { userId: senderId },
    data: { balance: { decrement: new Decimal("100.00") } },
  });
  await tx.wallet.update({
    where: { userId: receiverId },
    data: { balance: { increment: new Decimal("100.00") } },
  });
  await tx.transaction.create({
    data: { fromId: senderId, toId: receiverId, amount: new Decimal("100.00") },
  });
});

// Raw SQL
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`;
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| JOIN types | INNER (match both), LEFT (all left), RIGHT (all right), FULL (all both) |
| GROUP BY | Aggregate + HAVING for group filter |
| Window fn | ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, SUM OVER |
| CTE | WITH name AS (...) for readable subqueries |
| ACID | Atomicity, Consistency, Isolation, Durability |
| Indexes | B-tree (default), GIN (JSONB/arrays), partial, unique |
| EXPLAIN | Seq Scan = bad, Index Scan = good |
| N+1 | Use JOIN or include/eager-load in ORM |
| DECIMAL | ALWAYS use for money. NEVER use float. |
| Transaction | BEGIN → queries → COMMIT/ROLLBACK |
| Normalization | 1NF=atomic, 2NF=no partial deps, 3NF=no transitive deps |
