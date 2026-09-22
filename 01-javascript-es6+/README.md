# JavaScript (ES6+) — Complete Interview Guide

---

## 1. Core Concepts & Execution

### Q: What is the JavaScript Engine? How does V8 work?

A JavaScript engine executes JavaScript code. V8 (Chrome, Node.js) compiles JS directly to native machine code using JIT (Just-In-Time) compilation.

**V8 Pipeline:**
```
Source Code → Parser → AST → Ignition (Interpreter/Bytecode) → Turbofan (Optimizing Compiler) → Machine Code
```

- **Ignition**: Generates bytecode (fast startup)
- **Turbofan**: Optimizes "hot" functions into machine code (fast execution)
- **Deoptimization**: If assumptions break, Turbofan falls back to Ignition

---

### Q: What is the Execution Context?

An Execution Context is the environment in which JS code is evaluated. Three types:

1. **Global EC**: Created when script first runs. Creates `window`/`global` and sets `this`.
2. **Function EC**: Created each time a function is invoked.
3. **Eval EC**: Inside `eval()`.

**Two phases per EC:**

**Phase 1 — Memory Creation (Hoisting):**
- `var` → allocated + initialized to `undefined`
- `let/const` → allocated but NOT initialized (TDZ)
- Function declarations → stored entirely

**Phase 2 — Code Execution:**
- Code runs line-by-line, variables get actual values

```javascript
console.log(a);      // undefined (var hoisted)
console.log(b);      // ReferenceError: TDZ
console.log(greet);  // [Function: greet]

var a = 10;
let b = 20;
function greet() { return "Hello"; }
```

---

### Q: What is the Call Stack?

LIFO data structure tracking execution contexts. Function called → pushed. Returns → popped.

```javascript
function first() {
  console.log("first");
  second();
  console.log("first again");
}
function second() {
  console.log("second");
  third();
}
function third() {
  console.log("third");
}
first();
// Stack: [Global] → [Global, first] → [Global, first, second] → 
// [Global, first, second, third] → pops back
// Output: first, second, third, first again

// Stack Overflow:
function infinite() { infinite(); }
infinite(); // RangeError: Maximum call stack size exceeded
```

---

### Q: What is Hoisting? Every case.

Declarations moved to top of scope during memory creation phase.

```javascript
// var → hoisted as undefined
console.log(x); // undefined
var x = 5;

// let/const → TDZ
console.log(y); // ReferenceError
let y = 10;

// Function Declaration → fully hoisted
greet(); // "Hello!"
function greet() { console.log("Hello!"); }

// Function Expression → NOT hoisted as function
sayHi(); // TypeError: sayHi is not a function
var sayHi = function() { console.log("Hi!"); };

// Arrow → same as expression
sayBye(); // TypeError
var sayBye = () => console.log("Bye!");

// Class → NOT hoisted
const obj = new Animal(); // ReferenceError
class Animal {}
```

---

## 2. Variables & Scoping

### Q: var vs let vs const

| Feature | `var` | `let` | `const` |
|---------|-------|-------|---------|
| Scope | Function | Block | Block |
| Hoisting | Yes (`undefined`) | Yes (TDZ) | Yes (TDZ) |
| Re-declaration | ✅ | ❌ | ❌ |
| Re-assignment | ✅ | ✅ | ❌ |
| Global object prop | ✅ | ❌ | ❌ |

```javascript
// var is function scoped
function test() {
  if (true) { var a = 10; }
  console.log(a); // 10 ← leaked out of block
}

// let is block scoped
function test2() {
  if (true) { let b = 20; }
  console.log(b); // ReferenceError
}

// const reference is immutable, but object contents can change
const obj = { name: "Divesh" };
obj.name = "Updated"; // ✅ Works
obj = {};             // ❌ TypeError
```

---

### Q: What is the Temporal Dead Zone (TDZ)?

The period between entering scope and actual `let`/`const` declaration. Accessing throws ReferenceError.

```javascript
{
  // TDZ starts
  console.log(x); // ReferenceError
  let x = 10;     // TDZ ends
  console.log(x); // 10
}
```

---

### Q: Block Scope vs Function Scope vs Lexical Scope

```javascript
// Block Scope
{ let a = 1; const b = 2; var c = 3; }
// a, b → not accessible. c → accessible (var ignores blocks)

// Function Scope
function fn() { var x = 10; }
// x → not accessible outside fn

// Lexical Scope — function accesses parent's variables (where DEFINED, not CALLED)
function outer() {
  const outerVar = "outer";
  function inner() {
    console.log(outerVar); // "outer"
  }
  inner();
}
```

