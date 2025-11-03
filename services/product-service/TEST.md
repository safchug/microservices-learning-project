# Product Service - Integration Tests

## Overview

This document describes the integration tests for the Product Service, covering REST endpoints, caching behavior, Elasticsearch search, and Kafka event publishing.

## Test Coverage

### 1. **CRUD Operations**
- ✅ Create product with valid data
- ✅ Create product with invalid data (validation)
- ✅ Get all products
- ✅ Get product by ID
- ✅ Update product
- ✅ Delete product
- ✅ Error handling (404, 400)

### 2. **Caching (Redis)**
- ✅ Cache hit on repeated requests
- ✅ Cache miss on first request
- ✅ Cache invalidation after update
- ✅ Cache invalidation after delete

### 3. **Search (Elasticsearch)**
- ✅ Search by query text
- ✅ Search by category
- ✅ Search with price range
- ✅ Pagination support
- ✅ Fallback to MongoDB if Elasticsearch fails

### 4. **Event Publishing (Kafka)**
- ✅ Publish `product.created` event
- ✅ Publish `product.updated` event
- ✅ Publish `product.stock.changed` event

## Prerequisites

Before running tests, ensure:

1. **Docker services are running:**
   ```bash
   docker-compose up -d
   ```

2. **Test database is available:**
   The tests use `productdb-test` MongoDB database to avoid affecting production data.

3. **Elasticsearch is running:**
   Tests require Elasticsearch at `http://localhost:9200`

4. **Redis is running:**
   Tests use Redis for caching at `localhost:6379`

## Running Tests

### Unit Tests

Run unit tests for the ProductsService:

```bash
cd services/product-service
npm test
```

Run with coverage:

```bash
npm run test:cov
```

Run in watch mode:

```bash
npm run test:watch
```

### Integration Tests (E2E)

Run end-to-end tests:

```bash
cd services/product-service
npm run test:e2e
```

## Test Structure

### Unit Tests (`products.service.spec.ts`)

Tests the service logic in isolation with mocked dependencies:
- MongoDB Model
- Redis Cache Manager
- Elasticsearch Service
- Kafka Producer

**Key test scenarios:**
- Product creation with event publishing
- Caching behavior (cache hit/miss)
- Cache invalidation on update/delete
- Search with Elasticsearch
- Fallback to MongoDB on Elasticsearch failure
- Error handling (NotFoundException)

### Integration Tests (`products.e2e-spec.ts`)

Tests the full HTTP request/response cycle:
- Real HTTP requests via Supertest
- Real MongoDB connection (test database)
- Real Redis caching
- Real Elasticsearch integration
- Kafka event publishing

**Test flow:**
1. Create a product → Verify response
2. Fetch all products → Check caching
3. Fetch single product → Check caching
4. Update product → Verify cache invalidation
5. Search products → Verify Elasticsearch
6. Delete product → Cleanup

## Test Environment Variables

Create a `.env.test` file in the product-service directory:

```bash
# MongoDB Test Database
MONGO_URI_TEST=mongodb://admin:admin123@localhost:27017/productdb-test?authSource=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=5

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=products-test

# Kafka
KAFKA_BROKER=localhost:29092
KAFKA_CLIENT_ID=product-service-test
```

## Understanding Test Results

### Successful Test Output

```
PASS  test/products.e2e-spec.ts
  ProductsController (e2e)
    POST /products
      ✓ should create a new product (250ms)
      ✓ should fail with invalid data (50ms)
    GET /products
      ✓ should return all products (100ms)
    GET /products/:id
      ✓ should return a product by id (75ms)
      ✓ should return 404 for non-existent product (30ms)
    PATCH /products/:id
      ✓ should update a product (150ms)
    GET /products/search
      ✓ should search products by query (2000ms)
      ✓ should search with price range (100ms)
    DELETE /products/:id
      ✓ should delete a product (100ms)
    Caching
      ✓ should cache product on first request (200ms)
      ✓ should invalidate cache after update (250ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

### Common Test Failures

**1. MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure Docker Compose is running: `docker-compose up -d`

**2. Elasticsearch Timeout**
```
Error: Elasticsearch cluster is not available
```
**Solution:** Wait for Elasticsearch to be fully ready (30-60 seconds after starting)

**3. Redis Connection Error**
```
Error: Redis connection to localhost:6379 failed
```
**Solution:** Check Redis container: `docker-compose logs redis`

## Debugging Tests

### Run tests with verbose output:

```bash
npm run test:e2e -- --verbose
```

### Run specific test file:

```bash
npm test -- products.service.spec.ts
```

### Run specific test suite:

```bash
npm test -- --testNamePattern="ProductsService"
```

### View test coverage report:

```bash
npm run test:cov
open coverage/lcov-report/index.html
```

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:7.0
        env:
          MONGO_INITDB_ROOT_USERNAME: admin
          MONGO_INITDB_ROOT_PASSWORD: admin123
        ports:
          - 27017:27017
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
      
      elasticsearch:
        image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        env:
          discovery.type: single-node
          xpack.security.enabled: false
        ports:
          - 9200:9200
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd services/product-service && npm install
      
      - name: Run unit tests
        run: cd services/product-service && npm test
      
      - name: Run integration tests
        run: cd services/product-service && npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./services/product-service/coverage
```

## Best Practices

1. **Isolate test data:** Use a separate test database
2. **Clean up after tests:** Remove test data in `afterAll` hooks
3. **Mock external dependencies:** Mock Kafka, emails, external APIs
4. **Test error scenarios:** Test validation, not found, etc.
5. **Keep tests fast:** Use in-memory databases for unit tests
6. **Test one thing at a time:** Each test should verify one behavior
7. **Use descriptive test names:** Clearly state what is being tested

## Next Steps

1. **Add more test scenarios:**
   - Concurrent requests
   - Large datasets
   - Rate limiting
   - Authentication/authorization

2. **Add performance tests:**
   - Load testing with Artillery or k6
   - Measure response times
   - Test cache effectiveness

3. **Add contract tests:**
   - Verify API contract with consumers
   - Use Pact or similar tools

4. **Add mutation tests:**
   - Use Stryker to verify test quality

---

**Happy Testing! 🧪**
