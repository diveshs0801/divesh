# NestJS — Complete Interview Guide

---

## 1. Core Concepts

### Q: What is NestJS?

NestJS is a progressive Node.js framework for building efficient, scalable server-side applications. Built with TypeScript, inspired by Angular's architecture.

**Key features:**
- **Modular architecture** (Modules, Controllers, Providers)
- **Dependency Injection** (IoC container)
- **Decorators** for routing, validation, middleware
- Built on **Express** (or Fastify) under the hood
- First-class support for **microservices**, **WebSockets**, **GraphQL**

---

### Q: NestJS Application Architecture

```
AppModule (root)
├── UsersModule
│   ├── UsersController   ← handles HTTP requests
│   ├── UsersService      ← business logic
│   └── UsersRepository   ← data access
├── AuthModule
│   ├── AuthController
│   ├── AuthService
│   └── JwtStrategy
└── SharedModule
    ├── LoggerService
    └── CacheService
```

**Request Lifecycle:**
```
Client Request
  → Middleware
    → Guards
      → Interceptors (before)
        → Pipes (validation/transformation)
          → Controller Route Handler
        → Interceptors (after)
      → Exception Filters
  → Response
```

---

## 2. Modules

### Q: What are Modules in NestJS?

Modules organize the application into logical units. Every NestJS app has at least one module (root module).

```typescript
import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Import other modules
  controllers: [UsersController],               // Route handlers
  providers: [UsersService],                    // Injectable services
  exports: [UsersService],                      // Make available to other modules
})
export class UsersModule {}

// Root Module
@Module({
  imports: [
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      database: "mydb",
      entities: [User],
      synchronize: false, // ❌ Never true in production
    }),
  ],
})
export class AppModule {}
```

### Q: What is a Dynamic Module?

A module whose behavior can be configured at import time.

```typescript
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        { provide: "DATABASE_OPTIONS", useValue: options },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}

// Usage:
@Module({
  imports: [DatabaseModule.forRoot({ host: "localhost", port: 5432 })],
})
export class AppModule {}
```

### Q: Global Module vs Regular Module

```typescript
// Global — available everywhere, no need to import in every module
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
// Use sparingly — makes dependencies less explicit
```

---

## 3. Controllers

### Q: What is a Controller?

Controllers handle incoming HTTP requests and return responses.

```typescript
import {
  Controller, Get, Post, Put, Delete, Patch,
  Param, Body, Query, Headers, Req, Res,
  HttpCode, HttpStatus, ParseIntPipe, UsePipes,
  ValidationPipe,
} from "@nestjs/common";

@Controller("users") // Route prefix: /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {} // DI

  // GET /users
  @Get()
  findAll(@Query("page") page: number, @Query("limit") limit: number) {
    return this.usersService.findAll({ page, limit });
  }

  // GET /users/:id
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // POST /users
  @Post()
  @HttpCode(HttpStatus.CREATED) // 201
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // PUT /users/:id
  @Put(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  // DELETE /users/:id
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT) // 204
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  // Access full request/response objects
  @Get("raw")
  rawAccess(@Req() req: Request, @Res() res: Response) {
    res.status(200).json({ message: "Raw access" });
  }
}
```

---

## 4. Providers & Dependency Injection

### Q: What is Dependency Injection?

DI is a design pattern where a class receives its dependencies from external sources rather than creating them itself. NestJS has a built-in IoC container.

```typescript
// Service (Provider)
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly cacheService: CacheService, // Auto-injected by NestJS
  ) {}

  async findAll(): Promise<User[]> {
    const cached = await this.cacheService.get("users");
    if (cached) return cached;
    
    const users = await this.userRepo.find();
    await this.cacheService.set("users", users, 300);
    return users;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }
}
```

### Q: Custom Providers

```typescript
// useValue — provide a constant value
{ provide: "API_KEY", useValue: "my-secret-key" }

// useClass — provide a class (conditionally)
{
  provide: LoggerService,
  useClass: process.env.NODE_ENV === "production"
    ? ProductionLogger
    : DevelopmentLogger,
}

// useFactory — provide via factory function (async supported)
{
  provide: "DATABASE_CONNECTION",
  useFactory: async (configService: ConfigService) => {
    const options = configService.get("database");
    return createConnection(options);
  },
  inject: [ConfigService], // Dependencies for the factory
}

// useExisting — alias one provider to another
{ provide: "AliasedLogger", useExisting: LoggerService }

// Inject custom provider
@Injectable()
export class ApiService {
  constructor(@Inject("API_KEY") private apiKey: string) {}
}
```

### Q: Provider Scopes