---

## 3. Data Types & Coercion

### Q: JavaScript data types

**Primitives (7):** `string`, `number`, `boolean`, `undefined`, `null`, `symbol`, `bigint`
**Reference (1):** `object` (arrays, functions, dates, etc.)

```javascript
typeof undefined     // "undefined"
typeof null          // "object"   ← JS bug since 1995
typeof NaN           // "number"
typeof []            // "object"
typeof function(){}  // "function"
typeof Symbol()      // "symbol"
typeof 10n           // "bigint"

// Proper checks:
Array.isArray([]);          // true
Number.isNaN(NaN);          // true
obj === null                // check for null
```

---

### Q: Type Coercion

```javascript
// Implicit — String (+ with string)
"5" + 3        // "53"
"5" + true     // "5true"

// Implicit — Numeric (-, *, /, %)
"5" - 3        // 2
true + true    // 2
null + 5       // 5
undefined + 5  // NaN

// Falsy values: 0, "", null, undefined, NaN, false
// Truthy surprises: [], {}, "0", "false"

// Explicit
Number("123")  // 123
Number("")     // 0
Number("abc")  // NaN
String(123)    // "123"
Boolean(0)     // false
Boolean("0")   // true ← non-empty string
```

---

### Q: == vs ===

```javascript
0 == false         // true  (coercion)
"" == false        // true
null == undefined  // true  (special rule)
null == 0          // false
NaN == NaN         // false
[] == ![]          // true  (both become 0)

0 === false        // false (no coercion)
null === undefined // false
// ALWAYS use === unless specific reason
```

---

## 4. Functions

### Q: Function types

```javascript
// Declaration — hoisted
function add(a, b) { return a + b; }

// Expression — NOT hoisted
const sub = function(a, b) { return a - b; };

// Arrow — no own this, no arguments, no new
const mul = (a, b) => a * b;

// IIFE
(function() { console.log("runs immediately"); })();
(() => { console.log("arrow IIFE"); })();
```

### Q: Arrow vs Regular Function

| Feature | Regular | Arrow |
|---------|---------|-------|
| `this` | Dynamic (caller) | Lexical (parent) |
| `arguments` | ✅ | ❌ (use ...rest) |
| `new` | ✅ | ❌ |
| `prototype` | ✅ | ❌ |

```javascript
const obj = {
  name: "Divesh",
  regular() { console.log(this.name); },      // "Divesh"
  arrow: () => { console.log(this.name); },    // undefined
  delayed() {
    setTimeout(() => console.log(this.name), 100); // "Divesh" ← arrow inherits this
    setTimeout(function() { console.log(this.name); }, 100); // undefined ← lost this
  }
};
```

### Q: Default, Rest, Spread

```javascript
function greet(name = "World") { return `Hello, ${name}!`; }

function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }
sum(1, 2, 3); // 6

const merged = { ...obj1, ...obj2 };
const combined = [...arr1, ...arr2];
```

### Q: Higher-Order Functions

Takes a function as argument OR returns a function.

```javascript
function multiplier(factor) {
  return (num) => num * factor;
}
const double = multiplier(2);
double(5); // 10

// Built-in HOFs: map, filter, reduce, forEach, find, some, every
```

---

## 5. Closures

### Q: What is a Closure?

A function that remembers variables from its outer scope even after the outer function has returned.

```javascript
function createCounter() {
  let count = 0; // private via closure
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}
const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
// count is not accessible from outside — DATA PRIVACY
```

### Q: Classic for-loop problem

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Output: 3, 3, 3 — var is shared, loop finished before timeout

// FIX 1: let (block-scoped per iteration)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Output: 0, 1, 2

// FIX 2: IIFE
for (var i = 0; i < 3; i++) {
  ((j) => setTimeout(() => console.log(j), 1000))(i);
}
```

### Q: Practical closure uses

```javascript
// Memoization
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Debounce — execute after user STOPS for delay ms
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle — execute at most once every limit ms
function throttle(fn, limit) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Module Pattern — private state
const bankAccount = (() => {
  let balance = 0;
  return {
    deposit(amt) { balance += amt; return balance; },
    withdraw(amt) {
      if (amt > balance) throw new Error("Insufficient");
      balance -= amt; return balance;
    },
    getBalance() { return balance; }
  };
})();
```

---

## 6. this Keyword

### Q: this in every context

```javascript
// Global: window (browser) / {} (Node module) / global (Node REPL)
// Regular function: depends on caller (undefined in strict mode)
// Object method: the object
// Arrow: lexical parent
// Constructor/new: the new object
// call/apply/bind: explicitly set
// Event handler: the element (regular fn) / parent scope (arrow)
```

### Q: call, apply, bind

```javascript
function greet(greeting, punct) {
  console.log(`${greeting}, ${this.name}${punct}`);
}
const person = { name: "Divesh" };

