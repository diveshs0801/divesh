# gRPC — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is gRPC?
High-performance RPC (Remote Procedure Call) framework by Google. Uses HTTP/2 and Protocol Buffers (protobuf) for binary serialization.

### Q: REST vs gRPC

| Feature | REST | gRPC |
|---------|------|------|
| Protocol | HTTP/1.1 (usually) | HTTP/2 |
| Payload | JSON (text) | Protobuf (binary) |
| Contract | OpenAPI/Swagger (optional) | .proto files (required, strict) |
| Streaming | Limited (SSE) | Bidirectional streaming |
| Performance | Slower (text parsing) | 5-10x faster (binary) |
| Code gen | Optional | Built-in (multiple languages) |
| Browser support | Native | Needs gRPC-Web proxy |
| Use case | Public APIs | Internal microservice communication |

---

## 2. Protocol Buffers (Protobuf)

```protobuf
// user.proto
syntax = "proto3";

package user;

// Service definition
service UserService {
  // Unary RPC (request-response)
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
  rpc DeleteUser(DeleteUserRequest) returns (Empty);
  
  // Server streaming
  rpc ListUsers(ListUsersRequest) returns (stream UserResponse);
  
  // Client streaming
  rpc UploadLocations(stream LocationUpdate) returns (UploadSummary);
  
  // Bidirectional streaming
  rpc TrackDriver(stream LocationUpdate) returns (stream DriverStatus);
}

// Messages
message GetUserRequest {
  int32 id = 1;
}

message GetUserResponse {
  int32 id = 1;
  string name = 2;
  string email = 3;
  Role role = 4;
  repeated string skills = 5;   // Array
  google.protobuf.Timestamp created_at = 6;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
  optional string phone = 3;    // Optional field
}

enum Role {
  ROLE_UNSPECIFIED = 0;
  ROLE_USER = 1;
  ROLE_ADMIN = 2;
}

message Empty {}
```

---

## 3. Streaming Types

```
1. Unary: Client sends 1 request → Server returns 1 response
   rpc GetUser(Request) returns (Response);

2. Server Streaming: Client sends 1 request → Server returns stream of responses
   rpc ListUsers(Request) returns (stream Response);
   Use case: Live feed, pagination, large result sets

3. Client Streaming: Client sends stream → Server returns 1 response
   rpc UploadLocations(stream Location) returns (Summary);
   Use case: Batch uploads, file uploads

4. Bidirectional Streaming: Both stream simultaneously
   rpc Chat(stream Message) returns (stream Message);
   Use case: Real-time chat, GPS tracking
```

---

## 4. Go gRPC Server (Your ERP Project)

```go
// Server implementation
type UserServer struct {
    pb.UnimplementedUserServiceServer
    db *sql.DB
}

func (s *UserServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    user, err := s.db.QueryRow("SELECT id, name, email FROM users WHERE id = $1", req.Id)
    if err != nil {
        return nil, status.Errorf(codes.NotFound, "user %d not found", req.Id)
    }
    
    return &pb.GetUserResponse{
        Id:    user.ID,
        Name:  user.Name,
        Email: user.Email,
    }, nil
}

func (s *UserServer) ListUsers(req *pb.ListUsersRequest, stream pb.UserService_ListUsersServer) error {
    rows, _ := s.db.Query("SELECT id, name, email FROM users")
    defer rows.Close()
    
    for rows.Next() {
        var user pb.UserResponse
        rows.Scan(&user.Id, &user.Name, &user.Email)
        if err := stream.Send(&user); err != nil {
            return err
        }
    }
    return nil
}

// Main
func main() {
    lis, _ := net.Listen("tcp", ":50051")
    grpcServer := grpc.NewServer(
        grpc.UnaryInterceptor(loggingInterceptor),
    )
    pb.RegisterUserServiceServer(grpcServer, &UserServer{db: db})
    grpcServer.Serve(lis)
}

// Interceptor (middleware)
func loggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    log.Printf("%s | %v | %v", info.FullMethod, time.Since(start), err)
    return resp, err
}
```

---

## 5. Error Handling (gRPC Status Codes)

| Code | Name | HTTP Equivalent |
|------|------|----------------|
| 0 | OK | 200 |
| 1 | CANCELLED | 499 |
| 2 | UNKNOWN | 500 |
| 3 | INVALID_ARGUMENT | 400 |
| 5 | NOT_FOUND | 404 |
| 6 | ALREADY_EXISTS | 409 |
| 7 | PERMISSION_DENIED | 403 |
| 13 | INTERNAL | 500 |
| 14 | UNAVAILABLE | 503 |
| 16 | UNAUTHENTICATED | 401 |

```go
import "google.golang.org/grpc/status"
import "google.golang.org/grpc/codes"

return nil, status.Errorf(codes.NotFound, "user %d not found", id)
return nil, status.Errorf(codes.InvalidArgument, "name is required")
return nil, status.Errorf(codes.Internal, "database error: %v", err)
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Protobuf | Binary serialization. .proto files define contract. |
| HTTP/2 | Multiplexed streams, header compression, binary framing. |
| Unary | 1 request → 1 response. Most common. |
| Streaming | Server/Client/Bidirectional. Real-time data. |
| Code gen | Auto-generate client/server code from .proto files. |
| Interceptor | Middleware for gRPC (logging, auth, metrics). |
| Status codes | NOT_FOUND, INVALID_ARGUMENT, INTERNAL, UNAUTHENTICATED. |
| When to use | Internal microservice calls. High performance. Strict contracts. |
| When NOT to | Public APIs (use REST), browser clients (needs proxy). |
