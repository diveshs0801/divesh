# Node.js — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is Node.js?

Node.js is a **JavaScript runtime** built on Chrome's V8 engine. It lets you run JS outside the browser — on servers, CLI tools, etc.

**Key characteristics:**
- **Single-threaded** with an **event-driven, non-blocking I/O** model
- Uses **libuv** for async I/O (file system, network, DNS, etc.)
- Ideal for **I/O-heavy** applications (APIs, real-time apps, microservices)
- NOT ideal for **CPU-heavy** computation (blocks the event loop)

---

### Q: How does the Node.js Event Loop work?

The event loop is what allows Node.js to perform non-blocking I/O despite being single-threaded.

```
   ┌───────────────────────────┐
┌─>│         timers            │  ← setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  ← I/O callbacks deferred to next iteration
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  ← internal use only
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │          poll             │  ← retrieve new I/O events; execute I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │          check            │  ← setImmediate callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │      close callbacks      │  ← socket.on('close', ...)
│  └───────────────────────────┘
        ↑                    │
        └────────────────────┘
```

**Between each phase, the microtask queue (Promise callbacks, process.nextTick) is drained.**

```javascript
// Priority order:
// 1. process.nextTick (highest priority microtask)
// 2. Promise callbacks (microtask)
// 3. setTimeout/setInterval (timers phase)
// 4. setImmediate (check phase)
// 5. I/O callbacks (poll phase)

console.log("start");

setTimeout(() => console.log("setTimeout"), 0);
setImmediate(() => console.log("setImmediate"));
process.nextTick(() => console.log("nextTick"));
Promise.resolve().then(() => console.log("promise"));

console.log("end");

// Output: start, end, nextTick, promise, setTimeout, setImmediate
// (setTimeout vs setImmediate order can vary when not inside I/O callback)

// Inside I/O callback, setImmediate ALWAYS fires before setTimeout:
const fs = require("fs");
fs.readFile(__filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// Output: immediate, timeout (guaranteed order)
```

---

### Q: process.nextTick vs setImmediate vs setTimeout

| | process.nextTick | Promise.then | setTimeout(fn, 0) | setImmediate |
|-|-----------------|-------------|-------------------|-------------|
| Queue | Microtask (nextTick queue) | Microtask (promise queue) | Macrotask (timers) | Macrotask (check) |
| When | Before ANY other microtask | After nextTick, before macrotask | Timers phase | Check phase |
| Use case | Ensure callback runs before I/O | Async flow | Delay execution | After I/O completion |

**Warning:** Recursive `process.nextTick` can starve I/O (blocks event loop).

```javascript
// This STARVES the event loop:
function badRecursion() {
  process.nextTick(badRecursion); // I/O callbacks never run!
}

// Use setImmediate for safe recursion:
function safeRecursion() {
  setImmediate(safeRecursion); // Allows I/O between iterations
}
```

---

## 2. Modules

### Q: CommonJS vs ES Modules in Node.js

```javascript
// === CommonJS (default in Node.js) ===
// Synchronous, require/module.exports
const fs = require("fs");
const { readFile } = require("fs");
module.exports = { myFunction };
module.exports = myFunction;

// === ES Modules ===
// Async, import/export
// Enable via: "type": "module" in package.json OR use .mjs extension
import fs from "fs";
import { readFile } from "fs/promises";
export const myFunction = () => {};
export default myFunction;

// Dynamic import (works in both)
const mod = await import("./module.mjs");
```

| Feature | CommonJS | ES Modules |
|---------|----------|------------|
| Syntax | require/module.exports | import/export |
| Loading | Synchronous | Asynchronous |
| Top-level await | ❌ | ✅ |
| Tree-shaking | ❌ | ✅ |
| this in module | module.exports | undefined |
| __dirname | ✅ Available | ❌ Use import.meta.url |
| Conditional imports | ✅ require() anywhere | ❌ import must be top-level |

```javascript
// Getting __dirname in ESM:
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

---

## 3. Streams

### Q: What are Streams? Types?

Streams are collections of data that might not be available all at once. They process data piece by piece (chunks) without loading everything into memory.

**4 Types:**
1. **Readable** — source of data (fs.createReadStream, http request)
2. **Writable** — destination (fs.createWriteStream, http response)
3. **Duplex** — both readable AND writable (TCP socket, WebSocket)
4. **Transform** — duplex that can modify data (zlib, crypto)

```javascript
const fs = require("fs");
const zlib = require("zlib");

// Reading a large file — BAD (loads entire file into memory)
const data = fs.readFileSync("huge-file.log"); // ❌ Could crash with 2GB file

// Reading a large file — GOOD (streams chunk by chunk)
const readable = fs.createReadStream("huge-file.log", {
  highWaterMark: 64 * 1024, // 64KB chunks
  encoding: "utf8",
});

readable.on("data", (chunk) => {
  console.log(`Received ${chunk.length} bytes`);
});
readable.on("end", () => console.log("Done"));
readable.on("error", (err) => console.error(err));

// Pipe — connect streams
fs.createReadStream("input.txt")
  .pipe(zlib.createGzip())           // Transform: compress
  .pipe(fs.createWriteStream("input.txt.gz"));

