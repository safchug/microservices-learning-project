# Microservices Learning Project

A comprehensive microservices architecture project using **Node.js**, **NestJS**, **MySQL**, **TypeORM**, **MongoDB**, **Mongoose**, **Redis**, **Elasticsearch**, and **Kafka**.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (Port 3000)                 │
│                   Unified REST API Entry Point               │
└───────────────┬──────────────────────┬──────────────────────┘
                │                      │
        ┌───────▼────────┐     ┌──────▼─────────┐
        │  User Service  │     │ Product Service │
        │   (Port 3001)  │     │   (Port 3002)   │
        │                │     │                 │
        │ • MySQL        │     │ • MongoDB       │
        │ • TypeORM      │     │ • Mongoose      │
        │ • TCP Transport│     │ • Redis Cache   │
        │ • Kafka Events │     │ • Elasticsearch │
        │                │     │ • TCP Transport │
        │                │     │ • Kafka Events  │
        └────────┬───────┘     └────────┬────────┘
                 │                      │
         ┌───────▼────────┐     ┌──────▼─────────┐
         │  MySQL DB      │     │   MongoDB      │
         │  (Port 3306)   │     │  (Port 27017)  │
         └────────────────┘     └────────────────┘
                 │                      │
         ┌───────┴──────────────────────┴──────────────────┐
         │                                                  │
         │              ┌────────────────┐                  │
         │              │  Kafka Broker  │                  │
         │              │  (Port 9092)   │                  │
         │              └────────┬───────┘                  │
         │                       │                          │
         │              ┌────────▼─────────┐               │
         │              │  Notification    │               │
         │              │    Service       │               │
         │              │  (Port 3003)     │               │
         │              └──────────────────┘               │
         │                                                  │
    ┌────▼─────┐   ┌─────▼──────┐   ┌─────▼──────┐   ┌───▼────┐
    │  Redis   │   │Elasticsearch│   │  Zookeeper │   │Kafka UI│
    │ (6379)   │   │   (9200)    │   │   (2181)   │   │ (8080) │
    └──────────┘   └────────────┘   └────────────┘   └────────┘
```

## 🎯 Learning Objectives

- **Microservices Architecture**: Service decomposition, inter-service communication
- **NestJS Framework**: Modern Node.js framework with TypeScript
- **Database Patterns**:
  - SQL (MySQL + TypeORM) for relational data
  - NoSQL (MongoDB + Mongoose) for document-based data
- **Caching Strategy**: Redis for performance optimization
- **Search Engine**: Elasticsearch for full-text search
- **Event-Driven Architecture**: Kafka for async messaging
- **API Gateway Pattern**: Single entry point for microservices
- **Message Patterns**: TCP-based and event-based communication

## 📁 Project Structure

```
microservices-learning-project/
├── services/
│   ├── user-service/          # User management with MySQL
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── users/
│   │   │       ├── entities/user.entity.ts
│   │   │       ├── dto/user.dto.ts
│   │   │       ├── users.controller.ts
│   │   │       ├── users.service.ts
│   │   │       └── users.module.ts
│   │   └── package.json
│   │
│   ├── product-service/       # Product management with MongoDB
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── products/
│   │   │       ├── schemas/product.schema.ts
│   │   │       ├── dto/product.dto.ts
│   │   │       ├── products.controller.ts
│   │   │       ├── products.service.ts
│   │   │       └── products.module.ts
│   │   └── package.json
│   │
│   └── api-gateway/           # API Gateway
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── users/
│       │   └── products/
│       └── package.json
│
├── docker-compose.yml         # Infrastructure services
├── package.json               # Root package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd learning-project

# Install dependencies for all services
npm run install:all
```

### 2. Start Infrastructure Services

```bash
# Start MySQL, MongoDB, Redis, and Elasticsearch
docker-compose up -d

# Check logs
docker-compose logs -f

# Wait for all services to be healthy (30-60 seconds)
```

### 3. Configure Environment Variables

Each service has a `.env.example` file. Copy them to `.env`:

```bash
# User Service
cp services/user-service/.env.example services/user-service/.env

# Product Service
cp services/product-service/.env.example services/product-service/.env

# API Gateway
cp services/api-gateway/.env.example services/api-gateway/.env
```

### 4. Start Microservices

Open 3 separate terminals:

```bash
# Terminal 1: User Service
npm run start:user

# Terminal 2: Product Service
npm run start:product

# Terminal 3: API Gateway
npm run start:gateway
```

## 📡 API Endpoints

### Via API Gateway (http://localhost:3000/api)

#### Users

```bash
# Get all users
GET http://localhost:3000/api/users

# Get user by ID
GET http://localhost:3000/api/users/:id
```

#### Products

```bash
# Get all products (with Redis caching)
GET http://localhost:3000/api/products

# Get product by ID (with Redis caching)
GET http://localhost:3000/api/products/:id

# Search products (Elasticsearch)
GET http://localhost:3000/api/products/search?query=laptop&category=electronics&minPrice=100&maxPrice=2000&page=1&limit=10
```

### Direct Service Access

#### User Service (http://localhost:3001)

```bash
# Create user
POST http://localhost:3001/users
Content-Type: application/json

{
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "age": 30
}

# Get all users
GET http://localhost:3001/users

# Get user by ID
GET http://localhost:3001/users/:id

# Update user
PATCH http://localhost:3001/users/:id
Content-Type: application/json

{
  "age": 31,
  "isActive": true
}

# Delete user
DELETE http://localhost:3001/users/:id
```

#### Product Service (http://localhost:3002)

```bash
# Create product
POST http://localhost:3002/products
Content-Type: application/json

