# 🚀 Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

Each service needs its dependencies installed:

```bash
# User Service
cd services/user-service
npm install
cd ../..

# Product Service
cd services/product-service
npm install
cd ../..

# API Gateway
cd services/api-gateway
npm install
cd ../..
```

Or use the convenience script:
```bash
npm run install:all
```

### 2. Start Infrastructure

Start all backend services (MySQL, MongoDB, Redis, Elasticsearch):

```bash
docker-compose up -d
```

Wait 30-60 seconds for all services to initialize. Check status:

```bash
docker-compose ps
```

All services should show "Up" status.

### 3. Configure Environment

Copy example environment files:

```bash
cp services/user-service/.env.example services/user-service/.env
cp services/product-service/.env.example services/product-service/.env
cp services/api-gateway/.env.example services/api-gateway/.env
```

The default values work with Docker Compose setup.

### 4. Start Microservices

Open four terminal windows:

**Terminal 1 - Notification Service (start first to catch events):**
```bash
cd services/notification-service
npm run start:dev
```

**Terminal 2 - User Service:**
```bash
cd services/user-service
npm run start:dev
```

**Terminal 3 - Product Service:**
```bash
cd services/product-service
npm run start:dev
```

**Terminal 4 - API Gateway:**
```bash
cd services/api-gateway
npm run start:dev
```

### 5. Verify Everything Works

Check that all services are running:

- User Service: http://localhost:3001/users
- Product Service: http://localhost:3002/products  
- API Gateway: http://localhost:3000/api/users
- Notification Service: http://localhost:3003
- Kafka UI: http://localhost:8080

## 🔥 Testing Kafka Events

### Watch Event Flow

Keep the Notification Service terminal visible and create a user:

```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kafka@example.com",
    "firstName": "Kafka",
    "lastName": "User",
    "age": 25
  }'
```

You should see the event appear in the Notification Service logs immediately!

**See KAFKA.md for detailed Kafka documentation and examples.**

## 📋 Quick Test Commands

### Create Test Data

**Create a User:**
```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "age": 25
  }'
```

**Create a Product:**
```bash
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "This is a test product for learning microservices",
    "price": 99.99,
    "category": "test",
    "stock": 10,
    "tags": ["test", "demo"]
  }'
```

### Test Caching

```bash
# First request (Cache MISS - check service logs)
curl http://localhost:3002/products

# Second request (Cache HIT - check service logs)
curl http://localhost:3002/products
```

### Test Search

```bash
# Search products
curl "http://localhost:3002/products/search?query=test"
```

### Test via API Gateway

```bash
# Get all users through gateway
curl http://localhost:3000/api/users

# Get all products through gateway
curl http://localhost:3000/api/products
```

## 🔧 Useful Commands

### Docker

```bash
# View logs of all services
docker-compose logs -f

# View logs of specific service
docker-compose logs -f mysql
docker-compose logs -f mongodb
docker-compose logs -f redis
docker-compose logs -f elasticsearch

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### Database Access

**MySQL:**
```bash
docker exec -it microservices_mysql mysql -u user -ppassword123 userdb
```

**MongoDB:**
```bash
docker exec -it microservices_mongo mongosh -u admin -p admin123 --authenticationDatabase admin
use productdb
db.products.find().pretty()
```

**Redis:**
```bash
docker exec -it microservices_redis redis-cli
KEYS *
GET all_products
```

### Elasticsearch

```bash
# Check health
curl http://localhost:9200/_cluster/health?pretty

# List indices
curl http://localhost:9200/_cat/indices?v

# View products index
curl http://localhost:9200/products/_search?pretty

# Search products
curl -X POST http://localhost:9200/products/_search?pretty \
  -H "Content-Type: application/json" \
  -d '{"query": {"match_all": {}}}'
```

## 🐛 Common Issues

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find process using port
lsof -ti:3001
lsof -ti:3306

# Kill process (replace PID with actual process ID)
kill -9 <PID>
```

### Docker Services Not Starting

```bash
# Check Docker is running
docker ps

# Restart Docker Desktop if needed

# Remove old containers
docker-compose down -v
docker-compose up -d
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf services/*/node_modules
npm run install:all
```

### Elasticsearch Memory Issues

Elasticsearch requires at least 2GB RAM. If it fails to start:

```bash
# Check Docker Desktop resources
# Go to Docker Desktop > Settings > Resources
# Increase Memory to at least 4GB
```

## 📊 Monitoring

### Check Service Health

```bash
# User Service
curl http://localhost:3001/users

# Product Service
curl http://localhost:3002/products

# API Gateway
curl http://localhost:3000/api/users
```

### View Infrastructure Status

```bash
# All containers
docker-compose ps

# Resource usage
docker stats
```

### Kibana Dashboard

Open http://localhost:5601 in your browser to visualize Elasticsearch data.

## 🎯 What to Learn Next

1. **Explore the code** - Read through each service's implementation
2. **Modify endpoints** - Add new features to understand the flow
3. **Test patterns** - Observe caching, search, and communication patterns
4. **Database queries** - Connect to databases and explore the data
5. **Scale services** - Try running multiple instances
6. **Add features** - Implement your own microservice

---

Need help? Check the main README.md for more details!
