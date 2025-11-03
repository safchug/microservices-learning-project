import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './schemas/product.schema';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductModel: any;
  let mockCacheManager: any;
  let mockElasticsearchService: any;
  let mockKafkaProducer: any;

  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    category: 'test',
    stock: 10,
    tags: ['test'],
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    const saveMock = jest.fn().mockResolvedValue(mockProduct);
    
    mockProductModel = jest.fn().mockImplementation(() => ({
      ...mockProduct,
      save: saveMock,
    }));
    
    mockProductModel.find = jest.fn();
    mockProductModel.findById = jest.fn();
    mockProductModel.findByIdAndUpdate = jest.fn();
    mockProductModel.findByIdAndDelete = jest.fn();
    mockProductModel.countDocuments = jest.fn();
    mockProductModel.create = jest.fn();
    mockProductModel.exec = jest.fn();

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockElasticsearchService = {
      indices: {
        exists: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue({}),
      },
      index: jest.fn().mockResolvedValue({}),
      search: jest.fn().mockResolvedValue({
        hits: {
          total: { value: 1 },
          hits: [
            {
              _id: '507f1f77bcf86cd799439011',
              _source: mockProduct,
              _score: 1.0,
            },
          ],
        },
      }),
      delete: jest.fn().mockResolvedValue({}),
    };

    mockKafkaProducer = {
      publishEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: ElasticsearchService,
          useValue: mockElasticsearchService,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'test',
        stock: 10,
        tags: ['test'],
      };

      await service.create(createProductDto);

      expect(mockProductModel).toHaveBeenCalledWith(createProductDto);
      expect(mockElasticsearchService.index).toHaveBeenCalled();
      expect(mockKafkaProducer.publishEvent).toHaveBeenCalledWith(
        'product.created',
        expect.objectContaining({
          name: createProductDto.name,
          category: createProductDto.category,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return cached products if available', async () => {
      const cachedProducts = [mockProduct];
      mockCacheManager.get.mockResolvedValue(cachedProducts);

      const result = await service.findAll();

      expect(mockCacheManager.get).toHaveBeenCalledWith('all_products');
      expect(result).toEqual(cachedProducts);
      expect(mockProductModel.find).not.toHaveBeenCalled();
    });

    it('should fetch and cache products if cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockProductModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockProduct]),
      });

      const result = await service.findAll();

      expect(mockCacheManager.get).toHaveBeenCalledWith('all_products');
      expect(mockProductModel.find).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith('all_products', [
        mockProduct,
      ]);
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('findOne', () => {
    it('should return cached product if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockProduct);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'product_507f1f77bcf86cd799439011',
      );
      expect(result).toEqual(mockProduct);
      expect(mockProductModel.findById).not.toHaveBeenCalled();
    });

    it('should fetch and cache product if cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        'product_507f1f77bcf86cd799439011',
      );
      expect(mockProductModel.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'product_507f1f77bcf86cd799439011',
        mockProduct,
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockProductModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product and invalidate cache', async () => {
      const updateProductDto = { price: 79.99, stock: 5 };
      const updatedProduct = { ...mockProduct, ...updateProductDto };

      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProduct),
      });

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateProductDto,
      );

      expect(mockProductModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateProductDto,
        { new: true },
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'product_507f1f77bcf86cd799439011',
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('all_products');
      expect(mockElasticsearchService.index).toHaveBeenCalled();
      expect(mockKafkaProducer.publishEvent).toHaveBeenCalledWith(
        'product.updated',
        expect.any(Object),
      );
      expect(result).toEqual(updatedProduct);
    });

    it('should publish stock.changed event when stock is updated', async () => {
      const updateProductDto = { stock: 3 };
      const updatedProduct = { ...mockProduct, stock: 3 };

      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProduct),
      });

      await service.update('507f1f77bcf86cd799439011', updateProductDto);

      expect(mockKafkaProducer.publishEvent).toHaveBeenCalledWith(
        'product.stock.changed',
        expect.objectContaining({
          stock: 3,
        }),
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update('507f1f77bcf86cd799439011', { price: 100 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product and invalidate cache', async () => {
      mockProductModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProduct),
      });

      await service.remove('507f1f77bcf86cd799439011');

      expect(mockProductModel.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        'product_507f1f77bcf86cd799439011',
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith('all_products');
      expect(mockElasticsearchService.delete).toHaveBeenCalledWith({
        index: 'products',
        id: '507f1f77bcf86cd799439011',
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('should search products using Elasticsearch', async () => {
      const searchDto = {
        query: 'test',
        category: 'electronics',
        minPrice: 50,
        maxPrice: 150,
        page: 1,
        limit: 10,
      };

      const result = await service.search(searchDto);

      expect(mockElasticsearchService.search).toHaveBeenCalled();
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
    });

    it('should fallback to MongoDB search if Elasticsearch fails', async () => {
      const searchDto = { query: 'test', page: 1, limit: 10 };

      mockElasticsearchService.search.mockRejectedValue(
        new Error('ES Error'),
      );
      mockProductModel.countDocuments.mockResolvedValue(1);
      mockProductModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockProduct]),
      });

      const result = await service.search(searchDto);

      expect(result).toHaveProperty('results');
      expect(result.results).toEqual([mockProduct]);
    });
  });
});
