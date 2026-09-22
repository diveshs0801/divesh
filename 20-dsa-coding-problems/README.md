# Data Structures & Algorithms (DSA) — Complete Interview Guide (1 Year Experience)

---

## Table of Contents
1. [Big-O Notation & Complexity Cheat Sheet](#1-big-o-notation--complexity-cheat-sheet)
2. [Arrays, Hashing & Two Pointers](#2-arrays-hashing--two-pointers)
3. [Sliding Window & Intervals](#3-sliding-window--intervals)
4. [Linked Lists](#4-linked-lists)
5. [Stacks & Queues](#5-stacks--queues)
6. [Trees & Binary Search Trees (BST)](#6-trees--binary-search-trees-bst)
7. [Graphs & Grid Traversal (BFS / DFS)](#7-graphs--grid-traversal-bfs--dfs)
8. [Dynamic Programming & Greedy](#8-dynamic-programming--greedy)
9. [Binary Search](#9-binary-search)
10. [Real-World System DSA: LRU Cache & Rate Limiting](#10-real-world-system-dsa-lru-cache--rate-limiting)
11. [JS/TS Coding Round Essentials (Polyfills, Deep Clone, Debounce)](#11-jsts-coding-round-essentials)

---

## 1. Big-O Notation & Complexity Cheat Sheet

### Time Complexity Ranking (Fastest to Slowest):
```
O(1) < O(log n) < O(n) < O(n log n) < O(n^2) < O(2^n) < O(n!)
Constant < Logarithmic < Linear < Linearithmic < Quadratic < Exponential < Factorial
```

### Common Data Structure Operations:

| Data Structure | Access | Search | Insertion | Deletion | Space |
|---|---|---|---|---|---|
| **Array** | $O(1)$ | $O(n)$ | $O(n)$ (end: $O(1)$ amortized) | $O(n)$ | $O(n)$ |
| **Hash Map / Object** | $O(1)$ avg | $O(1)$ avg | $O(1)$ avg | $O(1)$ avg | $O(n)$ |
| **Singly Linked List**| $O(n)$ | $O(n)$ | $O(1)$ (head), $O(n)$ (tail) | $O(1)$ (given node pointer) | $O(n)$ |
| **Binary Search Tree**| $O(\log n)$ avg / $O(n)$ worst | $O(\log n)$ avg | $O(\log n)$ avg | $O(\log n)$ avg | $O(n)$ |
| **Min/Max Heap** | $O(1)$ (peek) | $O(n)$ | $O(\log n)$ | $O(\log n)$ (extract-min) | $O(n)$ |

---

## 2. Arrays, Hashing & Two Pointers

### Problem 1: Two Sum (LeetCode #1)
**Problem**: Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

- **Brute Force**: Two nested loops $\rightarrow O(n^2)$ time, $O(1)$ space.
- **Optimal (One-Pass Hash Map)**: Store complement `target - num` in a hash map as we iterate.
- **Complexity**: $O(n)$ Time, $O(n)$ Space.

```typescript
function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>(); // value -> index

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }

  return [];
}

// Test:
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
```

---

### Problem 2: Three Sum (LeetCode #15)
**Problem**: Find all unique triplets in the array that sum to 0. Must not contain duplicate triplets.

- **Optimal (Sort + Two Pointers)**:
  1. Sort array in ascending order ($O(n \log n)$).
  2. Iterate index `i` from $0$ to $n-3$. Skip duplicates for `i`.
  3. Use two pointers (`left = i + 1`, `right = n - 1`) to find target `0 - nums[i]`.
  4. If sum matches, push triplet and skip duplicate values for `left` and `right`.
- **Complexity**: $O(n^2)$ Time, $O(1)$ or $O(n)$ Space depending on sort implementation.

```typescript
function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const result: number[][] = [];

  for (let i = 0; i < nums.length - 2; i++) {
    // Optimization: smallest number > 0 means sum cannot be 0
    if (nums[i] > 0) break;

    // Skip duplicate i
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        // Skip duplicates for left & right
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}
```

---

### Problem 3: Group Anagrams (LeetCode #49)
**Problem**: Given an array of strings `strs`, group the anagrams together.

- **Optimal (Frequency Count or Sorted Key Map)**:
  - Normalize each string into a frequency-count string `#1#0#2...` or sorted characters.
  - Store strings into an array grouped by key in a Hash Map.
- **Complexity**: $O(N \cdot K)$ Time where $N$ is number of strings and $K$ is max length of string. $O(N \cdot K)$ Space.

```typescript
function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();

  for (const str of strs) {
    // 26 letters frequency bucket
    const count = new Array(26).fill(0);
    for (let i = 0; i < str.length; i++) {
      count[str.charCodeAt(i) - 97]++;
    }
    const key = count.join('#');

    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(str);
  }

  return Array.from(map.values());
}
```

---

### Problem 4: Product of Array Except Self (LeetCode #238)
**Problem**: Return an array `output` such that `output[i]` is equal to the product of all the elements of `nums` except `nums[i]`. **Constraint: Solve in $O(n)$ time WITHOUT using the division operation!**

- **Optimal (Prefix and Suffix Products in $O(1)$ auxiliary space)**:
  - First pass (left to right): `output[i]` stores prefix product of all elements to the left of `i`.
  - Second pass (right to left): multiply `output[i]` by running suffix product from right.
- **Complexity**: $O(n)$ Time, $O(1)$ extra Space (excluding output array).

```typescript
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const output = new Array<number>(n).fill(1);

  // Prefix products
  let leftProduct = 1;
  for (let i = 0; i < n; i++) {
    output[i] = leftProduct;
    leftProduct *= nums[i];
  }

  // Suffix products
  let rightProduct = 1;
  for (let i = n - 1; i >= 0; i--) {
    output[i] *= rightProduct;
    rightProduct *= nums[i];
  }

  return output;
}
```

---

## 3. Sliding Window & Intervals

### Problem 5: Longest Substring Without Repeating Characters (LeetCode #3)
**Problem**: Given a string `s`, find the length of the longest substring without repeating characters.

- **Approach (Dynamic Sliding Window + Last Seen Index Map)**:
  - Maintain window `[left, right]`.
  - If `s[right]` was seen at index $\ge left$, jump `left = lastSeenIndex + 1`.
  - Update `maxLength = Math.max(maxLength, right - left + 1)`.
- **Complexity**: $O(n)$ Time, $O(\min(n, m))$ Space where $m$ is charset size.

```typescript
function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    if (lastSeen.has(char) && lastSeen.get(char)! >= left) {
      left = lastSeen.get(char)! + 1;
    }

    lastSeen.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
```

---

### Problem 6: Merge Intervals (LeetCode #56)
**Problem**: Given an array of intervals where `intervals[i] = [starti, endi]`, merge all overlapping intervals.

- **Approach**:
  1. Sort intervals by `start` time: $O(n \log n)$.
  2. Iterate through intervals. If current interval starts before previous ends $\rightarrow$ merge by updating end time: `prev[1] = Math.max(prev[1], curr[1])`.
  3. Otherwise, push current interval as a new disjoint interval.
- **Complexity**: $O(n \log n)$ Time, $O(n)$ Space for result.

```typescript
function merge(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;

  intervals.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const prev = merged[merged.length - 1];

    if (current[0] <= prev[1]) {
      // Overlap detected: expand end time
      prev[1] = Math.max(prev[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}
```

---

## 4. Linked Lists

### Problem 7: Reverse a Linked List (LeetCode #206)
**Problem**: Reverse a singly linked list.

```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
  }
}

// Iterative: O(n) Time, O(1) Space
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr: ListNode | null = head;

  while (curr !== null) {
    const nextTemp = curr.next; // save next
    curr.next = prev;          // reverse link
    prev = curr;               // advance prev
    curr = nextTemp;           // advance curr
  }

  return prev;
}
```

---

### Problem 8: Detect Cycle in a Linked List (Floyd's Tortoise and Hare — LeetCode #141)
**Problem**: Determine if the linked list has a cycle.

- **Approach**: Slow pointer moves 1 step, fast pointer moves 2 steps. If there is a cycle, fast will inevitably lap slow and `slow === fast`. If fast reaches `null`, no cycle exists.
- **Complexity**: $O(n)$ Time, $O(1)$ Space.

```typescript
function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;

  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true;
    }
  }

  return false;
}
```

---

## 5. Stacks & Queues

### Problem 9: Valid Parentheses (LeetCode #20)
**Problem**: Given a string containing `'('`, `')'`, `'{'`, `'}'`, `'['`, `']'`, determine if it is valid.

- **Approach**: Push opening brackets onto stack. For closing brackets, pop stack and check matching pair. Stack must be empty at the end.
- **Complexity**: $O(n)$ Time, $O(n)$ Space.

```typescript
function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (char in map) {
      const top = stack.length > 0 ? stack.pop() : '#';
      if (top !== map[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }

  return stack.length === 0;
}
```

---

### Problem 10: Min Stack (LeetCode #155)
**Problem**: Design a stack that supports `push`, `pop`, `top`, and retrieving the minimum element in **$O(1)$ constant time**.

- **Approach**: Keep two stacks: `stack` for standard values, and `minStack` tracking the minimum value at each depth.

```typescript
class MinStack {
  private stack: number[] = [];
  private minStack: number[] = [];

  push(val: number): void {
    this.stack.push(val);
    const currentMin = this.minStack.length > 0 ? this.getMin() : val;
    this.minStack.push(Math.min(val, currentMin));
  }

  pop(): void {
    this.stack.pop();
    this.minStack.pop();
  }

  top(): number {
    return this.stack[this.stack.length - 1];
  }

  getMin(): number {
    return this.minStack[this.minStack.length - 1];
  }
}
```

---

## 6. Trees & Binary Search Trees (BST)

### Problem 11: Validate Binary Search Tree (LeetCode #98)
**Problem**: Determine if a binary tree is a valid BST (every node in left subtree $<$ node $<$ every node in right subtree).

- **Common Trap**: Simply checking `node.left.val < node.val && node.right.val > node.val` is INSUFFICIENT! Every descendant in left must be strictly less than the root.
- **Approach**: Pass down valid bounds `(min, max)` recursively.
- **Complexity**: $O(n)$ Time, $O(h)$ Space where $h$ is tree height (call stack).

```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
  }
}

function isValidBST(root: TreeNode | null): boolean {
  function validate(node: TreeNode | null, min: number | null, max: number | null): boolean {
    if (node === null) return true;

    if ((min !== null && node.val <= min) || (max !== null && node.val >= max)) {
      return false;
    }

    // Left child must be < node.val; Right child must be > node.val
    return validate(node.left, min, node.val) && validate(node.right, node.val, max);
  }

  return validate(root, null, null);
}
```

---

### Problem 12: Lowest Common Ancestor (LCA) of a Binary Tree (LeetCode #236)
**Problem**: Find lowest common ancestor of two given nodes `p` and `q` in a binary tree.

- **Approach (Post-order Traversal)**:
  - Base case: If root is null, or root is `p`, or root is `q`, return root.
  - Recurse left and right subtrees.
  - If both left and right return non-null, `root` is the LCA.
  - If only one is non-null, bubble that result up.
- **Complexity**: $O(n)$ Time, $O(h)$ Space.

```typescript
function lowestCommonAncestor(
  root: TreeNode | null,
  p: TreeNode,
  q: TreeNode
): TreeNode | null {
  if (root === null || root === p || root === q) {
    return root;
  }

  const left = lowestCommonAncestor(root.left, p, q);
  const right = lowestCommonAncestor(root.right, p, q);

  if (left !== null && right !== null) {
    return root; // p and q found in separate subtrees!
  }

  return left !== null ? left : right;
}
```

---

## 7. Graphs & Grid Traversal (BFS / DFS)

### Problem 13: Number of Islands (LeetCode #200)
**Problem**: Given an `m x n` 2D binary grid `'1'` (land) and `'0'` (water), return the number of islands.

- **Approach (DFS Flood Fill)**:
  - Iterate through every cell `(r, c)`.
  - When `'1'` is encountered, increment island count and trigger DFS to sink all connected land (`grid[r][c] = '0'`).
- **Complexity**: $O(m \times n)$ Time, $O(m \times n)$ Space for recursion stack.

```typescript
function numIslands(grid: string[][]): number {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r: number, c: number): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
      return;
    }

    // Mark as visited (sink island)
    grid[r][c] = '0';

    // Explore 4 directions
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }

  return count;
}
```

---

## 8. Dynamic Programming & Greedy

### Problem 14: Climbing Stairs (LeetCode #70)
**Problem**: You are climbing a staircase. It takes `n` steps to reach the top. Each time you can climb 1 or 2 steps. How many distinct ways can you climb to the top?

- **Recurrence**: `ways(n) = ways(n-1) + ways(n-2)` (Identical to Fibonacci).
- **Complexity**: $O(n)$ Time, $O(1)$ Space.

```typescript
function climbStairs(n: number): number {
  if (n <= 2) return n;

  let prev2 = 1;
  let prev1 = 2;

  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}
```

---

### Problem 15: Coin Change (LeetCode #322)
**Problem**: Return fewest number of coins needed to make up amount. If not possible, return `-1`.

- **Approach (Bottom-Up Tabulation)**:
  - `dp[a]` represents minimum coins needed to make amount `a`.
  - Initialize array of size `amount + 1` filled with `Infinity`, `dp[0] = 0`.
  - For each amount `a` from 1 to `amount` and each `coin`:
    `dp[a] = Math.min(dp[a], 1 + dp[a - coin])`.
- **Complexity**: $O(\text{amount} \times \text{coins.length})$ Time, $O(\text{amount})$ Space.

```typescript
function coinChange(coins: number[], amount: number): number {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (a - coin >= 0) {
        dp[a] = Math.min(dp[a], 1 + dp[a - coin]);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

---

## 9. Binary Search

### Problem 16: Search in Rotated Sorted Array (LeetCode #33)
**Problem**: Given integer array `nums` sorted in ascending order with distinct values, rotated at unknown pivot index, search for `target`. Must run in $O(\log n)$ time.

- **Key Insight**: In any rotated sorted array, **at least one half (left or right) is guaranteed to be normally sorted**.
- **Complexity**: $O(\log n)$ Time, $O(1)$ Space.

```typescript
function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) return mid;

    // Check if Left Half is sorted
    if (nums[left] <= nums[mid]) {
      if (target >= nums[left] && target < nums[mid]) {
        right = mid - 1; // target in left half
      } else {
        left = mid + 1;  // target in right half
      }
    }
    // Otherwise, Right Half MUST be sorted
    else {
      if (target > nums[mid] && target <= nums[right]) {
        left = mid + 1;  // target in right half
      } else {
        right = mid - 1; // target in left half
      }
    }
  }

  return -1;
}
```

---

## 10. Real-World System DSA: LRU Cache & Rate Limiting

### Problem 17: LRU (Least Recently Used) Cache (LeetCode #146)
**Why it matters**: Direct backend interview favorite. Simulates caching layers like Redis or in-memory application caches.

- **Design**:
  - Hash Map for $O(1)$ key lookup.
  - Doubly Linked List for $O(1)$ remove and add-to-front (most recently used).
  - Dummy `head` and `tail` nodes eliminate edge case checks.

```typescript
class DNode {
  key: number;
  val: number;
  prev: DNode | null = null;
  next: DNode | null = null;
  constructor(key = 0, val = 0) {
    this.key = key;
    this.val = val;
  }
}

class LRUCache {
  private capacity: number;
  private map: Map<number, DNode> = new Map();
  private head: DNode;
  private tail: DNode;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.head = new DNode();
    this.tail = new DNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private removeNode(node: DNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private addToFront(node: DNode): void {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  get(key: number): number {
    if (!this.map.has(key)) return -1;

    const node = this.map.get(key)!;
    this.removeNode(node);
    this.addToFront(node); // mark as most recently used
    return node.val;
  }

  put(key: number, value: number): void {
    if (this.map.has(key)) {
      const node = this.map.get(key)!;
      node.val = value;
      this.removeNode(node);
      this.addToFront(node);
    } else {
      if (this.map.size >= this.capacity) {
        // Evict LRU node (node right before tail)
        const lru = this.tail.prev!;
        this.removeNode(lru);
        this.map.delete(lru.key);
      }
      const newNode = new DNode(key, value);
      this.map.set(key, newNode);
      this.addToFront(newNode);
    }
  }
}
```

---

### Problem 18: Token Bucket Rate Limiter Algorithm
**Problem**: Implement an in-memory Token Bucket rate limiter class in TypeScript.

```typescript
class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillRate: number; // tokens added per millisecond
  private lastRefillTimestamp: number;

  constructor(capacity: number, refillRatePerSec: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRatePerSec / 1000;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTimestamp;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTimestamp = now;
  }

  public allowRequest(tokensRequested = 1): boolean {
    this.refill();

    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }
    return false;
  }
}
```

---

## 11. JS/TS Coding Round Essentials

### Question 19: Implement Debounce with Immediate (Leading) Option

```typescript
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const callNow = immediate && !timeoutId;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func.apply(this, args);
      }
    }, wait);

    if (callNow) {
      func.apply(this, args);
    }
  };
}
```

---

### Question 20: Implement Deep Clone Handling Nested Objects, Arrays, and Dates

```typescript
function deepClone<T>(obj: T, hash = new WeakMap()): T {
  // Primitives and functions (immutable / referenced)
  if (Object(obj) !== obj || typeof obj === 'function') {
    return obj;
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as any;
  }

  // Handle Circular References
  if (hash.has(obj as object)) {
    return hash.get(obj as object);
  }

  // Handle Array or Object
  const clone = (Array.isArray(obj) ? [] : {}) as any;
  hash.set(obj as object, clone);

  for (const key of Object.keys(obj as object)) {
    clone[key] = deepClone((obj as any)[key], hash);
  }

  return clone;
}
```

---

### Question 21: Flatten a Deeply Nested Array or Object

```typescript
// Recursive Array Flatten
function flattenArray(arr: any[]): any[] {
  return arr.reduce((acc, val) => {
    return Array.isArray(val)
      ? acc.concat(flattenArray(val))
      : acc.concat(val);
  }, []);
}

// Nested Object Flatten (e.g. { a: { b: 1 } } -> { "a.b": 1 })
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    const propName = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, propName));
    } else {
      result[propName] = val;
    }
  }

  return result;
}
```
