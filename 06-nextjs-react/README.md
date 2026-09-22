# Next.js & React — Complete Interview Guide

---

## PART 1: REACT

### Q: What is React?

A JavaScript library for building user interfaces using a component-based architecture with a virtual DOM.

---

### Q: Components — Functional vs Class

```jsx
// Functional Component (modern, preferred)
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Arrow function
const Greeting = ({ name }) => <h1>Hello, {name}!</h1>;

// Class Component (legacy)
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}!</h1>;
  }
}
```

---

### Q: JSX — What is it?

JSX is syntax sugar for `React.createElement()`. Looks like HTML in JavaScript.

```jsx
// JSX
const element = <h1 className="title">Hello, {name}!</h1>;

// Compiles to:
const element = React.createElement("h1", { className: "title" }, `Hello, ${name}!`);

// Rules:
// 1. Must return a single root element (use <> Fragment)
// 2. className instead of class
// 3. htmlFor instead of for
// 4. camelCase for attributes (onClick, onChange)
// 5. Self-closing tags required: <img />, <input />
// 6. Expressions in {} — no statements (if/for)
```

---

### Q: Hooks — Complete Guide

```jsx
// === useState ===
const [count, setCount] = useState(0);
setCount(5);              // Direct value
setCount(prev => prev + 1); // Functional update (use when based on previous state)

// Lazy initialization (expensive initial value)
const [data, setData] = useState(() => expensiveComputation());

// === useEffect ===
// Runs AFTER render. For side effects (API calls, subscriptions, DOM manipulation).

useEffect(() => {
  // Runs after EVERY render
});

useEffect(() => {
  // Runs ONCE on mount
  fetchData();
}, []); // Empty dependency array

useEffect(() => {
  // Runs when `count` changes
  document.title = `Count: ${count}`;
}, [count]);

useEffect(() => {
  const subscription = subscribe(id);
  return () => {
    // CLEANUP — runs before next effect and on unmount
    subscription.unsubscribe();
  };
}, [id]);

// === useRef ===
// Persists value across renders WITHOUT causing re-render
const inputRef = useRef(null);
const renderCount = useRef(0);

useEffect(() => {
  renderCount.current++; // Does NOT trigger re-render
});

<input ref={inputRef} />
inputRef.current.focus(); // Access DOM element

// === useMemo === (memoize computed value)
const expensiveResult = useMemo(() => {
  return computeExpensive(a, b);
}, [a, b]); // Recomputes only when a or b changes

// === useCallback === (memoize function reference)
const handleClick = useCallback(() => {
  console.log(count);
}, [count]); // New reference only when count changes

// When to use useMemo/useCallback:
// - Child component wrapped in React.memo
// - Value/function passed as dependency to another hook
// - Expensive computation
// DON'T use everywhere — premature optimization

// === useContext ===
const ThemeContext = React.createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext); // "dark"
  return <div className={theme}>Themed content</div>;
}

// === useReducer === (complex state logic)
function reducer(state, action) {
  switch (action.type) {
    case "increment": return { count: state.count + 1 };
    case "decrement": return { count: state.count - 1 };
    case "reset": return { count: 0 };
    default: throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
    </>
  );
}

// === useLayoutEffect ===
// Same as useEffect but fires SYNCHRONOUSLY after DOM mutation, before paint
// Use for DOM measurements that affect layout
useLayoutEffect(() => {
  const { height } = ref.current.getBoundingClientRect();
  setHeight(height);
}, []);

// === useId === (unique IDs for accessibility)
function FormField() {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>Email</label>
      <input id={id} type="email" />
    </>
  );
}
```

---

### Q: State Management — when to use what?

```
Local state (useState) → Component-specific state
Lifting state up → Shared between siblings via parent
Context (useContext) → Theme, auth, locale (infrequent updates)
useReducer → Complex state transitions
Redux/Zustand → Large-scale global state
TanStack Query → Server state (API data caching)
```

---

### Q: Virtual DOM & Reconciliation

**Virtual DOM**: In-memory representation of the real DOM. React creates a virtual tree, diffs it with the previous one, and applies only the minimal changes to the real DOM.

