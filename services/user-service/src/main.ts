import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create HTTP application
  const app = await NestFactory.create(AppModule);
  
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS
  app.enableCors();

  // Connect microservice transport (TCP)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.TCP_HOST || 'localhost',
      port: parseInt(process.env.TCP_PORT) || 3301,
    },
  });

  await app.startAllMicroservices();
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 User Service is running on: http://localhost:${port}`);
  console.log(`📡 Microservice listening on TCP port: ${process.env.TCP_PORT || 3301}`);
}

bootstrap();
