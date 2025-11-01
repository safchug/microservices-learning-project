# 🔥 Kafka Event-Driven Architecture

## Overview

This project now includes **Apache Kafka** for event-driven communication between microservices. This demonstrates asynchronous, decoupled communication patterns.

## 📊 Architecture with Kafka

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 3000)                       │
└────────┬────────────────────────────────┬─────────────────────────┘
         │                                │
    ┌────▼─────┐                     ┌────▼──────┐
    │  User    │                     │  Product  │
    │ Service  │                     │  Service  │
    │ :3001    │                     │  :3002    │
    └────┬─────┘                     └────┬──────┘
         │                                │
         │  Publishes Events              │  Publishes Events
         │  ├─ user.created               │  ├─ product.created
         │  └─ user.updated               │  ├─ product.updated
         │                                │  └─ product.stock.changed
         │                                │
         └────────────┬───────────────────┘
                      │
              ┌───────▼────────┐
              │  Kafka Broker  │
              │    :9092       │
              │  ┌──────────┐  │
              │  │  Topics  │  │
              │  └──────────┘  │
              └───────┬────────┘
                      │
                      │ Consumes Events
                      │
              ┌───────▼──────────┐
              │   Notification   │
              │     Service      │
              │      :3003       │
              └──────────────────┘
                      │
                  Logs & Sends
                  Notifications
```

## 🎯 Kafka Topics

### User Events

**user.created**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "timestamp": "2025-11-01T10:00:00Z"
}
```

**user.updated**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "changes": {
    "age": 31
  },
  "timestamp": "2025-11-01T10:05:00Z"
}
```

### Product Events

**product.created**
```json
{
  "id": "mongodb-id",
  "name": "Laptop Pro",
  "category": "electronics",
  "price": 1299.99,
  "stock": 50,
  "timestamp": "2025-11-01T10:10:00Z"
}
```

**product.updated**
```json
{
  "id": "mongodb-id",
  "name": "Laptop Pro",
  "changes": {
    "price": 1199.99
  },
  "timestamp": "2025-11-01T10:15:00Z"
}
```

**product.stock.changed**
```json
{
  "id": "mongodb-id",
  "name": "Laptop Pro",
  "stock": 5,
  "timestamp": "2025-11-01T10:20:00Z"
}
```

## 🚀 Getting Started

### 1. Start Kafka Infrastructure

```bash
# Start all services including Kafka
docker-compose up -d

# Check Kafka is running
docker-compose ps kafka
docker-compose logs kafka
```

### 2. Install Dependencies

```bash
# Install kafkajs in services
cd services/user-service && npm install
cd ../product-service && npm install
cd ../notification-service && npm install
```

### 3. Start All Services

Open 4 terminals:

**Terminal 1 - Notification Service (start first to catch all events):**
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

## 🧪 Testing Kafka Events

### Test User Events

```bash
# Create a user (triggers user.created event)
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kafka-test@example.com",
    "firstName": "Kafka",
    "lastName": "Test",
    "age": 25
  }'

# Watch the Notification Service terminal for the event!
```

You should see in the Notification Service logs:
```
📨 [2025-11-01T10:00:00.000Z] Received event from topic: user.created
👤 New User Created!
   Email: kafka-test@example.com
   Name: Kafka Test
   📧 Sending welcome email to kafka-test@example.com...
```

### Test Product Events

```bash
# Create a product (triggers product.created event)
curl -X POST http://localhost:3002/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kafka Test Product",
    "description": "Testing Kafka event streaming",
    "price": 99.99,
    "category": "test",
    "stock": 5
  }'

# Update product stock (triggers product.updated AND product.stock.changed)
curl -X PATCH http://localhost:3002/products/PRODUCT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 2
  }'
```

Watch for multiple events in Notification Service:
```
📨 Received event from topic: product.created
📦 New Product Created!
   Product: Kafka Test Product
   Price: $99.99
   Stock: 5 units