**Reconciliation Algorithm:**
1. Different element types → tear down old tree, build new
2. Same element type → update changed attributes
3. Keys → help React identify which items changed in lists

```jsx
// ❌ Without key — React can't efficiently track items
{items.map(item => <li>{item.name}</li>)}

// ✅ With key — React knows exactly what changed
{items.map(item => <li key={item.id}>{item.name}</li>)}

// ❌ Never use index as key for dynamic lists
// (causes bugs when items are reordered/deleted)
```

---

### Q: React.memo, useMemo, useCallback — preventing re-renders

```jsx
// React.memo — skip re-render if props haven't changed
const ExpensiveChild = React.memo(function ExpensiveChild({ data, onClick }) {
  console.log("Rendered!"); // Only when props change
  return <div onClick={onClick}>{data}</div>;
});

// Parent must memoize what it passes:
function Parent() {
  const [count, setCount] = useState(0);
  
  const data = useMemo(() => processData(items), [items]);
  const handleClick = useCallback(() => {
    console.log("clicked");
  }, []);
  
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      {/* ExpensiveChild won't re-render when count changes */}
      <ExpensiveChild data={data} onClick={handleClick} />
    </>
  );
}
```

---

### Q: Custom Hooks

```jsx
// Reusable logic extracted into a custom hook
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// Usage
const [theme, setTheme] = useLocalStorage("theme", "dark");

// Fetch hook
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) { setData(data); setLoading(false); }
      })
      .catch(err => {
        if (!cancelled) { setError(err); setLoading(false); }
      });

    return () => { cancelled = true; }; // Cleanup
  }, [url]);

  return { data, loading, error };
}

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}
```

---

### Q: Error Boundaries