```typescript
// DEFAULT — Singleton (shared across entire application)
@Injectable() // or @Injectable({ scope: Scope.DEFAULT })
export class SingletonService {} // One instance, shared everywhere

// REQUEST — New instance per HTTP request
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject(REQUEST) private request: Request) {}
}

// TRANSIENT — New instance every time it's injected
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {} // Fresh instance for each consumer
```

---

## 5. Middleware

### Q: What is Middleware?

Functions that execute BEFORE the route handler. Has access to request, response, and `next()`.

```typescript
// Functional middleware
export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}

// Class-based middleware
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {} // DI works!
  
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new UnauthorizedException("Token missing");
    
    req["user"] = this.authService.verifyToken(token);
    next();
  }
}

// Apply in module
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware, loggerMiddleware)
      .exclude({ path: "auth/login", method: RequestMethod.POST })
      .forRoutes("*"); // or specific controller/routes
  }
}
```

---

## 6. Guards

### Q: What are Guards? How do they differ from Middleware?

Guards determine whether a request should be handled by the route handler. They have access to the **ExecutionContext** (know which handler will run).

```typescript
// Auth Guard
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Check for @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(" ")[1];
    
    if (!token) throw new UnauthorizedException("No token");
    
    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

// Roles Guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Custom decorators
export const Public = () => SetMetadata("isPublic", true);
export const Roles = (...roles: string[]) => SetMetadata("roles", roles);

// Usage
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get("dashboard")
  @Roles("admin", "superadmin")
  getDashboard() {
    return { message: "Admin dashboard" };
  }

  @Get("health")
  @Public()
  healthCheck() {
    return { status: "ok" };
  }
}

// Global guard
app.useGlobalGuards(new JwtAuthGuard());
```

**Middleware vs Guard:**
| Middleware | Guard |
|-----------|-------|
| No knowledge of what handler runs next | Has ExecutionContext (knows handler/class) |
| Can't access metadata/decorators | Can access metadata via Reflector |
| General-purpose (logging, CORS) | Authorization/access control |

---

## 7. Pipes

### Q: What are Pipes?

Pipes transform or validate input data BEFORE it reaches the route handler.

```typescript
// Built-in pipes:
// ParseIntPipe, ParseBoolPipe, ParseUUIDPipe, ParseArrayPipe,
// ParseEnumPipe, ParseFloatPipe, DefaultValuePipe, ValidationPipe

@Get(":id")
findOne(@Param("id", ParseIntPipe) id: number) {
  // id is guaranteed to be a number. If not parseable → 400 Bad Request.
}

@Get()
findAll(
  @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
) {}

// ValidationPipe with class-validator DTOs
// npm install class-validator class-transformer
import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from "class-validator";

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

// Apply globally (recommended)
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // Strip properties not in DTO
    forbidNonWhitelisted: true, // Throw if extra properties sent
    transform: true,        // Auto-transform types (query strings → numbers)
  }),
);

// Custom Pipe
@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string, metadata: ArgumentMetadata): Date {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date: ${value}`);
    }
    return date;
  }
}
```

---

## 8. Interceptors

### Q: What are Interceptors?

Interceptors have the ability to:
- Execute logic **before** AND **after** the route handler
- **Transform** the result returned from a handler
- **Extend** or **override** behavior
- Handle **timing**, **logging**, **caching**, **response mapping**

```typescript
// Logging Interceptor — measure execution time
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        console.log(`${method} ${url} — ${Date.now() - now}ms`);
      }),
    );
  }
}

// Transform Response Interceptor — wrap all responses
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// Cache Interceptor
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const key = context.switchToHttp().getRequest().url;
    const cached = await this.cacheService.get(key);
    if (cached) return of(cached);
    
    return next.handle().pipe(
      tap((data) => this.cacheService.set(key, data, 60)),
    );
  }
}

// Timeout Interceptor
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      timeout(5000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException();
        }
        throw err;
      }),
    );
  }
}

// Apply
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
@Controller("users")
export class UsersController {}

// Global
app.useGlobalInterceptors(new LoggingInterceptor());
```

---

## 9. Exception Filters

### Q: How does error handling work in NestJS?

```typescript
// Built-in HTTP exceptions:
throw new BadRequestException("Invalid data");        // 400
throw new UnauthorizedException("Not authenticated"); // 401
throw new ForbiddenException("Access denied");        // 403
throw new NotFoundException("Resource not found");     // 404
throw new ConflictException("Already exists");        // 409
throw new InternalServerErrorException("Server error"); // 500

// Custom Exception Filter — catch and format all errors
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === "string"
        ? exceptionResponse
        : (exceptionResponse as any).message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