// pipeline — better error handling (recommended)
const { pipeline } = require("stream/promises");

await pipeline(
  fs.createReadStream("input.txt"),
  zlib.createGzip(),
  fs.createWriteStream("input.txt.gz"),
);

// Writable stream
const writable = fs.createWriteStream("output.txt");
writable.write("Hello ");
writable.write("World\n");
writable.end(); // Signal done

// Backpressure — when writable is slower than readable
// .write() returns false when internal buffer is full
// Wait for 'drain' event before writing more
const writer = fs.createWriteStream("output.txt");
function write(data) {
  const ok = writer.write(data);
  if (!ok) {
    writer.once("drain", () => {
      // Safe to write more
    });
  }
}
```

---

## 4. Buffer & File System

### Q: What is a Buffer?

Buffer is a fixed-size chunk of memory for handling binary data (files, network packets, images).

```javascript
// Create buffers
const buf1 = Buffer.from("Hello", "utf8");
const buf2 = Buffer.alloc(10);      // 10 bytes, filled with 0
const buf3 = Buffer.allocUnsafe(10); // 10 bytes, NOT zeroed (faster but unsafe)

// Convert
buf1.toString("utf8");    // "Hello"
buf1.toString("base64");  // "SGVsbG8="
buf1.toString("hex");     // "48656c6c6f"

// Operations
buf1.length;              // 5 bytes
Buffer.concat([buf1, buf2]);
buf1.slice(0, 3);         // "Hel" (shares memory!)
buf1.copy(buf2);
buf1.equals(buf2);        // false
```

### Q: File System operations

```javascript
const fs = require("fs");
const fsp = require("fs/promises"); // Promise-based (preferred)

// Read
const data = await fsp.readFile("file.txt", "utf8");

// Write
await fsp.writeFile("file.txt", "content", "utf8");

// Append
await fsp.appendFile("file.txt", "\nnew line");

// Check existence
try {
  await fsp.access("file.txt");
  console.log("File exists");
} catch {
  console.log("File does not exist");
}

// Directory operations
await fsp.mkdir("new-dir", { recursive: true });
const files = await fsp.readdir(".", { withFileTypes: true });
files.forEach(f => console.log(f.name, f.isDirectory()));

// Watch for changes
fs.watch(".", { recursive: true }, (eventType, filename) => {
  console.log(eventType, filename);
});

// Stats
const stats = await fsp.stat("file.txt");
console.log(stats.size, stats.isFile(), stats.isDirectory());
```

---

## 5. Error Handling

### Q: Error handling patterns in Node.js

```javascript
// 1. try/catch for sync code
try {
  const data = JSON.parse(invalidJSON);
} catch (err) {
  console.error(err.message);
}

// 2. try/catch with async/await
async function fetchData() {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    throw err; // re-throw or handle
  }
}

// 3. Error-first callbacks (legacy pattern)
fs.readFile("file.txt", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});

// 4. Event emitter errors
emitter.on("error", (err) => {
  console.error("Emitter error:", err);
});

// 5. Global handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught:", err);
  process.exit(1); // MUST exit — state is corrupted
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

// 6. Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 7. Operational vs Programmer errors
// Operational: expected failures (network timeout, invalid input, file not found)
//   → Handle gracefully (return error response, retry, log)
// Programmer: bugs (TypeError, undefined access, wrong arguments)
//   → Fix the code, crash and restart
```

---

## 6. Clustering & Worker Threads

### Q: How to utilize multiple CPU cores?

Node.js is single-threaded, but you can:

```javascript
// === cluster module === (multi-process)
// Each worker is a separate Node.js process with its own V8 + event loop
const cluster = require("cluster");
const os = require("os");
const http = require("http");

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary ${process.pid} is running`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork(); // Create worker processes
  }
  
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork(); // Auto-restart
  });
} else {
  http.createServer((req, res) => {
    res.end(`Handled by worker ${process.pid}\n`);
  }).listen(3000);
  
  console.log(`Worker ${process.pid} started`);
}

// === worker_threads === (multi-threaded, shared memory)
// For CPU-intensive tasks (crypto, image processing, parsing)
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");

if (isMainThread) {
  const worker = new Worker(__filename, {
    workerData: { num: 42 },
  });
  
  worker.on("message", (result) => {
    console.log("Result from worker:", result);
  });
  
  worker.on("error", (err) => console.error(err));
  worker.on("exit", (code) => console.log(`Worker exited with code ${code}`));
} else {
  // Heavy computation
  const result = fibonacci(workerData.num);
  parentPort.postMessage(result);
}

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

| Feature | cluster | worker_threads |
|---------|---------|---------------|
| Type | Multi-process | Multi-thread |
| Memory | Separate (IPC) | Can share (SharedArrayBuffer) |
| Use case | HTTP servers, load balancing | CPU-heavy computation |
| Overhead | Higher (separate V8) | Lower (shared V8) |
| Communication | IPC messages | Messages + SharedArrayBuffer |

---

## 7. Environment & Process

```javascript
// Environment variables
process.env.NODE_ENV     // "development" | "production"
process.env.PORT         // "3000"
process.env.DATABASE_URL // "postgresql://..."

