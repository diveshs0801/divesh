# TypeScript — Complete Interview Guide

---

## 1. Basics

### Q: What is TypeScript? Why use it?

TypeScript is a statically-typed superset of JavaScript that compiles to plain JS. Benefits:
- **Catch errors at compile time** (not runtime)
- **Better IDE support** (autocompletion, refactoring)
- **Self-documenting code** (types serve as documentation)
- **Safer refactoring** at scale

```typescript
// JavaScript — error at RUNTIME
function add(a, b) { return a + b; }
add("5", 3); // "53" — silent bug

// TypeScript — error at COMPILE TIME
function add(a: number, b: number): number { return a + b; }
add("5", 3); // ❌ Argument of type 'string' is not assignable to parameter of type 'number'
```

---

### Q: Basic Types

```typescript
// Primitives
let name: string = "Divesh";
let age: number = 22;
let isActive: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
let id: symbol = Symbol("id");
let big: bigint = 100n;

// Arrays
let nums: number[] = [1, 2, 3];
let strs: Array<string> = ["a", "b"]; // Generic syntax

// Tuple — fixed-length array with specific types per position
let pair: [string, number] = ["Divesh", 22];
pair[0].toUpperCase(); // ✅ TypeScript knows index 0 is string

// Enum
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}
let dir: Direction = Direction.Up;

// Numeric enum (auto-increments)
enum Status {
  Pending,    // 0
  Active,     // 1
  Inactive,   // 2
}

// const enum — inlined at compile time (no runtime object)
const enum Color {
  Red,
  Green,
  Blue,
}
let c = Color.Red; // Compiles to: let c = 0;

// any — opts out of type checking (AVOID)
let anything: any = 42;
anything = "now a string"; // No error

// unknown — type-safe alternative to any
let value: unknown = 42;
// value.toFixed(); // ❌ Error — must narrow first
if (typeof value === "number") {
  value.toFixed(); // ✅ Narrowed to number
}

// void — function returns nothing
function log(msg: string): void {
  console.log(msg);
}

// never — function never returns (throws or infinite loop)
function throwError(msg: string): never {
  throw new Error(msg);
}

function infiniteLoop(): never {
  while (true) {}
}
```

---

### Q: any vs unknown vs never

| Type | Meaning | Can assign TO anything? | Can use without narrowing? |
|------|---------|------------------------|---------------------------|
| `any` | Opt out of type system | ✅ | ✅ (unsafe) |
| `unknown` | Could be anything, must check | ❌ | ❌ (must narrow) |
| `never` | Impossible value | ❌ | N/A |

```typescript
// unknown forces you to narrow
function process(val: unknown) {
  if (typeof val === "string") {
    console.log(val.toUpperCase()); // ✅ narrowed
  }
  if (val instanceof Date) {
    console.log(val.toISOString()); // ✅ narrowed
  }
}

// never — exhaustive checks
type Shape = "circle" | "square";
function area(shape: Shape) {
  switch (shape) {
    case "circle": return Math.PI;
    case "square": return 1;
    default:
      const _exhaustive: never = shape; // ❌ Error if a case is missing
      return _exhaustive;
  }
}
```

---

## 2. Interfaces & Types

### Q: interface vs type

```typescript
// Interface — for object shapes, extendable
interface User {
  id: number;
  name: string;
  email?: string;          // Optional
  readonly createdAt: Date; // Cannot modify after creation
}

// Extend interface
interface Admin extends User {
  role: "admin" | "superadmin";
  permissions: string[];
}

// Interface merging (Declaration Merging)
interface Config {
  apiUrl: string;
}
interface Config {
  timeout: number;
}
// Config is now { apiUrl: string; timeout: number; } — merged!

// Type Alias — for unions, intersections, primitives, tuples
type ID = string | number;
type Status = "active" | "inactive" | "suspended";
type Pair = [string, number];
type Callback = (data: string) => void;

// Intersection type (like extends but for types)
type AdminUser = User & { role: string };

// Type CANNOT be merged (re-declared)
// type Config = { a: string };
// type Config = { b: string }; // ❌ Duplicate identifier
```

**When to use which:**
- **interface**: Object shapes, class contracts, when you need declaration merging
- **type**: Unions, intersections, primitives, tuples, mapped types, complex compositions

---

### Q: Index Signatures & Record