📨 Received event from topic: product.stock.changed
📊 Product Stock Changed!
   Product: Kafka Test Product
   New Stock: 2 units
   ⚠️  LOW STOCK ALERT! Only 2 units remaining!
```

## 🔍 Kafka UI

Access the Kafka UI at **http://localhost:8080**

Features:
- View all topics
- Browse messages
- Monitor consumer groups
- Check broker health

## 📚 Key Concepts Demonstrated

### 1. **Event Publishing (Producer Pattern)**

Services publish events when important actions occur:

```typescript
// In User Service
await this.kafkaProducer.publishEvent('user.created', {
  id: user.id,
  email: user.email,
  // ... event data
});
```

### 2. **Event Consumption (Consumer Pattern)**

Notification Service subscribes to topics and processes events:

```typescript
await this.consumer.subscribe({ 
  topics: ['user.created', 'user.updated', 'product.created'],
  fromBeginning: false 
});
```

### 3. **Decoupling**

- User/Product services don't know about Notification Service
- Services can be added/removed without affecting others
- Events are persisted even if consumers are offline

### 4. **Asynchronous Communication**

- Non-blocking operations
- Services don't wait for event processing
- Better performance and scalability

## 🛠️ Kafka Commands

### Check Topics

```bash
# List all topics
docker exec -it microservices_kafka kafka-topics \
  --bootstrap-server localhost:9092 --list

# Describe a topic
docker exec -it microservices_kafka kafka-topics \
  --bootstrap-server localhost:9092 \
  --describe --topic user.created
```

### Consume Messages

```bash
# Read messages from a topic
docker exec -it microservices_kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic user.created \
  --from-beginning
```

### Producer Test

```bash
# Send a test message
docker exec -it microservices_kafka kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic test-topic
```

## 🎓 Learning Exercises

### Exercise 1: Add a New Event

1. Add a `user.deleted` event in User Service
2. Handle it in Notification Service
3. Test by deleting a user

### Exercise 2: Create an Analytics Service

1. Create a new service that consumes all events
2. Count events by type
3. Store analytics in Redis

### Exercise 3: Add Order Service

1. Create an Order microservice
2. Publish `order.created` events
3. Have Product Service listen and update stock
4. Have Notification Service send order confirmations

### Exercise 4: Implement Retry Logic

1. Add error handling in consumers
2. Implement dead letter queue pattern
3. Handle failed event processing

## 🐛 Troubleshooting

### Kafka Not Starting

```bash
# Check Zookeeper first
docker-compose logs zookeeper

# Check Kafka logs
docker-compose logs kafka

# Restart Kafka services
docker-compose restart zookeeper kafka
```

### Events Not Being Received

1. Check if consumer is connected:
```bash
docker exec -it microservices_kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 --list
```

2. Check consumer lag:
```bash
docker exec -it microservices_kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --describe --group notification-service-group
```

3. Verify topics exist:
```bash
docker exec -it microservices_kafka kafka-topics \
  --bootstrap-server localhost:9092 --list
```

### Connection Errors

- Ensure Kafka is using correct port (29092 for localhost)
- Check `.env` files have correct `KAFKA_BROKER` setting
- Wait 30-60 seconds after starting Kafka before starting services

## 📖 Additional Resources

- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Guide](https://kafka.js.org/docs/getting-started)
- [Event-Driven Architecture Patterns](https://martinfowler.com/articles/201701-event-driven.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)

## 🎯 Benefits You're Learning

1. **Scalability**: Add more consumers to handle load
2. **Reliability**: Events persist even if consumers fail
3. **Flexibility**: Easy to add new event handlers
4. **Decoupling**: Services are independent
5. **Audit Trail**: All events are logged
6. **Real-time Processing**: Instant event handling
7. **Data Integration**: Easy to sync data across services

---

**Next Steps**: Explore the code in each service's `/kafka` folder and experiment with creating your own events!