// Apply
app.useGlobalFilters(new AllExceptionsFilter());
```

---

## 10. Microservices in NestJS

### Q: How does NestJS support microservices?

```typescript
// main.ts — Microservice with TCP transport
import { NestFactory } from "@nestjs/core";
import { Transport, MicroserviceOptions } from "@nestjs/microservices";

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.TCP,
  options: { host: "0.0.0.0", port: 3001 },
});
await app.listen();

// Hybrid app (HTTP + Microservice)
const app = await NestFactory.create(AppModule);
app.connectMicroservice({
  transport: Transport.KAFKA,
  options: {
    client: { brokers: ["localhost:9092"] },
    consumer: { groupId: "my-consumer-group" },
  },
});
await app.startAllMicroservices();
await app.listen(3000);

// Message Patterns (Request-Response)
@Controller()
export class OrdersController {
  @MessagePattern("orders.create") // TCP/Redis/NATS
  createOrder(@Payload() data: CreateOrderDto) {
    return this.ordersService.create(data);
  }
}

// Event Patterns (Fire-and-Forget)
@Controller()
export class NotificationsController {
  @EventPattern("order.created") // Kafka/RabbitMQ
  handleOrderCreated(@Payload() data: OrderCreatedEvent) {
    this.notificationService.sendEmail(data);
    // No return value — fire and forget
  }
}

// Client — sending messages to microservices
@Injectable()
export class GatewayService {
  constructor(
    @Inject("ORDERS_SERVICE") private ordersClient: ClientProxy,
  ) {}

  createOrder(dto: CreateOrderDto) {
    // Request-Response
    return this.ordersClient.send("orders.create", dto);
  }

  notifyOrderCreated(event: OrderCreatedEvent) {
    // Fire-and-Forget
    this.ordersClient.emit("order.created", event);
  }
}

// Register client in module
@Module({
  imports: [
    ClientsModule.register([
      {
        name: "ORDERS_SERVICE",
        transport: Transport.KAFKA,
        options: {
          client: { brokers: ["localhost:9092"] },
        },
      },
    ]),
  ],
})
export class GatewayModule {}
```

---

## 11. WebSockets in NestJS

```typescript
import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/tracking",
})
export class TrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    console.log("WebSocket Gateway initialized");
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("location:update")
  handleLocationUpdate(
    @MessageBody() data: { lat: number; lng: number; driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast to room
    this.server.to(`ride:${data.driverId}`).emit("driver:location", data);
    return { event: "ack", data: "Location updated" };
  }

  // Emit from service (inject gateway)
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }
}
```

---

## 12. Testing

```typescript
// Unit Test
describe("UsersService", () => {
  let service: UsersService;
  let repo: MockType<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          }),
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  it("should find all users", async () => {
    const users = [{ id: 1, name: "Divesh" }];
    repo.find.mockResolvedValue(users);
    
    const result = await service.findAll();
    expect(result).toEqual(users);
    expect(repo.find).toHaveBeenCalled();
  });

  it("should throw NotFoundException", async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});

// E2E Test
describe("UsersController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  it("POST /users", () => {
    return request(app.getHttpServer())
      .post("/users")
      .send({ name: "Divesh", email: "d@e.com", password: "12345678" })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe("Divesh");
      });
  });

  afterAll(() => app.close());
});
```

---

## Request Lifecycle Summary

```
Incoming Request
  │
  ▼
Middleware (global → module → route)
  │
  ▼
Guards (global → controller → route)
  │
  ▼
Interceptors — BEFORE (global → controller → route)
  │
  ▼
Pipes (global → controller → route → param-level)
  │
  ▼
Route Handler (Controller method)
  │
  ▼
Interceptors — AFTER (route → controller → global)
  │
  ▼
Exception Filters (route → controller → global) — if error thrown
  │
  ▼
Response sent to client
```

---

## Quick Revision

| Concept | Key Point |
|---------|-----------|
| Module | Organizes app into units. imports/controllers/providers/exports |
| Controller | Handles HTTP requests via decorators (@Get, @Post, etc.) |
| Provider | Injectable service. DI via constructor. |
| Middleware | Runs before handler. Has req/res/next. No execution context. |
| Guard | Auth/access control. Has ExecutionContext. Returns boolean. |
| Pipe | Validate/transform input before handler. |
| Interceptor | Before + after handler. Transform response, logging, caching. |
| Exception Filter | Catch and format errors. |
| Scope | DEFAULT=singleton, REQUEST=per-request, TRANSIENT=per-injection |
| Microservice | @MessagePattern (req/res), @EventPattern (fire & forget) |