```typescript
// Index signature — object with dynamic keys
interface StringMap {
  [key: string]: number;
}
const scores: StringMap = { math: 95, science: 88 };

// Record utility — cleaner syntax
const scores2: Record<string, number> = { math: 95, science: 88 };

// Mapped type with specific keys
type Roles = "admin" | "user" | "guest";
const permissions: Record<Roles, string[]> = {
  admin: ["read", "write", "delete"],
  user: ["read", "write"],
  guest: ["read"],
};
```

---

## 3. Generics

### Q: What are Generics? Why use them?

Generics let you write reusable code that works with multiple types while maintaining type safety.

```typescript
// Without generics — lose type info
function identity(val: any): any { return val; }
const result = identity("hello"); // result is 'any' — lost type info

// With generics — preserve type info
function identity<T>(val: T): T { return val; }
const result = identity("hello"); // result is 'string' ✅
const num = identity(42);         // num is 'number' ✅

// Multiple type parameters
function pair<K, V>(key: K, value: V): [K, V] {
  return [key, value];
}
pair("name", "Divesh"); // [string, string]
pair(1, true);          // [number, boolean]

// Generic with constraint
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(item: T): void {
  console.log(item.length);
}
logLength("hello");    // ✅ string has .length
logLength([1, 2, 3]);  // ✅ array has .length
logLength(42);         // ❌ number doesn't have .length

// Generic interface
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

const userResponse: ApiResponse<User> = {
  data: { id: 1, name: "Divesh", createdAt: new Date() },
  status: 200,
  message: "OK",
};

// Generic class
class DataStore<T> {
  private items: T[] = [];
  
  add(item: T): void { this.items.push(item); }
  get(index: number): T { return this.items[index]; }
  getAll(): T[] { return [...this.items]; }
}

const userStore = new DataStore<User>();
userStore.add({ id: 1, name: "Divesh", createdAt: new Date() });

// Default generic type
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}
createArray(3, "hi"); // string[] (inferred)
createArray(3, 42);   // number[] (inferred)
```

---

### Q: keyof, typeof, and Indexed Access Types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// keyof — union of all keys
type UserKeys = keyof User; // "id" | "name" | "email"

// Indexed access type — get type of a specific property
type UserName = User["name"]; // string
type UserIdOrName = User["id" | "name"]; // number | string

// typeof — get type from a value
const config = { port: 3000, host: "localhost" };
type Config = typeof config; // { port: number; host: string }

// Generic function with keyof constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = { id: 1, name: "Divesh", email: "d@e.com" };
getProperty(user, "name");  // ✅ returns string
getProperty(user, "id");    // ✅ returns number
getProperty(user, "foo");   // ❌ Error: "foo" is not in keyof User
```

---

## 4. Utility Types

### Q: Explain all built-in utility types

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Partial<T> — all properties optional
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number }
// Use case: Update DTOs where you send only changed fields

// Required<T> — all properties required
type RequiredUser = Required<PartialUser>;

// Readonly<T> — all properties readonly
type ReadonlyUser = Readonly<User>;
// const u: ReadonlyUser = { ... }; u.name = "x"; // ❌ Error

// Pick<T, K> — select specific properties
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }

// Omit<T, K> — exclude specific properties
type UserWithoutEmail = Omit<User, "email">;
// { id: number; name: string; age: number }

// Record<K, V> — construct type with set of properties
type PageInfo = Record<"home" | "about" | "contact", { title: string }>;

// Exclude<T, U> — remove types from union
type T = Exclude<"a" | "b" | "c", "a">; // "b" | "c"

// Extract<T, U> — keep only types in union
type T2 = Extract<"a" | "b" | "c", "a" | "d">; // "a"

// NonNullable<T> — remove null and undefined
type T3 = NonNullable<string | null | undefined>; // string

// ReturnType<T> — get return type of function
function getUser() { return { id: 1, name: "Divesh" }; }
type UserReturn = ReturnType<typeof getUser>; // { id: number; name: string }

// Parameters<T> — get parameter types as tuple
type Params = Parameters<typeof getUser>; // []

// ConstructorParameters<T>
class MyClass {
  constructor(public name: string, public age: number) {}
}
type CtorParams = ConstructorParameters<typeof MyClass>; // [string, number]

// InstanceType<T>
type MyInstance = InstanceType<typeof MyClass>; // MyClass

// Awaited<T> — unwrap Promise type
type A = Awaited<Promise<string>>; // string
type B = Awaited<Promise<Promise<number>>>; // number
```

---

## 5. Advanced Types

### Q: Union & Intersection Types

