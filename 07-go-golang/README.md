# Go (Golang) — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is Go?

Go is a statically-typed, compiled language designed at Google. Key traits:
- **Fast compilation** and execution
- **Built-in concurrency** (goroutines + channels)
- **Garbage collected**
- **Simple syntax** (no classes, no inheritance, no exceptions)
- **Great for microservices**, CLI tools, distributed systems

---

### Q: Variables & Types

```go
package main

import "fmt"

func main() {
    // Variable declaration
    var name string = "Divesh"
    var age int = 22
    var isActive bool = true
    
    // Short declaration (inferred type) — ONLY inside functions
    city := "Coimbatore"
    score := 95.5 // float64
    
    // Multiple
    var x, y int = 10, 20
    a, b := "hello", 42
    
    // Constants
    const Pi = 3.14159
    const (
        StatusActive   = "active"
        StatusInactive = "inactive"
    )
    
    // iota — auto-incrementing constant
    const (
        Sunday = iota    // 0
        Monday           // 1
        Tuesday          // 2
    )
    
    // Zero values (default)
    var i int       // 0
    var f float64   // 0.0
    var s string    // ""
    var b2 bool     // false
    var p *int      // nil (pointer)
    var sl []int    // nil (slice)
    var m map[string]int // nil (map)
    
    fmt.Println(name, age, city)
}

// Basic types:
// int, int8, int16, int32, int64
// uint, uint8 (byte), uint16, uint32, uint64
// float32, float64
// complex64, complex128
// bool
// string
// byte (alias for uint8)
// rune (alias for int32, represents a Unicode code point)
```

---

### Q: Structs (Go's replacement for classes)

```go
type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
}

// Constructor pattern (Go doesn't have constructors)
func NewUser(name, email string) *User {
    return &User{
        ID:        generateID(),
        Name:      name,
        Email:     email,
        CreatedAt: time.Now(),
    }
}

// Methods on struct
func (u *User) FullInfo() string {
    return fmt.Sprintf("%s (%s)", u.Name, u.Email)
}

// Value receiver vs Pointer receiver
func (u User) GetName() string {     // Value — cannot modify u
    return u.Name
}

func (u *User) SetName(name string) { // Pointer — can modify u
    u.Name = name
}

// Embedding (composition over inheritance)
type Admin struct {
    User              // Embedded struct — Admin "inherits" User's fields/methods
    Permissions []string
}

admin := Admin{
    User:        User{Name: "Divesh", Email: "d@e.com"},
    Permissions: []string{"read", "write", "delete"},
}
admin.Name // "Divesh" — promoted from User
admin.FullInfo() // Works! Method promoted from User
```

---

### Q: Interfaces

```go
// Implicit implementation — no "implements" keyword
type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

// Circle implicitly implements Shape (has Area + Perimeter methods)

type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

// Polymorphism
func PrintShapeInfo(s Shape) {
    fmt.Printf("Area: %.2f, Perimeter: %.2f\n", s.Area(), s.Perimeter())
}

PrintShapeInfo(Circle{Radius: 5})
PrintShapeInfo(Rectangle{Width: 3, Height: 4})

// Empty interface — accepts any type (like `any` in TS)
func PrintAnything(v interface{}) { // or `any` in Go 1.18+
    fmt.Println(v)
}

// Type assertion
func process(v interface{}) {
    s, ok := v.(string) // Type assertion with ok check
    if ok {
        fmt.Println("String:", s)
    }
}

// Type switch
func describe(v interface{}) {
    switch val := v.(type) {
    case string:
        fmt.Println("String:", val)
    case int:
        fmt.Println("Int:", val)
    case bool:
        fmt.Println("Bool:", val)
    default:
        fmt.Println("Unknown type")
    }
}

// Common interfaces in stdlib:
// io.Reader  — Read(p []byte) (n int, err error)
// io.Writer  — Write(p []byte) (n int, err error)
// io.Closer  — Close() error
// fmt.Stringer — String() string
// error      — Error() string
```

---

## 2. Error Handling

### Q: How does Go handle errors?

Go has NO exceptions. Errors are values returned from functions.

