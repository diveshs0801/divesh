# Express.js — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is Express.js?

Express is a minimal, unopinionated web framework for Node.js. It provides routing, middleware support, and HTTP utility methods.

```javascript
const express = require("express");
const app = express();

// Built-in middleware
app.use(express.json());                    // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static("public"));          // Serve static files

app.listen(3000, () => console.log("Server on :3000"));
```

---

## 2. Routing

```javascript
// Basic routes
app.get("/", (req, res) => res.send("Hello"));
app.post("/users", (req, res) => res.status(201).json(req.body));
app.put("/users/:id", (req, res) => res.json({ id: req.params.id }));
app.delete("/users/:id", (req, res) => res.status(204).send());
app.patch("/users/:id", (req, res) => res.json({ updated: true }));

// Route parameters
app.get("/users/:userId/posts/:postId", (req, res) => {
  const { userId, postId } = req.params;
  res.json({ userId, postId });
});

// Query parameters: GET /search?q=hello&page=1
app.get("/search", (req, res) => {
  const { q, page } = req.query;
  res.json({ query: q, page });
});

// Router — modular route handling
const userRouter = express.Router();

userRouter.get("/", (req, res) => res.json([]));
userRouter.get("/:id", (req, res) => res.json({ id: req.params.id }));
userRouter.post("/", (req, res) => res.status(201).json(req.body));
userRouter.put("/:id", (req, res) => res.json({ updated: true }));
userRouter.delete("/:id", (req, res) => res.status(204).send());

app.use("/api/users", userRouter); // Mount at /api/users

// Route chaining
app.route("/books")
  .get((req, res) => res.json([]))
  .post((req, res) => res.status(201).json(req.body))
  .put((req, res) => res.json({ updated: true }));
```

---

## 3. Middleware

### Q: What is Middleware in Express?

Functions that have access to `req`, `res`, and `next`. They execute sequentially in the order they are defined.

```javascript
// Application-level middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} — ${new Date().toISOString()}`);
  next(); // MUST call next() to continue
});

// Route-specific middleware
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

app.get("/admin", authenticate, authorize("admin"), (req, res) => {
  res.json({ message: "Admin panel" });
});

// Error-handling middleware (4 parameters!)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Async error handling (wrap async handlers)
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get("/users", asyncHandler(async (req, res) => {
  const users = await db.query("SELECT * FROM users");
  res.json(users);
  // If this throws, error is caught and passed to error middleware
}));
```

### Q: Middleware execution order

```
Request → app.use() middleware (in order defined)
  → Router middleware
    → Route handler
      → Error handler (if error thrown/passed to next(err))
        → Response
```

---

## 4. Request & Response

```javascript
// REQUEST object
req.params      // URL parameters (/users/:id → req.params.id)
req.query       // Query string (/search?q=hello → req.query.q)
req.body        // Request body (POST/PUT, needs parser middleware)
req.headers     // Request headers
req.method      // GET, POST, PUT, DELETE, etc.
req.url         // Request URL
req.path        // URL path
req.ip          // Client IP
req.cookies     // Cookies (needs cookie-parser)
req.hostname    // Host name
req.protocol    // http or https
req.get("Content-Type") // Get specific header

// RESPONSE object
res.status(200).json({ data: "hello" });     // JSON response
res.status(201).send("Created");              // Text response
res.status(204).send();                       // No content
res.status(301).redirect("/new-url");         // Redirect
res.sendFile("/path/to/file.pdf");            // Send file
res.download("/path/to/file.pdf", "report.pdf"); // Download file
res.set("X-Custom-Header", "value");          // Set header
res.cookie("token", "abc", { httpOnly: true, secure: true, maxAge: 3600000 });
res.clearCookie("token");
res.type("json");                             // Set Content-Type
```

---

## 5. Error Handling Patterns

```javascript
// Custom Error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized error handler
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  } else {
    // Production: don't leak stack traces
    res.status(err.statusCode).json({
      success: false,
      error: err.isOperational ? err.message : "Something went wrong",
    });
  }
});

// 404 handler (MUST be after all routes)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found` });
});
```

---

## 6. Security Best Practices

```javascript
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: ["https://myapp.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  message: "Too many requests",
}));

// Request size limit
app.use(express.json({ limit: "10kb" }));

// Disable X-Powered-By
app.disable("x-powered-by");
```

---

## 7. Express vs NestJS Comparison

| Feature | Express | NestJS |
|---------|---------|--------|
| Architecture | Minimal, unopinionated | Modular, opinionated (Angular-like) |
| TypeScript | Manual setup | First-class support |
| DI | None built-in | Built-in IoC container |
| Validation | Manual (joi, express-validator) | Built-in (class-validator + pipes) |
| Testing | Manual setup | Built-in testing utilities |
| Microservices | DIY | Built-in transport layers |
| Learning curve | Low | Medium-High |
| Best for | Simple APIs, quick prototypes | Large-scale enterprise apps |

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Middleware | req → middleware1 → middleware2 → handler → error handler → res |
| Error middleware | Must have 4 params: (err, req, res, next) |
| Router | express.Router() for modular routes |
| Async errors | Wrap in try/catch or use asyncHandler wrapper |
| Security | helmet, cors, rate-limit, input validation |
| req.params | URL params (:id) |
| req.query | Query string (?key=val) |
| req.body | POST/PUT body (needs express.json()) |
