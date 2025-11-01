import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer, logLevel } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'user-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
      logLevel: logLevel.ERROR,
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    console.log('✅ Kafka Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    console.log('❌ Kafka Producer disconnected');
  }

  async publishEvent(topic: string, message: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.id || Date.now().toString(),
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });
      console.log(`📤 Published event to ${topic}:`, message);
    } catch (error) {
      console.error('Error publishing event to Kafka:', error.message);
    }
  }
}