```go
// Functions return error as last return value
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 0)
if err != nil {
    log.Fatal(err)
}
fmt.Println(result)

// Custom error types
type NotFoundError struct {
    Resource string
    ID       int
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s with ID %d not found", e.Resource, e.ID)
}

func findUser(id int) (*User, error) {
    user := db.FindByID(id)
    if user == nil {
        return nil, &NotFoundError{Resource: "User", ID: id}
    }
    return user, nil
}

// Wrapping errors (Go 1.13+)
func getUser(id int) (*User, error) {
    user, err := db.FindByID(id)
    if err != nil {
        return nil, fmt.Errorf("getUser(%d): %w", id, err) // %w wraps
    }
    return user, nil
}

// Unwrapping
if errors.Is(err, sql.ErrNoRows) { /* ... */ }

var nfErr *NotFoundError
if errors.As(err, &nfErr) {
    fmt.Println(nfErr.Resource, nfErr.ID)
}

// Sentinel errors
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrConflict     = errors.New("conflict")
)
```

---

## 3. Goroutines & Channels (Concurrency)

### Q: What is a Goroutine?

A lightweight thread managed by the Go runtime. Costs ~2KB stack (vs ~1MB for OS thread).

```go
// Start a goroutine
go func() {
    fmt.Println("I'm running concurrently!")
}()

go processOrder(order) // Any function can be a goroutine
```

### Q: Channels — goroutine communication

```go
// "Don't communicate by sharing memory; share memory by communicating."

// Unbuffered channel — sender blocks until receiver is ready
ch := make(chan string)

go func() {
    ch <- "hello" // Send (blocks until someone receives)
}()

msg := <-ch // Receive (blocks until someone sends)
fmt.Println(msg) // "hello"

// Buffered channel — sender blocks only when buffer is full
ch := make(chan int, 3) // Buffer size 3
ch <- 1
ch <- 2
ch <- 3
// ch <- 4 // Would block! Buffer full.

// Directional channels
func producer(ch chan<- int) { // Send-only
    ch <- 42
}
func consumer(ch <-chan int) { // Receive-only
    val := <-ch
    fmt.Println(val)
}

// Closing channels
close(ch)

// Range over channel (receives until closed)
for msg := range ch {
    fmt.Println(msg)
}

// Select — multiplex channels (like switch for channels)
select {
case msg := <-ch1:
    fmt.Println("ch1:", msg)
case msg := <-ch2:
    fmt.Println("ch2:", msg)
case <-time.After(5 * time.Second):
    fmt.Println("Timeout!")
default:
    fmt.Println("No channel ready") // Non-blocking
}
```

### Q: Common Concurrency Patterns

```go
// Fan-out, Fan-in
func fanOut(input <-chan int, workers int) []<-chan int {
    channels := make([]<-chan int, workers)
    for i := 0; i < workers; i++ {
        channels[i] = process(input) // Each worker reads from input
    }
    return channels
}

func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                out <- v
            }
        }(ch)
    }
    go func() {
        wg.Wait()
        close(out)
    }()
    return out
}

// Worker Pool
func workerPool(jobs <-chan Job, results chan<- Result, numWorkers int) {
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for job := range jobs {
                result := processJob(job)
                results <- result
            }
        }(i)
    }
    wg.Wait()
    close(results)
}

// Context for cancellation and timeouts
func fetchData(ctx context.Context, url string) ([]byte, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }
    
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    return io.ReadAll(resp.Body)
}

// Usage with timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

data, err := fetchData(ctx, "https://api.example.com/data")
if err != nil {
    if errors.Is(err, context.DeadlineExceeded) {
        fmt.Println("Request timed out")
    }
}

// WaitGroup — wait for multiple goroutines
var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)
    go func(id int) {
        defer wg.Done()
        fmt.Printf("Worker %d done\n", id)
    }(i)
}

wg.Wait() // Block until all 5 goroutines finish

// Mutex — protect shared state
type SafeCounter struct {
    mu    sync.RWMutex
    count map[string]int
}

func (c *SafeCounter) Increment(key string) {
    c.mu.Lock()         // Exclusive lock
    defer c.mu.Unlock()
    c.count[key]++
}

func (c *SafeCounter) Get(key string) int {
    c.mu.RLock()        // Read lock (multiple readers allowed)
    defer c.mu.RUnlock()
    return c.count[key]
}

// sync.Once — execute exactly once
var once sync.Once
var instance *Database

func GetDB() *Database {
    once.Do(func() {
        instance = connectToDatabase()
    })
    return instance
}
```

