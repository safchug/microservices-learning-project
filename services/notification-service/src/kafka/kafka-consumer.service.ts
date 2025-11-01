import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, logLevel } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
      logLevel: logLevel.ERROR,
    });

    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || 'notification-service-group',
    });
  }

  async onModuleInit() {
    await this.consumer.connect();
    console.log('✅ Kafka Consumer connected');

    // Subscribe to topics
    await this.consumer.subscribe({
      topics: [
        'user.created',
        'user.updated',
        'product.created',
        'product.updated',
        'product.stock.changed',
      ],
      fromBeginning: false,
    });

    // Start consuming messages
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value?.toString();
        if (value) {
          const event = JSON.parse(value);
          await this.handleEvent(topic, event);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    console.log('❌ Kafka Consumer disconnected');
  }

  private async handleEvent(topic: string, event: any): Promise<void> {
    console.log(
      `\n📨 [${new Date().toISOString()}] Received event from topic: ${topic}`,
    );

    switch (topic) {
      case 'user.created':
        await this.handleUserCreated(event);
        break;
      case 'user.updated':
        await this.handleUserUpdated(event);
        break;
      case 'product.created':
        await this.handleProductCreated(event);
        break;
      case 'product.updated':
        await this.handleProductUpdated(event);
        break;
      case 'product.stock.changed':
        await this.handleProductStockChanged(event);
        break;
      default:
        console.log('⚠️  Unknown event type:', topic);
    }
  }

  private async handleUserCreated(event: any): Promise<void> {
    console.log('👤 New User Created!');
    console.log(`   Email: ${event.email}`);
    console.log(`   Name: ${event.firstName} ${event.lastName}`);
    console.log(`   📧 Sending welcome email to ${event.email}...`);
    // In real app: Send actual email via SendGrid, AWS SES, etc.
  }

  private async handleUserUpdated(event: any): Promise<void> {
    console.log('✏️  User Updated!');
    console.log(`   User ID: ${event.id}`);
    console.log(`   Email: ${event.email}`);
    console.log(`   Changes:`, JSON.stringify(event.changes, null, 2));
    console.log(`   📧 Notifying user about profile update...`);
  }

  private async handleProductCreated(event: any): Promise<void> {
    console.log('📦 New Product Created!');
    console.log(`   Product: ${event.name}`);
    console.log(`   Category: ${event.category}`);
    console.log(`   Price: $${event.price}`);
    console.log(`   Stock: ${event.stock} units`);
    console.log(`   📢 Notifying subscribers about new product...`);
  }

  private async handleProductUpdated(event: any): Promise<void> {
    console.log('🔄 Product Updated!');
    console.log(`   Product: ${event.name}`);
    console.log(`   Changes:`, JSON.stringify(event.changes, null, 2));
    console.log(`   📢 Updating product watchers...`);
  }

  private async handleProductStockChanged(event: any): Promise<void> {
    console.log('📊 Product Stock Changed!');
    console.log(`   Product: ${event.name}`);
    console.log(`   New Stock: ${event.stock} units`);

    if (event.stock < 10) {
      console.log(
        `   ⚠️  LOW STOCK ALERT! Only ${event.stock} units remaining!`,
      );
      console.log(`   📧 Notifying inventory manager...`);
    } else if (event.stock === 0) {
      console.log(`   🚫 OUT OF STOCK! Notifying all stakeholders...`);
    }
  }
}