// Process info
process.pid              // Process ID
process.version          // Node.js version
process.platform         // "linux", "darwin", "win32"
process.memoryUsage()    // { rss, heapTotal, heapUsed, external }
process.uptime()         // Seconds since process started
process.cwd()            // Current working directory
process.argv             // Command line arguments
process.exit(0)          // Exit with code 0 (success)
process.exit(1)          // Exit with code 1 (error)

// Signal handling
process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Graceful shutdown...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("Ctrl+C pressed. Shutting down...");
  process.exit(0);
});
```

---

## 8. HTTP & Networking

```javascript
const http = require("http");

// Basic HTTP server
const server = http.createServer((req, res) => {
  // req is a Readable stream
  // res is a Writable stream
  
  const { method, url, headers } = req;
  
  if (method === "GET" && url === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  
  if (method === "POST" && url === "/api/data") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      const data = JSON.parse(body);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ received: data }));
    });
    return;
  }
  
  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000, () => console.log("Server on :3000"));

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("HTTP server closed");
    // Close DB connections, flush logs, etc.
    process.exit(0);
  });
});
```

---

## 9. EventEmitter

```javascript
const { EventEmitter } = require("events");

class OrderService extends EventEmitter {
  createOrder(order) {
    // Process order...
    this.emit("order:created", order);
    return order;
  }
}

const service = new OrderService();

// Multiple listeners
service.on("order:created", (order) => {
  console.log("Send email for order:", order.id);
});
service.on("order:created", (order) => {
  console.log("Update inventory for order:", order.id);
});

// Once — fires only once
service.once("order:created", (order) => {
  console.log("First order bonus!");
});

// Error handling — MUST listen for 'error' or process crashes
service.on("error", (err) => {
  console.error("Service error:", err);
});

// Remove listener
const handler = (order) => console.log(order);
service.on("order:created", handler);
service.off("order:created", handler); // or removeListener

// Max listeners warning
service.setMaxListeners(20); // Default is 10
```

---

## 10. Security Best Practices

```javascript
// 1. Validate & sanitize ALL input
// Never trust req.body, req.params, req.query

// 2. Use parameterized queries (prevent SQL injection)
// ❌ `SELECT * FROM users WHERE id = ${id}`
// ✅ `SELECT * FROM users WHERE id = $1`, [id]

// 3. Rate limiting
// Use express-rate-limit, Redis-based limiters

// 4. Helmet.js (security headers)
// app.use(helmet());

// 5. CORS — restrict origins
// app.use(cors({ origin: "https://myapp.com" }));

// 6. Environment variables for secrets (never hardcode)
// Use .env files + dotenv, never commit secrets

// 7. Keep dependencies updated
// npm audit, npm audit fix

// 8. Use HTTPS in production

// 9. Hash passwords (bcrypt, argon2)
const bcrypt = require("bcrypt");
const hash = await bcrypt.hash(password, 12);
const isMatch = await bcrypt.compare(input, hash);
```

---

## 11. Package Management (npm)

```bash
# package.json scripts
npm init -y                    # Create package.json
npm install express            # Add dependency
npm install -D jest            # Add dev dependency
npm install -g nodemon         # Global install

# Versioning: ^1.2.3 (minor+patch), ~1.2.3 (patch only), 1.2.3 (exact)

# package-lock.json — locks exact versions for reproducible installs
# ALWAYS commit package-lock.json

# npx — run packages without installing
npx ts-node script.ts
```

---

## 12. Common Interview Patterns

### Promisify callback-based functions
```javascript
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const data = await readFile("file.txt", "utf8");
```

### Graceful shutdown
```javascript
async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // 1. Stop accepting new connections
  server.close();
  
  // 2. Wait for existing requests to finish (with timeout)
  const timeout = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
  
  // 3. Close database connections
  await db.disconnect();
  
  // 4. Flush logs
  clearTimeout(timeout);
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

### Memory leak detection
```javascript
// Monitor memory usage
setInterval(() => {
  const { heapUsed, heapTotal, rss } = process.memoryUsage();
  console.log({
    heapUsed: `${(heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(rss / 1024 / 1024).toFixed(2)} MB`,
  });
}, 10000);

// Common causes:
// 1. Global variables growing unbounded
// 2. Closures holding references to large objects
// 3. Event listeners not removed
// 4. Unclosed streams/connections
// 5. Caches without eviction policies
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Event Loop | timers → pending → poll → check → close (microtasks between each) |
| nextTick vs setImmediate | nextTick = before everything, setImmediate = after I/O |
| Streams | Readable, Writable, Duplex, Transform. Use pipeline(). |
| Buffer | Fixed-size binary data. Buffer.from(), .toString() |
| cluster | Multi-process, separate memory, for HTTP servers |
| worker_threads | Multi-thread, shared memory, for CPU work |
| CJS vs ESM | require/module.exports vs import/export |
| Error handling | try/catch, error events, process.on('uncaughtException') |
| Graceful shutdown | Stop new connections → finish existing → close DB → exit |
