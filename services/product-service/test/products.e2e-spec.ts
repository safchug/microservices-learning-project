import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ProductsModule } from '../src/products/products.module';
import { KafkaModule } from '../src/kafka/kafka.module';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let createdProductId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGO_URI_TEST ||
            'mongodb://admin:admin123@localhost:27017/productdb-test?authSource=admin',
        ),
        CacheModule.register({
          isGlobal: true,
          ttl: 5,
        }),
        ElasticsearchModule.register({
          node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
        }),
        KafkaModule,
        ProductsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /products', () => {
    it('should create a new product', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Test Laptop',
          description: 'High-performance laptop for testing',
          price: 999.99,
          category: 'electronics',
          stock: 10,
          tags: ['laptop', 'test'],
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('_id');
          expect(response.body.name).toBe('Test Laptop');
          expect(response.body.price).toBe(999.99);
          expect(response.body.category).toBe('electronics');
          expect(response.body.stock).toBe(10);
          createdProductId = response.body._id;
        });
    });

    it('should fail with invalid data (missing required fields)', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Invalid Product',
          price: 100,
        })
        .expect(400);
    });

    it('should fail with invalid price (negative)', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Invalid Product',
          description: 'Test description',
          price: -10,
          category: 'test',
        })
        .expect(400);
    });
  });

  describe('GET /products', () => {
    it('should return all products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by id', () => {
      return request(app.getHttpServer())
        .get(`/products/${createdProductId}`)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdProductId);
          expect(response.body.name).toBe('Test Laptop');
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/507f1f77bcf86cd799439011')
        .expect(404);
    });

    it('should return 404 for invalid id format', () => {
      return request(app.getHttpServer())
        .get('/products/invalid-id')
        .expect(404);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update a product', () => {
      return request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .send({
          price: 899.99,
          stock: 5,
        })
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBe(createdProductId);
          expect(response.body.price).toBe(899.99);
          expect(response.body.stock).toBe(5);
          expect(response.body.name).toBe('Test Laptop');
        });
    });

    it('should fail with invalid update data', () => {
      return request(app.getHttpServer())
        .patch(`/products/${createdProductId}`)
        .send({
          price: -100,
        })
        .expect(400);
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .patch('/products/507f1f77bcf86cd799439011')
        .send({
          price: 100,
        })
        .expect(404);
    });
  });

  describe('GET /products/search', () => {
    it('should search products by query', async () => {
      // Wait a bit for Elasticsearch to index
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return request(app.getHttpServer())
        .get('/products/search?query=laptop')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('results');
          expect(response.body).toHaveProperty('total');
          expect(response.body).toHaveProperty('page');
          expect(response.body).toHaveProperty('limit');
        });
    });

    it('should search products by category', () => {
      return request(app.getHttpServer())
        .get('/products/search?category=electronics')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('results');
          expect(Array.isArray(response.body.results)).toBe(true);
        });
    });

    it('should search products with price range', () => {
      return request(app.getHttpServer())
        .get('/products/search?minPrice=500&maxPrice=1000')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('results');
          if (response.body.results.length > 0) {
            response.body.results.forEach((product: any) => {
              expect(product.price).toBeGreaterThanOrEqual(500);
              expect(product.price).toBeLessThanOrEqual(1000);
            });
          }
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/products/search?page=1&limit=5')
        .expect(200)
        .then((response) => {
          expect(response.body.page).toBe(1);
          expect(response.body.limit).toBe(5);
        });
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete a product', () => {
      return request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .expect(204);
    });

    it('should return 404 when deleting non-existent product', () => {
      return request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .expect(404);
    });
  });

  describe('Caching', () => {
    let testProductId: string;

    beforeAll(async () => {
      // Create a product for cache testing
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Cache Test Product',
          description: 'Product for testing cache',
          price: 50,
          category: 'test',
          stock: 100,
        });
      testProductId = response.body._id;
    });

    afterAll(async () => {
      // Clean up
      await request(app.getHttpServer()).delete(`/products/${testProductId}`);
    });

    it('should cache product on first request and hit cache on second', async () => {
      // First request - should cache
      const firstResponse = await request(app.getHttpServer())
        .get(`/products/${testProductId}`)
        .expect(200);

      expect(firstResponse.body._id).toBe(testProductId);

      // Second request - should hit cache
      const secondResponse = await request(app.getHttpServer())
        .get(`/products/${testProductId}`)
        .expect(200);

      expect(secondResponse.body._id).toBe(testProductId);
      expect(secondResponse.body.name).toBe('Cache Test Product');
    });

    it('should invalidate cache after update', async () => {
      // Get product (cache it)
      await request(app.getHttpServer())
        .get(`/products/${testProductId}`)
        .expect(200);

      // Update product (should invalidate cache)
      const updateResponse = await request(app.getHttpServer())
        .patch(`/products/${testProductId}`)
        .send({ price: 75 })
        .expect(200);

      expect(updateResponse.body.price).toBe(75);

      // Get product again (should fetch fresh data)
      const getResponse = await request(app.getHttpServer())
        .get(`/products/${testProductId}`)
        .expect(200);

      expect(getResponse.body.price).toBe(75);
    });
  });
});