{
  "name": "Laptop Pro 15",
  "description": "High-performance laptop with 16GB RAM and 512GB SSD",
  "price": 1299.99,
  "category": "electronics",
  "stock": 50,
  "tags": ["laptop", "computer", "tech"]
}

# Get all products
GET http://localhost:3002/products

# Search products
GET http://localhost:3002/products/search?query=laptop&category=electronics

# Get product by ID
GET http://localhost:3002/products/:id

# Update product
PATCH http://localhost:3002/products/:id

# Delete product
DELETE http://localhost:3002/products/:id
```

## 🧪 Testing the Services

### Test User Service

```bash
# Create a user
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "firstName": "Alice",
    "lastName": "Smith",
    "age": 28
  }'

# Get all users
curl http://localhost:3001/users
```

### Test Product Service with Caching

```bash
# Create a product
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic wireless mouse with USB receiver",
    "price": 29.99,
    "category": "accessories",
    "stock": 100,
    "tags": ["mouse", "wireless", "accessories"]
  }'

# First request - Cache MISS
curl http://localhost:3002/products

# Second request - Cache HIT (check service logs)
curl http://localhost:3002/products
```

### Test Elasticsearch Search

```bash
# Search for products
curl "http://localhost:3002/products/search?query=mouse&minPrice=10&maxPrice=50"

# Search by category
curl "http://localhost:3002/products/search?category=electronics"
```

## 🔧 Technology Deep Dive

### User Service - MySQL + TypeORM

**Key Concepts:**

- Entity definitions with decorators
- Repository pattern
- Database migrations
- Relations and joins

**Files to Study:**

- `services/user-service/src/users/entities/user.entity.ts` - Entity definition
- `services/user-service/src/users/users.service.ts` - Business logic
- `services/user-service/src/app.module.ts` - TypeORM configuration

### Product Service - MongoDB + Mongoose

**Key Concepts:**

- Schema definitions
- Document-based data modeling
- Mongoose middleware
- Text indexes for search

**Files to Study:**

- `services/product-service/src/products/schemas/product.schema.ts` - Schema definition
- `services/product-service/src/products/products.service.ts` - CRUD operations

### Redis Caching

**Key Concepts:**

- Cache-aside pattern
- TTL (Time To Live)
- Cache invalidation
- Performance optimization

**Implementation:**

- Check `ProductsService.findAll()` and `findOne()` methods
- Watch console logs for "Cache HIT" and "Cache MISS"

### Elasticsearch

**Key Concepts:**

- Full-text search
- Index creation and mapping
- Query DSL
- Filtering and pagination

**Implementation:**

- `ProductsService.search()` - Search implementation
- `initializeElasticsearchIndex()` - Index setup

### Microservice Communication

**Key Concepts:**

- TCP transport
- Message patterns
- Request-response pattern
- Event-driven architecture

**Files to Study:**

- `services/api-gateway/src/app.module.ts` - Client setup
- `services/user-service/src/users/users.controller.ts` - Message patterns

## 🐳 Docker Services

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Restart a specific service
docker-compose restart mysql
```

### Access Database Clients

**MySQL:**

```bash
docker exec -it microservices_mysql mysql -u user -ppassword123 userdb
```

**MongoDB:**

```bash
docker exec -it microservices_mongo mongosh -u admin -p admin123 --authenticationDatabase admin
```

**Redis:**

```bash
docker exec -it microservices_redis redis-cli
```

**Elasticsearch:**

```bash
# Check cluster health
curl http://localhost:9200/_cluster/health

# View all indices
curl http://localhost:9200/_cat/indices?v
```

**Kibana:**
Open http://localhost:5601 in your browser

## 📚 Learning Resources

### NestJS

- [Official Documentation](https://docs.nestjs.com/)
- [Microservices Guide](https://docs.nestjs.com/microservices/basics)

### TypeORM

- [Official Documentation](https://typeorm.io/)
- [Entity Relations](https://typeorm.io/relations)

### Mongoose

- [Official Documentation](https://mongoosejs.com/)
- [Schema Guide](https://mongoosejs.com/docs/guide.html)

### Redis

- [Redis Caching Patterns](https://redis.io/docs/manual/patterns/)
- [NestJS Cache Manager](https://docs.nestjs.com/techniques/caching)

### Elasticsearch

- [Getting Started](https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html)
- [Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)

## 🎓 Next Steps

1. **Add Authentication**: Implement JWT auth in API Gateway
2. **Add Message Queue**: Use RabbitMQ or Kafka for async communication
3. **Add Logging**: Implement centralized logging with ELK stack
4. **Add Monitoring**: Use Prometheus + Grafana
5. **Add Testing**: Unit tests, integration tests, E2E tests
6. **Add CI/CD**: GitHub Actions or GitLab CI
7. **Kubernetes**: Deploy to Kubernetes cluster

## 🐛 Troubleshooting

### Services won't start

- Check if Docker containers are running: `docker-compose ps`
- Check logs: `docker-compose logs -f`
- Ensure ports are not in use: 3000, 3001, 3002, 3306, 27017, 6379, 9200

### Database connection errors

- Wait for containers to be fully ready (30-60 seconds)
- Check environment variables in `.env` files
- Verify Docker container health: `docker-compose ps`

### Elasticsearch not working

- Check if index exists: `curl http://localhost:9200/_cat/indices?v`
- Check Elasticsearch logs: `docker-compose logs elasticsearch`
- Elasticsearch needs at least 2GB RAM

## 📝 License

MIT

## 🤝 Contributing

Feel free to fork, learn, and experiment!

---

**Happy Learning! 🚀**
