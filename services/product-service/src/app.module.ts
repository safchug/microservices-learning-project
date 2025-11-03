import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ProductsModule } from './products/products.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb://admin:admin123@localhost:27017/productdb?authSource=admin',
    ),
    CacheModule.register({
      isGlobal: true,
      ttl: 300,
    }),
    // ElasticsearchModule.registerAsync({
    //   useFactory: async () => {
    //     return {
    //       node: 'http://localhost:9200',
    //       maxRetries: 10,
    //       requestTimeout: 60000,
    //       pingTimeout: 60000,
    //       sniffOnStart: false,
    //     };
    //   },
    // }),
    KafkaModule,
    ProductsModule,
  ],
})
export class AppModule {}
