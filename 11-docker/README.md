# Docker — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is Docker?
Platform for building, shipping, and running applications in containers. A container is an isolated, lightweight process that packages code + dependencies.

### Q: Container vs VM
| Container | VM |
|-----------|-----|
| Shares host OS kernel | Full guest OS |
| Lightweight (MBs) | Heavy (GBs) |
| Starts in seconds | Starts in minutes |
| Process-level isolation | Hardware-level isolation |
| Docker Engine | Hypervisor (VMware, VirtualBox) |

---

## 2. Dockerfile

```dockerfile
# Multi-stage build (production-optimized)

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production    # Install ONLY production deps
COPY . .
RUN npm run build               # Compile TypeScript

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Don't run as root
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

### Key Dockerfile Instructions

| Instruction | Purpose |
|-------------|---------|
| FROM | Base image |
| WORKDIR | Set working directory |
| COPY | Copy files from host to container |
| RUN | Execute command during build |
| CMD | Default command when container starts |
| ENTRYPOINT | Fixed executable (CMD becomes arguments) |
| EXPOSE | Document which port (doesn't actually publish) |
| ENV | Set environment variable |
| ARG | Build-time variable |
| VOLUME | Mount point for persistent data |
| USER | Run as non-root user |
| HEALTHCHECK | Container health check |

### Q: CMD vs ENTRYPOINT
```dockerfile
# CMD — can be overridden when running container
CMD ["node", "server.js"]
# docker run myapp        → runs "node server.js"
# docker run myapp bash   → runs "bash" (overridden)

# ENTRYPOINT — fixed, CMD becomes default arguments
ENTRYPOINT ["node"]
CMD ["server.js"]
# docker run myapp        → runs "node server.js"
# docker run myapp app.js → runs "node app.js"
```

### Q: COPY vs ADD
```dockerfile
COPY . .           # Simple copy. Use this 99% of the time.
ADD app.tar.gz .   # Extracts archives automatically
ADD https://... .  # Downloads from URL (prefer curl/wget in RUN)
```

---

## 3. Docker Commands

```bash
# Build
docker build -t myapp:1.0 .
docker build -t myapp:1.0 -f Dockerfile.prod .

# Run
docker run -d -p 3000:3000 --name myapp myapp:1.0
docker run -d -p 3000:3000 -e NODE_ENV=production --name myapp myapp:1.0
docker run -d -v /host/data:/app/data myapp:1.0    # Volume mount
docker run --rm -it myapp:1.0 sh                    # Interactive shell

# Manage
docker ps                      # Running containers
docker ps -a                   # All containers (including stopped)
docker logs myapp              # View logs
docker logs -f myapp           # Follow logs
docker exec -it myapp sh       # Shell into running container
docker stop myapp              # Graceful stop
docker rm myapp                # Remove container
docker inspect myapp           # Container details

# Images
docker images                  # List images
docker rmi myapp:1.0           # Remove image
docker pull node:20-alpine     # Pull image
docker push myrepo/myapp:1.0   # Push to registry

# Cleanup
docker system prune            # Remove unused data
docker volume prune            # Remove unused volumes
docker image prune -a          # Remove unused images
```

---

## 4. Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    networks:
      - backend

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - backend

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,EXTERNAL://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,EXTERNAL:PLAINTEXT
    depends_on:
      - zookeeper
    networks:
      - backend

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    networks:
      - backend

volumes:
  postgres_data:
  redis_data:

networks:
  backend:
    driver: bridge
```

```bash
# Docker Compose commands
docker compose up -d            # Start all services
docker compose down             # Stop and remove
docker compose logs -f app      # Follow app logs
docker compose ps               # List services
docker compose exec app sh      # Shell into service
docker compose build             # Rebuild images
docker compose up -d --build    # Rebuild and restart
```

---

## 5. Best Practices

```dockerfile
# 1. Use specific image tags (NOT :latest)
FROM node:20.11-alpine    # ✅ Specific
FROM node:latest          # ❌ Unpredictable

# 2. Multi-stage builds (smaller images)
# Build stage has dev deps, production stage only has what's needed

# 3. .dockerignore
# node_modules, .git, .env, dist, *.log

# 4. Layer caching — order matters!
COPY package*.json ./     # Changes rarely → cached
RUN npm ci                # Only reruns if package.json changed
COPY . .                  # Changes often → put last

# 5. Non-root user
RUN adduser -S appuser
USER appuser

# 6. One process per container
# Don't run app + db in same container

# 7. Use health checks
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1

# 8. Environment variables for config
# Never hardcode secrets in Dockerfile
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Container | Isolated process with its own filesystem, network |
| Image | Read-only template. Built from Dockerfile. |
| Dockerfile | Instructions to build image. Layer-based caching. |
| docker-compose | Multi-container orchestration. YAML config. |
| Volume | Persistent storage. Survives container restart. |
| Network | Containers communicate via service names |
| Multi-stage | Separate build & runtime stages for smaller images |
| CMD vs ENTRYPOINT | CMD = overridable, ENTRYPOINT = fixed |
| -d | Detached mode (background) |
| -p | Port mapping (host:container) |
| -v | Volume mount (host:container) |
| -e | Environment variable |