```jsx
// Class component only (no hook equivalent yet)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
    // Log to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong: {this.state.error?.message}</h1>;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

---

## PART 2: NEXT.JS (App Router)

### Q: What is Next.js?

Full-stack React framework with:
- **Server-side Rendering (SSR)**
- **Static Site Generation (SSG)**
- **API routes**
- **File-based routing**
- **Built-in optimization** (images, fonts, code splitting)

---

### Q: App Router (Next.js 13+) — File-based Routing

```
app/
├── layout.tsx          ← Root layout (wraps all pages)
├── page.tsx            ← / (home page)
├── loading.tsx         ← Loading UI (Suspense)
├── error.tsx           ← Error UI (Error Boundary)
├── not-found.tsx       ← 404 page
├── users/
│   ├── page.tsx        ← /users
│   ├── [id]/
│   │   ├── page.tsx    ← /users/:id (dynamic route)
│   │   └── loading.tsx
│   └── layout.tsx      ← Nested layout for /users/*
├── api/
│   └── users/
│       └── route.ts    ← API route: /api/users
└── (auth)/             ← Route group (no URL segment)
    ├── login/
    │   └── page.tsx    ← /login
    └── register/
        └── page.tsx    ← /register
```

---

### Q: Server Components vs Client Components

```tsx
// SERVER COMPONENT (default in App Router)
// Runs ONLY on the server. No hooks, no event handlers, no browser APIs.
// Can directly access DB, file system, env vars.
// Smaller bundle — not sent to client.

// app/users/page.tsx
import { db } from "@/lib/db";

export default async function UsersPage() {
  const users = await db.user.findMany(); // Direct DB access!
  
  return (
    <div>
      <h1>Users</h1>
      {users.map(user => (
        <p key={user.id}>{user.name}</p>
      ))}
    </div>
  );
}

// CLIENT COMPONENT — must opt-in with "use client"
// Has interactivity: hooks, event handlers, browser APIs.
"use client";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

**When to use which:**
| Server Component | Client Component |
|-----------------|-----------------|
| Fetch data | onClick, onChange handlers |
| Access backend resources | useState, useEffect |
| Keep secrets on server | Browser APIs (localStorage) |
| Reduce client JS bundle | Interactivity, real-time updates |

---

### Q: Data Fetching in Next.js

```tsx
// SERVER COMPONENT — fetch directly (no useEffect needed!)
async function UsersPage() {
  // Cached by default (like SSG)
  const res = await fetch("https://api.example.com/users");
  const users = await res.json();
  
  // Force dynamic (SSR)
  const res2 = await fetch("https://api.example.com/users", {
    cache: "no-store", // Always fresh
  });
  
  // Revalidate every 60 seconds (ISR)
  const res3 = await fetch("https://api.example.com/users", {
    next: { revalidate: 60 },
  });
  
  return <UserList users={users} />;
}

// SERVER ACTIONS (Next.js 14+) — server-side mutations from client
// app/actions.ts
"use server";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const user = await db.user.create({ data: { name } });
  revalidatePath("/users"); // Refresh cached data
  return user;
}

// Use in Client Component
"use client";
import { createUser } from "./actions";

function CreateUserForm() {
  return (
    <form action={createUser}>
      <input name="name" />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

### Q: Layouts & Templates

```tsx
// app/layout.tsx — Root layout (required, wraps ALL pages)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>Global Navbar</nav>
        <main>{children}</main>
        <footer>Global Footer</footer>
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx — Nested layout (wraps /dashboard/*)
export default function DashboardLayout({ children }) {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  );
}

// Layouts persist state across navigations (not re-mounted)
// Templates re-render on every navigation
// app/dashboard/template.tsx
export default function Template({ children }) {
  return <div>{children}</div>;
}
```

---

### Q: API Routes (Route Handlers)

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  
  const users = await db.user.findMany({
    skip: (parseInt(page) - 1) * 10,
    take: 10,
  });
  
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}

// app/api/users/[id]/route.ts — Dynamic route
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await db.user.findUnique({ where: { id: parseInt(params.id) } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}
```

---

### Q: Middleware in Next.js

```typescript
// middleware.ts (at project root)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  
  // Redirect if not authenticated
  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Add headers
  const response = NextResponse.next();
  response.headers.set("x-request-id", crypto.randomUUID());
  return response;
}

// Match specific routes
export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

---

### Q: Loading & Error UI

```tsx
// app/users/loading.tsx — automatic Suspense boundary
export default function Loading() {
  return <div className="spinner">Loading users...</div>;
}

// app/users/error.tsx — automatic Error Boundary
"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/not-found.tsx
export default function NotFound() {
  return <h1>404 — Page not found</h1>;
}
```

---

### Q: Rendering Strategies

| Strategy | When | How |
|----------|------|-----|
| SSG (Static) | Build time | Default `fetch()` or `generateStaticParams` |
| SSR (Dynamic) | Every request | `cache: "no-store"` or `export const dynamic = "force-dynamic"` |
| ISR (Incremental) | Revalidate periodically | `next: { revalidate: 60 }` |
| CSR (Client) | Browser | `"use client"` + useEffect/useState |

```tsx
// SSG — generate pages at build time for dynamic routes
export async function generateStaticParams() {
  const posts = await db.post.findMany();
  return posts.map(post => ({ id: post.id.toString() }));
}

// Force dynamic (SSR)
export const dynamic = "force-dynamic";

// Force static
export const dynamic = "force-static";
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| JSX | Sugar for React.createElement(). className, htmlFor, camelCase |
| useState | Local state. Use functional update for derived state. |
| useEffect | Side effects. Returns cleanup. Deps array controls when. |
| useRef | Persist value without re-render. DOM access. |
| useMemo | Memoize value. [deps] controls recomputation. |
| useCallback | Memoize function reference. For React.memo children. |
| useContext | Access context value without prop drilling. |
| useReducer | Complex state with actions/dispatch. |
| React.memo | Skip re-render if props unchanged (shallow compare). |
| Virtual DOM | In-memory diff → minimal real DOM updates. |
| Keys | Unique identifiers for list items. Never use index. |
| Server Component | Default in App Router. No hooks. Direct DB access. |
| Client Component | "use client". Interactivity, hooks, browser APIs. |
| Server Actions | "use server". Mutations from client. |
| Layout | Persists across navigations. Wraps children. |
| SSG/SSR/ISR | Static/dynamic/revalidating rendering strategies. |
