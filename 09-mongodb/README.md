# MongoDB — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is MongoDB?
Document-oriented NoSQL database. Stores data as BSON (Binary JSON) documents in collections.

### Q: SQL vs MongoDB Terminology
| SQL | MongoDB |
|-----|---------|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |
| JOIN | $lookup (aggregation) / embedding |
| PRIMARY KEY | _id (auto-generated ObjectId) |

---

## 2. CRUD Operations

```javascript
// CREATE
db.users.insertOne({ name: "Divesh", age: 22, skills: ["Go", "TS"] });
db.users.insertMany([{ name: "A" }, { name: "B" }]);

// READ
db.users.find({ age: { $gt: 18 } });                    // Greater than
db.users.find({ skills: { $in: ["Go", "TS"] } });       // In array
db.users.find({ name: /^Div/i });                        // Regex
db.users.findOne({ email: "d@e.com" });                  // Single document
db.users.find({}).sort({ age: -1 }).skip(10).limit(10);  // Pagination
db.users.find({}, { name: 1, email: 1, _id: 0 });       // Projection

// Query operators
// $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin
// $and, $or, $not, $nor
// $exists, $type, $regex
// $all (array contains all), $elemMatch, $size

// UPDATE
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { name: "Updated" }, $inc: { loginCount: 1 } }
);
db.users.updateMany(
  { status: "inactive" },
  { $set: { archived: true } }
);
// $set, $unset, $inc, $push, $pull, $addToSet, $rename

// DELETE
db.users.deleteOne({ _id: ObjectId("...") });
db.users.deleteMany({ status: "deleted" });
```

---

## 3. Aggregation Pipeline

```javascript
db.orders.aggregate([
  // Stage 1: Filter
  { $match: { status: "completed", createdAt: { $gte: ISODate("2025-01-01") } } },
  
  // Stage 2: Join with users
  { $lookup: {
    from: "users",
    localField: "userId",
    foreignField: "_id",
    as: "user"
  }},
  { $unwind: "$user" },
  
  // Stage 3: Group by user
  { $group: {
    _id: "$user._id",
    userName: { $first: "$user.name" },
    totalSpent: { $sum: "$total" },
    orderCount: { $sum: 1 },
    avgOrderValue: { $avg: "$total" }
  }},
  
  // Stage 4: Sort
  { $sort: { totalSpent: -1 } },
  
  // Stage 5: Limit
  { $limit: 10 },
  
  // Stage 6: Project (reshape output)
  { $project: {
    _id: 0,
    name: "$userName",
    totalSpent: { $round: ["$totalSpent", 2] },
    orders: "$orderCount"
  }}
]);
```

---

## 4. Indexing

```javascript
// Single field
db.users.createIndex({ email: 1 });        // Ascending
db.users.createIndex({ createdAt: -1 });    // Descending

// Compound index
db.users.createIndex({ status: 1, createdAt: -1 });

// Unique index
db.users.createIndex({ email: 1 }, { unique: true });

// Text index (full-text search)
db.posts.createIndex({ title: "text", content: "text" });
db.posts.find({ $text: { $search: "mongodb tutorial" } });

// TTL index (auto-delete after time)
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// Partial index (index only matching documents)
db.users.createIndex(
  { email: 1 },
  { partialFilterExpression: { isActive: true } }
);

// Check query uses index
db.users.find({ email: "d@e.com" }).explain("executionStats");
// Look for "IXSCAN" (index scan) vs "COLLSCAN" (full collection scan)
```

---

## 5. Schema Design

### Q: Embedding vs Referencing

```javascript
// EMBEDDING — data stored together (denormalized)
// Use when: data is accessed together, 1:1 or 1:few relationship
{
  _id: ObjectId("..."),
  name: "Divesh",
  address: {                    // Embedded document
    street: "123 Main St",
    city: "Coimbatore"
  },
  phones: ["123", "456"]       // Embedded array
}

// REFERENCING — separate collections (normalized)
// Use when: 1:many or many:many, data is large, accessed independently
// users collection
{ _id: ObjectId("user1"), name: "Divesh" }

// orders collection
{ _id: ObjectId("order1"), userId: ObjectId("user1"), total: 500 }
```

| | Embedding | Referencing |
|--|-----------|-------------|
| Read | Fast (one query) | Needs $lookup/multiple queries |
| Write | Atomic updates | Need transactions for consistency |
| Size limit | 16MB per document | No limit |
| Duplication | Possible | Minimal |

---

## 6. Transactions (MongoDB 4.0+)

```javascript
const session = client.startSession();
try {
  session.startTransaction();
  
  await db.collection("wallets").updateOne(
    { userId: senderId },
    { $inc: { balance: -100 } },
    { session }
  );
  
  await db.collection("wallets").updateOne(
    { userId: receiverId },
    { $inc: { balance: 100 } },
    { session }
  );
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 7. Mongoose (Node.js ODM)

```typescript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  age: { type: Number, min: 0, max: 150 },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now },
});

// Virtuals
userSchema.virtual("isAdult").get(function() {
  return this.age >= 18;
});

// Methods
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Middleware (hooks)
userSchema.pre("save", async function(next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

const User = mongoose.model("User", userSchema);
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Document | BSON (JSON-like) with flexible schema |
| _id | Auto-generated ObjectId (12 bytes) |
| Embedding | Store related data together. Fast reads. 16MB limit. |
| Referencing | Separate collections. Use $lookup to join. |
| Aggregation | Pipeline stages: $match → $group → $sort → $project |
| Indexing | B-tree default. GIN for text. TTL for auto-delete. |
| Explain | IXSCAN = good, COLLSCAN = bad |
| Transactions | Available since 4.0. session.startTransaction() |
| When MongoDB | Flexible schema, rapid development, hierarchical data |
| When NOT | Heavy JOINs, strict ACID, complex transactions → use PostgreSQL |