```typescript
// Union — OR (can be one of these types)
type ID = string | number;
function printId(id: ID) {
  if (typeof id === "string") {
    console.log(id.toUpperCase()); // narrowed to string
  } else {
    console.log(id.toFixed(2));    // narrowed to number
  }
}

// Intersection — AND (must have all properties)
type HasName = { name: string };
type HasAge = { age: number };
type Person = HasName & HasAge; // { name: string; age: number }
```

### Q: Discriminated Unions (Tagged Unions)

```typescript
// Each type in the union has a common literal property (discriminant)
interface Circle {
  kind: "circle";
  radius: number;
}
interface Square {
  kind: "square";
  side: number;
}
interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Square | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    case "triangle":
      return 0.5 * shape.base * shape.height;
    default:
      const _exhaustive: never = shape; // Compile error if case missing
      return _exhaustive;
  }
}
```

### Q: Type Guards & Narrowing

```typescript
// typeof guard
function process(val: string | number) {
  if (typeof val === "string") { /* string */ }
  else { /* number */ }
}

// instanceof guard
function handleError(err: Error | string) {
  if (err instanceof Error) { console.log(err.message); }
  else { console.log(err); }
}

// in operator guard
interface Dog { bark(): void; }
interface Cat { meow(): void; }
function speak(animal: Dog | Cat) {
  if ("bark" in animal) { animal.bark(); }
  else { animal.meow(); }
}

// Custom type guard (type predicate)
interface Fish { swim(): void; }
interface Bird { fly(): void; }

function isFish(animal: Fish | Bird): animal is Fish {
  return (animal as Fish).swim !== undefined;
}

function move(animal: Fish | Bird) {
  if (isFish(animal)) {
    animal.swim(); // ✅ narrowed to Fish
  } else {
    animal.fly();  // ✅ narrowed to Bird
  }
}

// Assertion function
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== "string") {
    throw new Error("Not a string!");
  }
}

function process(val: unknown) {
  assertIsString(val);
  console.log(val.toUpperCase()); // ✅ narrowed to string after assertion
}
```

---

### Q: Conditional Types

```typescript
// T extends U ? X : Y
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"

// infer — extract types within conditional
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
type Fn = (x: number) => string;
type R = ReturnOf<Fn>; // string

// Unwrap promise
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type A2 = Unwrap<Promise<string>>; // string
type B2 = Unwrap<number>;          // number

// Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]
// NOT (string | number)[] — distributed!

// Prevent distribution with [T]
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNonDist<string | number>; // (string | number)[]
```

---

### Q: Mapped Types

```typescript
// Create new types by transforming properties of existing types
type Readonly2<T> = {
  readonly [K in keyof T]: T[K];
};

type Optional<T> = {
  [K in keyof T]?: T[K];
};

type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

// With key remapping (as clause)
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person { name: string; age: number; }
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number; }

// Remove specific properties
type RemoveKind<T> = {
  [K in keyof T as Exclude<K, "kind">]: T[K];
};
```

---

### Q: Template Literal Types

```typescript
type EventName = "click" | "scroll" | "mousemove";
type Handler = `on${Capitalize<EventName>}`;
// "onClick" | "onScroll" | "onMousemove"

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = `/api/${"users" | "posts"}`;
// "/api/users" | "/api/posts"

// Built-in string manipulation types
type Upper = Uppercase<"hello">;     // "HELLO"
type Lower = Lowercase<"HELLO">;     // "hello"
type Cap = Capitalize<"hello">;      // "Hello"
type Uncap = Uncapitalize<"Hello">;  // "hello"
```

---

## 6. Classes in TypeScript

```typescript
class User {
  // Access modifiers
  public name: string;          // accessible everywhere (default)
  private _password: string;    // accessible only inside this class
  protected role: string;       // accessible in this class and subclasses
  readonly id: number;          // cannot be modified after construction
  
  // Parameter properties — shorthand
  constructor(
    public email: string,
    private secret: string,
    name: string,
    password: string,
    id: number,
  ) {
    this.name = name;
    this._password = password;
    this.id = id;
    this.role = "user";
  }
  
  // Getter/Setter
  get password(): string {
    return "***hidden***";
  }
  
  set password(value: string) {
    if (value.length < 8) throw new Error("Too short");
    this._password = value;
  }
  
  // Static
  static createGuest(): User {
    return new User("guest@app.com", "", "Guest", "password", 0);
  }
  
  // Abstract — must be in abstract class, must be implemented by subclass
}

abstract class Shape {
  abstract area(): number; // No implementation
  
  describe(): string {
    return `Shape with area ${this.area()}`; // Can use abstract methods
  }
}

class Circle extends Shape {
  constructor(public radius: number) { super(); }
  area(): number { return Math.PI * this.radius ** 2; } // Must implement
}

// Implementing interfaces
interface Serializable {
  serialize(): string;
}

class Product implements Serializable {
  constructor(public name: string, public price: number) {}
  serialize(): string {
    return JSON.stringify({ name: this.name, price: this.price });
  }
}
```

