# WebSockets & Socket.IO — Complete Interview Guide

---

## 1. Core Concepts

### Q: What are WebSockets?
Full-duplex, bidirectional communication protocol over a single TCP connection. Unlike HTTP (request-response), WebSocket allows both client and server to send messages at any time.

### Q: HTTP vs WebSocket
| HTTP | WebSocket |
|------|-----------|
| Request-response | Full-duplex (both ways) |
| New connection per request | Persistent connection |
| Stateless | Stateful |
| Higher overhead | Low overhead after handshake |
| Polling for updates | Push-based real-time |

### Q: WebSocket Handshake
```
1. Client sends HTTP Upgrade request:
   GET /chat HTTP/1.1
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
   Sec-WebSocket-Version: 13

2. Server responds with 101 Switching Protocols:
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

3. Connection established — bidirectional communication begins
```

---

## 2. Socket.IO

### Q: What is Socket.IO?
Library built on top of WebSockets with additional features:
- **Automatic reconnection**
- **Rooms and namespaces**
- **Broadcasting**
- **Fallback to HTTP long-polling**
- **Event-based communication**
- **Acknowledgments**

### Server (NestJS)
```typescript
@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/tracking",
  transports: ["websocket", "polling"],
})
export class TrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedDrivers = new Map<string, string>(); // socketId → driverId

  afterInit(server: Server) {
    console.log("Gateway initialized");
  }

  handleConnection(client: Socket) {
    console.log(`Connected: ${client.id}`);
    
    // Authenticate on connection
    const token = client.handshake.auth.token;
    try {
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.role = payload.role;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const driverId = this.connectedDrivers.get(client.id);
    if (driverId) {
      this.connectedDrivers.delete(client.id);
      // Remove from H3 cell in Redis
    }
    console.log(`Disconnected: ${client.id}`);
  }

  // Listen for events
  @SubscribeMessage("driver:location")
  handleDriverLocation(
    @MessageBody() data: { lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    const driverId = client.data.userId;
    
    // Update H3 cell in Redis
    // Apply Kalman filter
    // Broadcast to riders tracking this driver
    
    this.server
      .to(`ride:${data.rideId}`)
      .emit("driver:position", {
        driverId,
        lat: data.lat,
        lng: data.lng,
        timestamp: Date.now(),
      });

    // Acknowledgment
    return { status: "ok" };
  }

  // Rooms
  @SubscribeMessage("join:ride")
  handleJoinRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`ride:${data.rideId}`);
    return { joined: data.rideId };
  }

  @SubscribeMessage("leave:ride")
  handleLeaveRide(
    @MessageBody() data: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`ride:${data.rideId}`);
  }

  // Broadcast to all
  broadcastSurge(data: SurgeData) {
    this.server.emit("surge:update", data);
  }

  // Send to specific socket
  sendToUser(socketId: string, event: string, data: any) {
    this.server.to(socketId).emit(event, data);
  }

  // Send to room
  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
```

### Client (Browser/React)
```typescript
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:3000/tracking", {
  auth: { token: "jwt-token-here" },
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
});

// Connection events
socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
  // reason: "io server disconnect", "io client disconnect", "ping timeout", etc.
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});

// Join a room
socket.emit("join:ride", { rideId: "ride-123" });

// Send driver location
socket.emit("driver:location", 
  { lat: 11.0168, lng: 76.9558, rideId: "ride-123" },
  (ack) => { console.log("Server acknowledged:", ack); } // Acknowledgment callback
);

// Listen for events
socket.on("driver:position", (data) => {
  console.log("Driver position:", data);
  // Update map marker
});

socket.on("surge:update", (data) => {
  console.log("Surge update:", data);
});

// Cleanup
socket.disconnect();
```

---

## 3. Scaling Socket.IO with Redis Adapter

```typescript
// Problem: Socket.IO is in-memory. Multiple server instances can't share state.
// Solution: Redis Pub/Sub adapter

import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));

// Now:
// Server 1 emits to room "ride:123"
// Redis Pub/Sub broadcasts to ALL servers
// Server 2 delivers to its connected clients in "ride:123"
```

---

## 4. Rooms & Namespaces

```typescript
// Namespace — separate communication channels on same connection
// /tracking — driver GPS updates
// /notifications — push notifications
// /chat — messaging

const trackingNs = io.of("/tracking");
const chatNs = io.of("/chat");

trackingNs.on("connection", (socket) => { /* tracking logic */ });
chatNs.on("connection", (socket) => { /* chat logic */ });

// Rooms — subdivisions within a namespace
// Rooms are server-side concept. Client joins/leaves via events.

// Emit to room (excluding sender)
socket.to("ride:123").emit("event", data);

// Emit to room (including sender)
io.to("ride:123").emit("event", data);

// Emit to multiple rooms
io.to("room1").to("room2").emit("event", data);

// Get all sockets in a room
const sockets = await io.in("ride:123").fetchSockets();
```

---

## 5. Polling vs SSE vs WebSocket

| Feature | Polling | Long Polling | SSE | WebSocket |
|---------|---------|-------------|-----|-----------|
| Direction | Client → Server | Client → Server | Server → Client | Bidirectional |
| Connection | New each time | Held until data | Persistent | Persistent |
| Overhead | High | Medium | Low | Very low |
| Real-time | No (interval-based) | Near real-time | Real-time | Real-time |
| Binary data | ❌ | ❌ | ❌ | ✅ |
| Use case | Simple dashboards | Notifications | Live feeds | Chat, gaming, tracking |

---

## 6. Your TaxiBy Real-time Architecture

```
Driver App (React Native)
  ↓ GPS every 3s
  ↓ WebSocket
NestJS Tracking Service
  ↓ Kalman Filter (noise reduction)
  ↓ H3 hexagonal index update (Redis Sets)
  ↓ RDP polyline simplification
  ↓ Socket.IO + Redis Pub/Sub Adapter
  ↓ Broadcast to room "ride:{id}"
  ↓
Rider App / Dashboard (React/Next.js)
  ↓ Receives smooth driver position
  ↓ Updates map marker
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| WebSocket | Full-duplex, persistent, bidirectional. ws:// or wss:// |
| Socket.IO | WebSocket + reconnection + rooms + namespaces + fallback |
| Rooms | Group sockets. server.to("room").emit(). Server-side. |
| Namespace | Separate communication channels. io.of("/chat"). |
| Redis Adapter | Scale Socket.IO across multiple server instances. |
| Acknowledgment | Callback to confirm message received. |
| Reconnection | Socket.IO handles automatically. Configurable. |
| Auth | socket.handshake.auth.token on connection. |
| Broadcast | socket.to(room).emit() excludes sender. io.to(room).emit() includes all. |
