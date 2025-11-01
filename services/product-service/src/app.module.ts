import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import * as redisStore from 'cache-manager-redis-store';
import { ProductsModule } from './products/products.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/productdb?authSource=admin'
    ),
    CacheModule.register({
      isGlobal: true,
      store: redisStore as any,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      ttl: parseInt(process.env.CACHE_TTL) || 300,
    }),
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    }),
    KafkaModule,
    ProductsModule,
  ],
})
export class AppModule {}
