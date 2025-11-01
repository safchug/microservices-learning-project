import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'user',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_DATABASE || 'userdb',
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    }),
    KafkaModule,
    UsersModule,
  ],
})
export class AppModule {}
