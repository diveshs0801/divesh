# RabbitMQ — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is RabbitMQ?
Message broker implementing AMQP (Advanced Message Queuing Protocol). Routes messages from producers to consumers through exchanges and queues.

### Architecture
```
Producer → Exchange → Binding → Queue → Consumer

Exchange: Routes messages to queues based on rules
Binding: Link between exchange and queue with a routing key
Queue: Buffer that stores messages until consumed
```

### Exchange Types

```
1. Direct Exchange — route by exact routing key match
   Producer → Exchange (routing_key="order.created") → Queue bound with "order.created"

2. Fanout Exchange — broadcast to ALL bound queues (no routing key)
   Producer → Exchange → Queue1, Queue2, Queue3 (all get the message)

3. Topic Exchange — route by pattern matching
   Routing key: "order.created.us"
   Binding: "order.created.*"  → matches!
   Binding: "order.#"          → matches! (# = zero or more words)
   Binding: "payment.*"        → doesn't match

4. Headers Exchange — route by message headers (rarely used)
```

---

## 2. Patterns

### Work Queue (Task Distribution)
```
Producer → Queue → Consumer1
                 → Consumer2
                 → Consumer3

Messages distributed round-robin among consumers.
Each message processed by ONE consumer.
Use case: background job processing, email sending
```

### Pub/Sub (Fanout)
```
Producer → Fanout Exchange → Queue1 (email service)
                           → Queue2 (SMS service)
                           → Queue3 (push notification)

Each service gets its OWN copy of every message.
```

### Dead Letter Queue
```
If a message fails processing (rejected, expired, queue full),
route it to a Dead Letter Exchange → Dead Letter Queue.

Main Queue → (failed) → DLX → DLQ → Manual inspection/retry
```

---

## 3. NestJS + RabbitMQ

```typescript
// Producer
@Module({
  imports: [
    ClientsModule.register([{
      name: "NOTIFICATION_SERVICE",
      transport: Transport.RMQ,
      options: {
        urls: ["amqp://localhost:5672"],
        queue: "notifications",
        queueOptions: { durable: true },
      },
    }]),
  ],
})
export class OrderModule {}

@Injectable()
export class OrderService {
  constructor(@Inject("NOTIFICATION_SERVICE") private client: ClientProxy) {}

  async createOrder(dto: CreateOrderDto) {
    const order = await this.orderRepo.save(dto);
    this.client.emit("order_created", order); // Fire and forget
    return order;
  }
}

// Consumer (separate microservice)
const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ["amqp://localhost:5672"],
    queue: "notifications",
    queueOptions: { durable: true },
    noAck: false, // Manual acknowledgment
  },
});

@Controller()
export class NotificationController {
  @EventPattern("order_created")
  async handleOrderCreated(@Payload() data: Order, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    
    try {
      await this.sendEmail(data);
      channel.ack(originalMsg); // Acknowledge — message removed from queue
    } catch (error) {
      channel.nack(originalMsg, false, true); // Requeue on failure
    }
  }
}
```

---

## 4. Message Acknowledgment

```
Auto-ack: Message removed from queue immediately when delivered.
  Risk: If consumer crashes before processing, message is lost.

Manual-ack: Consumer explicitly acknowledges after processing.
  ack() — processed successfully, remove from queue
  nack() — processing failed
    - requeue: true → put back in queue (retry)
    - requeue: false → discard or send to DLQ

prefetch: Limit how many unacknowledged messages a consumer can have.
  prefetch=1 → process one at a time (fair dispatch)
  prefetch=10 → up to 10 in-flight messages
```

---

## 5. Kafka vs RabbitMQ

| Feature | Kafka | RabbitMQ |
|---------|-------|----------|
| Model | Log (append-only) | Queue (messages consumed & deleted) |
| Delivery | Pull-based | Push-based |
| Throughput | Very high (millions/sec) | Moderate (tens of thousands) |
| Message retention | Configurable (days/weeks) | Until consumed |
| Replay | ✅ (re-read from any offset) | ❌ (gone after ack) |
| Ordering | Per partition | Per queue |
| Routing | Basic (key → partition) | Flexible (exchanges, patterns) |
| Use case | Event streaming, big data, logs | Task queues, RPC, complex routing |
| Protocol | Custom binary | AMQP |

**Your stack:** Kafka for event-driven architecture (ERP, 15+ topics), RabbitMQ/BullMQ for task queues.

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Exchange | Routes messages. Direct, Fanout, Topic, Headers. |
| Queue | Stores messages. Durable = survives restart. |
| Binding | Links exchange to queue with routing key. |
| ack/nack | Manual acknowledgment for reliability. |
| prefetch | Limit in-flight messages per consumer. |
| DLQ | Dead Letter Queue for failed messages. |
| Fanout | Broadcast to all bound queues. |
| Topic | Pattern matching (*, #) for flexible routing. |
| Durable | Queue/message survives broker restart. |