---

## 4. Slices, Maps, and Data Structures

```go
// Slices (dynamic arrays)
nums := []int{1, 2, 3, 4, 5}
nums = append(nums, 6)                // Add element
nums = append(nums[:2], nums[3:]...)  // Remove index 2
copy(dest, src)                       // Copy slice
len(nums)                             // Length
cap(nums)                             // Capacity

// Make with length and capacity
s := make([]int, 0, 100) // len=0, cap=100 (preallocate for performance)

// Maps
m := map[string]int{
    "alice": 25,
    "bob":   30,
}
m["charlie"] = 28            // Add/update
val, exists := m["alice"]    // Check existence
delete(m, "alice")           // Delete
for key, value := range m {} // Iterate (random order!)
```

---

## 5. HTTP Server

```go
package main

import (
    "encoding/json"
    "net/http"
)

type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

func main() {
    mux := http.NewServeMux()
    
    mux.HandleFunc("GET /api/users", getUsers)
    mux.HandleFunc("POST /api/users", createUser)
    mux.HandleFunc("GET /api/users/{id}", getUser) // Go 1.22+ path params
    
    // Middleware
    handler := loggingMiddleware(mux)
    
    http.ListenAndServe(":8080", handler)
}

func getUsers(w http.ResponseWriter, r *http.Request) {
    users := []User{{ID: 1, Name: "Divesh"}}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(users)
}

func getUser(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id") // Go 1.22+
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(User{ID: 1, Name: "User " + id})
}

func createUser(w http.ResponseWriter, r *http.Request) {
    var user User
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}

func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        log.Printf("%s %s", r.Method, r.URL.Path)
        next.ServeHTTP(w, r)
    })
}
```

---

## 6. Generics (Go 1.18+)

```go
// Generic function
func Filter[T any](slice []T, predicate func(T) bool) []T {
    var result []T
    for _, v := range slice {
        if predicate(v) {
            result = append(result, v)
        }
    }
    return result
}

nums := Filter([]int{1, 2, 3, 4, 5}, func(n int) bool { return n > 3 })
// [4, 5]

// Type constraint
type Number interface {
    ~int | ~int32 | ~int64 | ~float32 | ~float64
}

func Sum[T Number](nums []T) T {
    var total T
    for _, n := range nums {
        total += n
    }
    return total
}
```

---

## 7. Testing

```go
// math_test.go
package math

import "testing"

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    if result != 5 {
        t.Errorf("Add(2, 3) = %d; want 5", result)
    }
}

// Table-driven tests (idiomatic Go)
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 2, 3, 5},
        {"negative", -1, -2, -3},
        {"zero", 0, 0, 0},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

// Benchmarks
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}

// Run: go test ./... -v
// Benchmark: go test -bench=. -benchmem
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| No classes | Use structs + methods + interfaces |
| Interfaces | Implicit implementation. Duck typing. |
| Error handling | Return error as last value. `if err != nil` |
| Goroutines | Lightweight threads. `go func(){}()` |
| Channels | Communicate between goroutines. Unbuffered blocks. |
| Select | Switch for channels. Non-blocking with default. |
| Context | Cancellation, timeouts, request-scoped values |
| WaitGroup | Wait for multiple goroutines to finish |
| Mutex | Protect shared state. RWMutex for read-heavy. |
| Defer | Execute after function returns. LIFO order. |
| Slices | Dynamic arrays. append, copy, slice notation. |
| Maps | Key-value. val, ok := m[key]. delete(m, key). |
| Pointers | &var (address), *ptr (dereference). No pointer arithmetic. |
| Generics | func Fn[T constraint](arg T) T |
