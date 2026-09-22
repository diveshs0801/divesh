# Apache Kafka — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is Kafka?
Distributed event streaming platform. Used for building real-time data pipelines and event-driven architectures.

### Q: Core Architecture

```
Producer → Topic (partitioned) → Consumer Group

Producer: Publishes messages to topics
Topic: Category/feed name. Divided into partitions.
Partition: Ordered, immutable sequence of messages. Each message has an offset.
Broker: Kafka server. Cluster has multiple brokers.
Consumer: Reads messages from topics.
Consumer Group: Set of consumers that share the work of reading a topic.
Offset: Position of a message in a partition.
```

### Q: How does partitioning work?

```
Topic: "orders" (3 partitions)

Partition 0: [msg0, msg3, msg6, msg9...]
Partition 1: [msg1, msg4, msg7, msg10...]
Partition 2: [msg2, msg5, msg8, msg11...]

- Messages with same KEY always go to same partition (ordering guaranteed within partition)
- No KEY → round-robin distribution
- Partition = unit of parallelism

Consumer Group (3 consumers):
  Consumer A → Partition 0
  Consumer B → Partition 1
  Consumer C → Partition 2

Rule: Max consumers in a group = number of partitions
(extra consumers sit idle)
```

### Q: Offset Management

```
Each consumer tracks its position (offset) in each partition.

Auto-commit: Kafka periodically commits offsets (can lose messages)
Manual commit: Consumer explicitly commits after processing

At-most-once: Commit BEFORE processing (may lose messages)
At-least-once: Commit AFTER processing (may duplicate — consumer must be idempotent)
Exactly-once: Kafka transactions + idempotent producer (complex)
```

---

## 2. Producer

```typescript
// NestJS + KafkaJS
import { Kafka, Partitioners } from "kafkajs";

const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
  idempotent: true, // Prevent duplicate messages
});

await producer.connect();

// Send message
await producer.send({
  topic: "orders",
  messages: [
    {
      key: orderId,           // Same key → same partition → ordering
      value: JSON.stringify({
        orderId,
        userId,
        total: 500,
        status: "created",
      }),
      headers: {
        "correlation-id": requestId,
        "event-type": "ORDER_CREATED",
      },
    },
  ],
});

// Batch send
await producer.sendBatch({
  topicMessages: [
    {
      topic: "orders",
      messages: orders.map(o => ({
        key: o.id,
        value: JSON.stringify(o),
      })),
    },
  ],
});

await producer.disconnect();
```

---

## 3. Consumer

```typescript
const consumer = kafka.consumer({
  groupId: "order-processing-group",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

await consumer.connect();
await consumer.subscribe({ topic: "orders", fromBeginning: false });

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value.toString());
    const eventType = message.headers["event-type"]?.toString();
    
    console.log({
      topic,
      partition,
      offset: message.offset,
      key: message.key?.toString(),
      eventType,
      event,
    });
    
    // Process based on event type
    switch (eventType) {
      case "ORDER_CREATED":
        await handleOrderCreated(event);
        break;
      case "ORDER_CANCELLED":
        await handleOrderCancelled(event);
        break;
    }
    
    // Manual commit (at-least-once)
    // await consumer.commitOffsets([{
    //   topic, partition, offset: (parseInt(message.offset) + 1).toString()
    // }]);
  },
});
```

---

## 4. NestJS Kafka Integration

```typescript
// app.module.ts
@Module({
  imports: [
    ClientsModule.register([
      {
        name: "KAFKA_SERVICE",
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: "gateway",
            brokers: ["localhost:9092"],
          },
          consumer: {
            groupId: "gateway-consumer",
          },
        },
      },
    ]),
  ],
})
export class AppModule {}

// Producer (in service)
@Injectable()
export class OrderService {
  constructor(@Inject("KAFKA_SERVICE") private kafka: ClientKafka) {}

  async onModuleInit() {
    await this.kafka.connect();
  }

  async createOrder(dto: CreateOrderDto) {
    const order = await this.orderRepo.save(dto);
    
    // Fire-and-forget event
    this.kafka.emit("order.created", {
      key: order.id.toString(),
      value: JSON.stringify(order),
    });
    
    return order;
  }
}

// Consumer (in controller)
@Controller()
export class NotificationController {
  @EventPattern("order.created")
  async handleOrderCreated(@Payload() data: OrderCreatedEvent) {
    await this.emailService.sendOrderConfirmation(data);
  }

  @EventPattern("order.cancelled")
  async handleOrderCancelled(@Payload() data: OrderCancelledEvent) {
    await this.emailService.sendCancellationNotice(data);
  }
}
```

