# API Gateway — Complete Interview Guide

---

## 1. What is an API Gateway?

Single entry point for all client requests. Routes requests to appropriate microservices.

```
Client → API Gateway → Service A
                     → Service B
                     → Service C
```

### Responsibilities:
- **Request routing** (path-based, header-based)
- **Authentication & Authorization** (JWT validation)
- **Rate limiting & throttling**
- **Load balancing**
- **CORS termination**
- **Request/Response transformation**
- **Response aggregation** (combine multiple service responses)
- **Caching**
- **Logging & monitoring**
- **SSL/TLS termination**
- **Circuit breaking**

---

## 2. KrakenD (Your ERP Project)

```json
// krakend.json
{
  "version": 3,
  "name": "ERP API Gateway",
  "port": 8080,
  "timeout": "3000ms",
  "cache_ttl": "300s",
  "endpoints": [
    {
      "endpoint": "/api/v1/users",
      "method": "GET",
      "backend": [
        {
          "url_pattern": "/users",
          "host": ["http://user-service:3001"],
          "timeout": "2000ms"
        }
      ],
      "extra_config": {
        "auth/validator": {
          "alg": "RS256",
          "jwk_url": "http://auth-service:3000/.well-known/jwks.json",
          "roles_key": "roles",
          "roles": ["admin", "user"],
          "propagate_claims": [
            ["sub", "x-user-id"],
            ["tenant", "x-tenant-id"]
          ]
        },
        "qos/ratelimit/router": {
          "max_rate": 100,
          "client_max_rate": 10,
          "strategy": "ip"
        }
      }
    },
    {
      "endpoint": "/api/v1/dashboard",
      "method": "GET",
      "backend": [
        {
          "url_pattern": "/users/stats",
          "host": ["http://user-service:3001"],
          "group": "users"
        },
        {
          "url_pattern": "/orders/stats",
          "host": ["http://order-service:3002"],
          "group": "orders"
        }
      ]
      // Response aggregation: combines both responses
      // { "users": {...}, "orders": {...} }
    }
  ]
}
```

### Q: KrakenD Features (from your resume)
- **Stateless JWT authentication** — validates JWT without hitting auth service
- **CORS termination** — handles CORS at gateway level
- **Tenant context injection** — adds X-Tenant-ID header from JWT claims
- **8,000+ req/sec** with **sub-5ms proxy overhead**
- **No runtime dependencies** — single binary, no database

---

## 3. NGINX as API Gateway

```nginx
# nginx.conf
upstream user_service {
    server user-service:3001;
    server user-service:3002;  # Load balancing
}

upstream order_service {
    server order-service:3003;
}

server {
    listen 80;
    server_name api.myapp.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

    # CORS
    add_header Access-Control-Allow-Origin "https://myapp.com";
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE";

    # Route to user service
    location /api/users {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://user_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Request-ID $request_id;
    }

    # Route to order service
    location /api/orders {
        proxy_pass http://order_service;
    }

    # WebSocket upgrade
    location /socket.io/ {
        proxy_pass http://tracking_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check
    location /health {
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }
}
```

---

## 4. Gateway Patterns

### Q: BFF (Backend for Frontend)
```
Mobile App → Mobile BFF → Services (optimized payload for mobile)
Web App   → Web BFF    → Services (richer payload for desktop)
Admin     → Admin BFF  → Services (admin-specific aggregation)
```

### Q: API Composition / Aggregation
```
Client: GET /api/dashboard

Gateway:
  1. GET /users/stats → { totalUsers: 1000 }
  2. GET /orders/stats → { totalOrders: 5000 }
  3. GET /revenue/stats → { totalRevenue: 500000 }

Response: { users: {...}, orders: {...}, revenue: {...} }
// One client request → multiple internal requests → combined response
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| API Gateway | Single entry point. Routing, auth, rate limiting. |
| KrakenD | Stateless, declarative, high-performance. JSON config. |
| NGINX | Web server + reverse proxy + load balancer. |
| Rate Limiting | Max requests per time window per client/IP. |
| JWT Validation | Validate token at gateway. No round-trip to auth service. |
| CORS | Handle at gateway. Add headers for cross-origin. |
| Aggregation | Combine multiple service responses into one. |
| BFF | Separate gateway per client type (mobile, web, admin). |
| Load Balancing | Round-robin, least connections, IP hash. |