greet.call(person, "Hello", "!");     // call: args individually
greet.apply(person, ["Hi", "."]);     // apply: args as array
const bound = greet.bind(person, "Hey"); // bind: returns new function
bound("?");                           // "Hey, Divesh?"

// bind polyfill
Function.prototype.myBind = function(ctx, ...bound) {
  const fn = this;
  return function(...args) {
    return fn.apply(ctx, [...bound, ...args]);
  };
};
```

---

## 7. Prototypes & Inheritance

### Q: Prototype Chain

Every object has `[[Prototype]]`. Property lookup follows the chain.

```javascript
const animal = { eat() { return "eating"; } };
const dog = Object.create(animal);
dog.bark = () => "woof!";

dog.bark(); // "woof!" — on dog
dog.eat();  // "eating" — on animal (prototype)
// dog → animal → Object.prototype → null

dog.hasOwnProperty("bark"); // true
dog.hasOwnProperty("eat");  // false
```

### Q: ES6 Classes

```javascript
class Vehicle {
  #started = false; // private field
  constructor(make) { this.make = make; }
  start() { this.#started = true; }
  get isRunning() { return this.#started; }
  static compare(a, b) { return a.make === b.make; }
}

class Car extends Vehicle {
  constructor(make, doors) {
    super(make); // MUST call before using this
    this.doors = doors;
  }
}
// Under the hood: Car.prototype.__proto__ === Vehicle.prototype
```

---

## 8. ES6+ Features

### Q: Destructuring

```javascript
const { name, age, role = "Dev" } = user;        // object
const [a, , c, ...rest] = [1, 2, 3, 4, 5];       // array
const { data: { users: [first] } } = response;   // nested
let x = 1, y = 2; [x, y] = [y, x];               // swap
function fn({ name, age = 0 }) {}                 // params
```

### Q: Template Literals & Tagged Templates

```javascript
const name = "Divesh";
const msg = `Hello, ${name}!\nMulti-line string.`;

function highlight(strings, ...values) {
  return strings.reduce((r, s, i) => r + s + (values[i] ? `**${values[i]}**` : ""), "");
}
highlight`Name: ${name}, Age: ${22}`;
// "Name: **Divesh**, Age: **22**"
```

### Q: Optional Chaining & Nullish Coalescing

```javascript
user?.profile?.address?.city;      // undefined if any nullish
arr?.map?.(x => x * 2);           // safe method call

// ?? → only null/undefined trigger fallback
0 ?? "default"     // 0
"" ?? "default"    // ""
null ?? "default"  // "default"

// || → all falsy trigger fallback
0 || "default"     // "default"
"" || "default"    // "default"
```

### Q: Map, Set, WeakMap, WeakSet

```javascript
// Map — any type as key, ordered, .size
const map = new Map();
map.set({id: 1}, "val"); // object key!
map.get(key); map.has(key); map.delete(key);
for (const [k, v] of map) {}

// Set — unique values
const set = new Set([1, 1, 2, 2, 3]); // {1, 2, 3}
[...new Set(arr)]; // deduplicate array

// WeakMap — object keys only, weakly held (allows GC), NOT iterable
// WeakSet — object values only, weakly held
// Use case: caches, private data for objects without memory leaks
```

### Q: Symbol, Proxy, Reflect

```javascript
// Symbol — unique primitive
const id = Symbol("id");
Symbol("id") === Symbol("id"); // false — always unique

// Proxy — intercept operations
const handler = {
  get(target, prop) { return prop in target ? target[prop] : "N/A"; },
  set(target, prop, val) {
    if (prop === "age" && typeof val !== "number") throw TypeError();
    target[prop] = val; return true;
  }
};
const proxy = new Proxy({}, handler);

// Reflect — clean API for object operations
Reflect.get(obj, "name");
Reflect.set(obj, "age", 22);
Reflect.has(obj, "name");
```

---

## 9. Event Loop, Promises, Async/Await

### Q: Event Loop — how it works

JS is single-threaded. Async handled via Event Loop.

**Priority: Call Stack (sync) → Microtask Queue → Macrotask Queue**

Microtasks: Promise.then/catch/finally, queueMicrotask, MutationObserver
Macrotasks: setTimeout, setInterval, setImmediate, I/O

```javascript
console.log("1");                              // sync
setTimeout(() => console.log("2"), 0);         // macrotask
Promise.resolve().then(() => console.log("3")); // microtask
console.log("4");                              // sync

// Output: 1, 4, 3, 2
```

### Q: Complex event loop ordering

```javascript
console.log("Start");
setTimeout(() => console.log("timeout1"), 0);
setTimeout(() => console.log("timeout2"), 0);
Promise.resolve()
  .then(() => { console.log("promise1"); return Promise.resolve(); })
  .then(() => console.log("promise2"));
queueMicrotask(() => console.log("microtask"));
Promise.resolve().then(() => console.log("promise3"));
console.log("End");

// Output: Start, End, promise1, microtask, promise3, promise2, timeout1, timeout2
```

### Q: Promises — complete

```javascript
// States: pending → fulfilled OR rejected (immutable once settled)

const p = new Promise((resolve, reject) => {
  success ? resolve("data") : reject(new Error("fail"));
});

p.then(data => {}).catch(err => {}).finally(() => {});

// Chaining — each .then returns a NEW promise
fetch("/api")
  .then(res => res.json())
  .then(data => process(data))
  .catch(err => console.error(err));

// Combinators:
Promise.all([p1, p2, p3]);        // All must succeed. Rejects if ANY fails.
Promise.allSettled([p1, p2, p3]);  // Waits for all. Returns status of each.
Promise.race([p1, p2]);           // First to settle (resolve OR reject).
Promise.any([p1, p2]);            // First to fulfill. Ignores rejections.
```

### Q: Async/Await

```javascript
// async always returns a Promise
async function fetchData() {
  try {
    const res = await fetch("/api/user");
    const user = await res.json();
    return user;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// Parallel with async/await
const [users, posts] = await Promise.all([
  fetch("/users").then(r => r.json()),
  fetch("/posts").then(r => r.json()),
]);

// Sequential (slow) vs Parallel (fast)
// ❌ const a = await fetch(url1); const b = await fetch(url2);
// ✅ const [a, b] = await Promise.all([fetch(url1), fetch(url2)]);
```

---

## 10. Error Handling

```javascript
// Built-in types: TypeError, ReferenceError, SyntaxError, RangeError

// Custom Error
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

// Global handlers (Node.js)
process.on("unhandledRejection", (reason) => { console.error(reason); });
process.on("uncaughtException", (err) => { console.error(err); process.exit(1); });
```

---

## 11. Array & Object Methods

### Array Methods (Complete)
```javascript
// Non-mutating
arr.map(x => x * 2);
arr.filter(x => x > 2);
arr.reduce((acc, x) => acc + x, 0);
arr.find(x => x > 2);
arr.findIndex(x => x > 2);
arr.some(x => x > 2);
arr.every(x => x > 0);
arr.flat(Infinity);
arr.flatMap(x => [x, x * 2]);
arr.includes(3);
arr.indexOf(3);
arr.slice(1, 3);
arr.concat([4, 5]);

// Mutating
arr.push(6);          // add end
arr.pop();            // remove end
arr.unshift(0);       // add start
arr.shift();          // remove start
arr.splice(2, 1);     // remove at index
arr.sort((a,b) => a-b);
arr.reverse();

// ES2023 non-mutating alternatives
arr.toSorted((a,b) => a-b);
arr.toReversed();
arr.toSpliced(2, 1);
arr.with(2, 99);

// Static
Array.isArray([]);
Array.from("abc");    // ["a","b","c"]
Array.from({length:5}, (_,i) => i); // [0,1,2,3,4]
```

### Object Methods (Complete)
```javascript
Object.keys(obj);       // ["a","b"]
Object.values(obj);     // [1, 2]
Object.entries(obj);    // [["a",1],["b",2]]
Object.fromEntries(entries);
Object.assign({}, obj); // shallow copy
structuredClone(obj);   // deep copy (ES2022)
Object.freeze(obj);     // immutable
Object.seal(obj);       // no add/delete, can modify
Object.hasOwn(obj, "a"); // ES2022, replaces hasOwnProperty
```

---

## 12. Modules

```javascript
// CommonJS (Node default)
module.exports = { add, subtract };
const { add } = require("./math");

// ES Modules (modern standard)
export const add = (a, b) => a + b;
export default function multiply(a, b) { return a * b; }
import multiply, { add } from "./math.mjs";

// Dynamic import (lazy loading)
const mod = await import("./math.mjs");

// Key: CJS is sync, whole module. ESM is async, tree-shakeable.
```

---

## 13. Memory & Garbage Collection

**Mark-and-Sweep**: GC marks reachable objects from roots, sweeps unreachable.

```javascript
// Memory leak causes:
// 1. Uncleared intervals/timeouts
// 2. Closures holding large references
// 3. Forgotten event listeners
// 4. Global variables

// Fix: WeakMap/WeakSet for caches, removeEventListener, clearInterval
```

---

## 14. Tricky Output Questions

```javascript
typeof typeof 42;          // "string"
0.1 + 0.2 === 0.3;        // false (IEEE-754)
[] + [];                   // ""
[] + {};                   // "[object Object]"
NaN === NaN;               // false (use Number.isNaN())
[] == ![];                 // true (both → 0)
1 < 2 < 3;                // true
3 > 2 > 1;                // false (true > 1 → 1 > 1 → false)
"5" - 3;                  // 2
"5" + 3;                  // "53"

// var hoisting in function
var x = 10;
function test() { console.log(x); var x = 20; }
test(); // undefined (local var x hoisted)

// ASI trap
function foo() { return\n  { a: 1 } }
foo(); // undefined (semicolon inserted after return)

// Promise ordering
async function foo() { console.log("A"); await Promise.resolve(); console.log("B"); }
console.log("C"); foo(); console.log("D");
// Output: C, A, D, B

// this in nested
const obj = {
  value: 42,
  get1() { return (function() { return this.value; })(); },    // undefined
  get2() { return (() => this.value)(); },                      // 42
};
```

---

## 15. Coding Polyfills & Challenges

### map polyfill
```javascript
Array.prototype.myMap = function(cb, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) result.push(cb.call(thisArg, this[i], i, this));
  }
  return result;
};
```

### reduce polyfill
```javascript
Array.prototype.myReduce = function(cb, init) {
  let acc = init !== undefined ? init : this[0];
  const start = init !== undefined ? 0 : 1;
  for (let i = start; i < this.length; i++) {
    if (i in this) acc = cb(acc, this[i], i, this);
  }
  return acc;
};
```

### Promise.all polyfill
```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [], arr = [...promises];
    if (!arr.length) return resolve([]);
    let done = 0;
    arr.forEach((p, i) => {
      Promise.resolve(p).then(v => {
        results[i] = v;
        if (++done === arr.length) resolve(results);
      }).catch(reject);
    });
  });
}
```

### Deep Clone
```javascript
function deepClone(obj, seen = new WeakMap()) {
  if (obj === null || typeof obj !== "object") return obj;
  if (seen.has(obj)) return seen.get(obj);
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);
  const clone = Array.isArray(obj) ? [] : {};
  seen.set(obj, clone);
  for (const key of Reflect.ownKeys(obj)) clone[key] = deepClone(obj[key], seen);
  return clone;
}
```

### Curry
```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args);
    return (...next) => curried(...args, ...next);
  };
}
const add = curry((a, b, c) => a + b + c);
add(1)(2)(3); // 6
add(1, 2)(3); // 6
```

### Flatten
```javascript
function flat(arr, depth = 1) {
  return depth > 0
    ? arr.reduce((a, v) => a.concat(Array.isArray(v) ? flat(v, depth-1) : v), [])
    : arr.slice();
}
```

### Debounce & Throttle
```javascript
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function throttle(fn, limit) {
  let blocked = false;
  return function(...args) {
    if (!blocked) {
      fn.apply(this, args);
      blocked = true;
      setTimeout(() => blocked = false, limit);
    }
  };
}
```

### bind polyfill
```javascript
Function.prototype.myBind = function(ctx, ...bound) {
  const fn = this;
  return function(...args) {
    return fn.apply(ctx, [...bound, ...args]);
  };
};
```

---

## Quick Revision Table

| Concept | Key Point |
|---------|-----------|
| Hoisting | var=undefined, let/const=TDZ, fn declarations=full body |
| Closure | Function + its lexical env persisted after outer returns |
| Event Loop | Sync → Microtasks (Promises) → Macrotasks (setTimeout) |
| `this` | Depends on HOW called, not WHERE defined (except arrows) |
| `==` vs `===` | == coerces, === strict comparison |
| Arrow fn | No own this/arguments/new/prototype |
| Prototype | obj → proto → Object.prototype → null |
| `??` vs `\|\|` | ?? = null/undefined only; \|\| = all falsy |
| Map vs Object | Map: any key, ordered, .size |
| Set vs Array | Set: unique, .has() O(1) |
| WeakMap/Set | Object keys/values only, GC-friendly, not iterable |
| Spread vs Rest | ...arr expands; ...rest collects |