---

## 7. Decorators (Stage 3 / Experimental)

```typescript
// Method decorator (TC39 Stage 3 — available in TS 5+)
function log(target: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);
  return function(this: any, ...args: any[]) {
    console.log(`Calling ${methodName} with`, args);
    const result = target.apply(this, args);
    console.log(`${methodName} returned`, result);
    return result;
  };
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}

// NestJS uses experimental decorators extensively:
// @Controller(), @Get(), @Post(), @Injectable(), @Module()
// These use the older "experimentalDecorators" compiler option
```

---

## 8. Module System & Declaration Files

```typescript
// .d.ts files — type declarations for JS libraries
// Example: types for a library that doesn't have TS support
declare module "untyped-lib" {
  export function doSomething(x: string): number;
  export interface Config {
    port: number;
    host: string;
  }
}

// Global type augmentation
declare global {
  interface Window {
    myCustomProp: string;
  }
}

// Triple-slash directives (reference types)
/// <reference types="node" />
```

---

## 9. TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",           // JS version output
    "module": "NodeNext",         // Module system
    "moduleResolution": "NodeNext",
    "strict": true,               // Enable ALL strict checks
    "esModuleInterop": true,      // CommonJS/ESM interop
    "skipLibCheck": true,         // Skip .d.ts checking (faster)
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,          // Generate .d.ts files
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true, // For NestJS
    "emitDecoratorMetadata": true,  // For NestJS
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Important strict flags:**
- `strictNullChecks` — null/undefined are separate types
- `noImplicitAny` — error on implicit any
- `strictFunctionTypes` — stricter function type checking
- `strictPropertyInitialization` — class properties must be initialized

---

## 10. Real-world Patterns

### API Response Typing
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUsers(): Promise<ApiResponse<User[]>> {
  const res = await fetch("/api/users");
  return res.json();
}

const { data: users, pagination } = await fetchUsers();
users[0].name; // ✅ TypeScript knows this is string
```

### Type-safe Event Emitter
```typescript
type EventMap = {
  "user:login": { userId: string; timestamp: number };
  "user:logout": { userId: string };
  "order:created": { orderId: string; amount: number };
};

class TypedEmitter<T extends Record<string, any>> {
  private listeners = new Map<keyof T, Set<Function>>();
  
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }
  
  emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
}

const emitter = new TypedEmitter<EventMap>();
emitter.on("user:login", (data) => {
  console.log(data.userId);    // ✅ TypeScript knows the shape
  console.log(data.timestamp); // ✅
});
emitter.emit("user:login", { userId: "1", timestamp: Date.now() }); // ✅
emitter.emit("user:login", { userId: "1" }); // ❌ missing timestamp
```

### Builder Pattern
```typescript
class QueryBuilder<T> {
  private conditions: string[] = [];
  private _limit?: number;
  
  where(condition: keyof T, value: T[keyof T]): this {
    this.conditions.push(`${String(condition)} = ${value}`);
    return this;
  }
  
  limit(n: number): this {
    this._limit = n;
    return this;
  }
  
  build(): string {
    let query = `SELECT * FROM table`;
    if (this.conditions.length) query += ` WHERE ${this.conditions.join(" AND ")}`;
    if (this._limit) query += ` LIMIT ${this._limit}`;
    return query;
  }
}
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| any vs unknown | any = no checking; unknown = must narrow first |
| interface vs type | interface = objects, merging; type = unions, mapped |
| Generics | Reusable + type-safe: `<T>` |
| keyof | Union of property names |
| Utility Types | Partial, Required, Pick, Omit, Record, Readonly |
| Discriminated Union | Common literal field for type narrowing |
| Type Guard | `typeof`, `instanceof`, `in`, custom `is` predicate |
| Conditional Type | `T extends U ? X : Y` |
| Mapped Type | `{ [K in keyof T]: ... }` |
| Template Literal | `` `on${Capitalize<Event>}` `` |
| never | Impossible value, exhaustive checks |
| Decorators | Metadata + behavior modification (NestJS uses heavily) |