---

## 5. Your ERP Experience — Kafka Patterns

### Transactional Outbox + Kafka Relay (Go)

```go
// 1. Write to DB + outbox in same transaction
func (s *OrderService) CreateOrder(ctx context.Context, order Order) error {
    tx, _ := s.db.BeginTx(ctx, nil)
    defer tx.Rollback()
    
    // Insert order
    _, err := tx.ExecContext(ctx, "INSERT INTO orders (...) VALUES (...)", ...)
    if err != nil { return err }
    
    // Insert outbox event (same transaction!)
    _, err = tx.ExecContext(ctx,
        "INSERT INTO outbox (event_type, aggregate_id, payload, status) VALUES ($1, $2, $3, 'PENDING')",
        "ORDER_CREATED", order.ID, toJSON(order),
    )
    if err != nil { return err }
    
    return tx.Commit()
}

// 2. Background relay worker
func (r *OutboxRelay) Run(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        case <-time.After(100 * time.Millisecond):
            r.processOutbox(ctx)
        }
    }
}

func (r *OutboxRelay) processOutbox(ctx context.Context) {
    events, _ := r.db.Query("SELECT * FROM outbox WHERE status = 'PENDING' ORDER BY created_at LIMIT 100")
    
    for _, event := range events {
        err := r.producer.Produce(ctx, event.EventType, event.Payload)
        if err != nil {
            // Exponential backoff retry
            r.incrementRetry(event.ID)
            continue
        }
        r.db.Exec("UPDATE outbox SET status = 'SENT' WHERE id = $1", event.ID)
    }
}
```

---

## 6. Key Concepts

### Q: Replication & Fault Tolerance

```
Each partition has:
- 1 Leader: handles all reads/writes
- N Followers (replicas): copy data from leader

Replication Factor = 3 → 3 copies of each partition across brokers

If leader dies → a follower is elected as new leader (automatic)

ISR (In-Sync Replicas): Replicas that are caught up with leader
acks=all → producer waits for ALL ISR to acknowledge (strongest guarantee)
acks=1 → producer waits for leader only (faster, less safe)
acks=0 → fire and forget (fastest, may lose data)
```

### Q: Topic Configuration

```
Retention: How long messages are kept
  retention.ms = 604800000 (7 days default)
  retention.bytes = -1 (unlimited)

Compaction: Keep only latest value per key
  cleanup.policy = compact (useful for changelogs/state)

Partitions: Parallelism level
  More partitions = more throughput but more overhead
```

### Q: Kafka vs RabbitMQ

| Kafka | RabbitMQ |
|-------|----------|
| Log-based (persistent) | Queue-based (messages consumed and deleted) |
| High throughput (millions/sec) | Lower throughput |
| Consumer pulls | Broker pushes to consumer |
| Messages retained | Messages deleted after consumption |
| Ordering per partition | No guaranteed ordering |
| Replay capability | No replay (unless dead letter) |
| Better for: Event streaming, big data | Better for: Task queues, RPC |

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Topic | Category of messages. Divided into partitions. |
| Partition | Ordered log. Unit of parallelism. |
| Offset | Position in partition. Consumer tracks its offset. |
| Consumer Group | Consumers share partitions. Max consumers = partitions. |
| Replication | Leader + followers. ISR for fault tolerance. |
| acks | 0=fire&forget, 1=leader, all=ISR |
| Key | Determines partition. Same key = same partition = order. |
| At-least-once | Commit after processing. Consumer must be idempotent. |
| Outbox Pattern | DB + outbox in transaction → relay to Kafka. |
| Compaction | Keep latest value per key. State store. |
| Retention | Default 7 days. Can be unlimited. |
