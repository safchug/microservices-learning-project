import { Injectable, NotFoundException, Inject, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Client } from '@elastic/elasticsearch';
import { Product, ProductDocument } from './schemas/product.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  SearchProductDto,
} from './dto/product.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

@Injectable()
export class ProductsService implements OnModuleInit {
  private readonly esIndex = process.env.ELASTICSEARCH_INDEX || 'products';
  private readonly elasticsearchClient: Client;

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly kafkaProducer: KafkaProducerService,
  ) {
    this.elasticsearchClient = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    });
  }

  async onModuleInit() {
    await this.initializeElasticsearchIndex();
  }

  private async initializeElasticsearchIndex() {
    try {
      const { body: indexExists } = await this.elasticsearchClient.indices.exists({
        index: this.esIndex,
      });

      if (!indexExists) {
        await this.elasticsearchClient.indices.create({
          index: this.esIndex,
          body: {
            mappings: {
              properties: {
                name: { type: 'text' },
                description: { type: 'text' },
                price: { type: 'float' },
                category: { type: 'keyword' },
                stock: { type: 'integer' },
                tags: { type: 'keyword' },
                isAvailable: { type: 'boolean' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' },
              },
            },
          },
        });
        console.log(`✅ Elasticsearch index '${this.esIndex}' created`);
      }
    } catch (error) {
      console.error('Elasticsearch initialization error:', error.message);
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = new this.productModel(createProductDto);
    const savedProduct = await product.save();

    // Index in Elasticsearch
    await this.indexProductInElasticsearch(savedProduct);

    // Publish event to Kafka
    await this.kafkaProducer.publishEvent('product.created', {
      id: savedProduct._id.toString(),
      name: savedProduct.name,
      category: savedProduct.category,
      price: savedProduct.price,
      stock: savedProduct.stock,
      timestamp: new Date().toISOString(),
    });

    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    const cacheKey = 'all_products';

    // Try to get from cache
    const cached = await this.cacheManager.get<Product[]>(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT: all_products');
      return cached;
    }

    console.log('❌ Cache MISS: all_products');
    const products = await this.productModel.find().exec();

    // Store in cache
    await this.cacheManager.set(cacheKey, products);

    return products;
  }

  async findOne(id: string): Promise<Product> {
    const cacheKey = `product_${id}`;

    // Try cache first
    const cached = await this.cacheManager.get<Product>(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`❌ Cache MISS: ${cacheKey}`);
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Store in cache
    await this.cacheManager.set(cacheKey, product);

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Invalidate cache
    await this.cacheManager.del(`product_${id}`);
    await this.cacheManager.del('all_products');

    // Update in Elasticsearch
    await this.indexProductInElasticsearch(product);

    // Publish event to Kafka
    await this.kafkaProducer.publishEvent('product.updated', {
      id: product._id.toString(),
      name: product.name,
      changes: updateProductDto,
      timestamp: new Date().toISOString(),
    });

    // If stock changed, publish specific event
    if (updateProductDto.stock !== undefined) {
      await this.kafkaProducer.publishEvent('product.stock.changed', {
        id: product._id.toString(),
        name: product.name,
        stock: product.stock,
        timestamp: new Date().toISOString(),
      });
    }

    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Invalidate cache
    await this.cacheManager.del(`product_${id}`);
    await this.cacheManager.del('all_products');

    // Remove from Elasticsearch
    try {
      await this.elasticsearchClient.delete({
        index: this.esIndex,
        id: id,
      });
    } catch (error) {
      console.error('Error removing from Elasticsearch:', error.message);
    }
  }

  async search(searchDto: SearchProductDto): Promise<any> {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = searchDto;

    const must: any[] = [];
    const filter: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['name^2', 'description', 'tags'],
        },
      });
    }

    if (category) {
      filter.push({ term: { category } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const range: any = {};
      if (minPrice !== undefined) range.gte = minPrice;
      if (maxPrice !== undefined) range.lte = maxPrice;
      filter.push({ range: { price: range } });
    }

    const body: any = {
      from: (page - 1) * limit,
      size: limit,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
    };

    try {
      const { body: result } = await this.elasticsearchClient.search({
        index: this.esIndex,
        body,
      });

      return {
        total: result.hits.total,
        page,
        limit,
        results: result.hits.hits.map((hit: any) => ({
          id: hit._id,
          ...hit._source,
          score: hit._score,
        })),
      };
    } catch (error) {
      console.error('Elasticsearch search error:', error.message);
      // Fallback to MongoDB search
      return this.fallbackSearch(searchDto);
    }
  }

  private async fallbackSearch(searchDto: SearchProductDto): Promise<any> {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = searchDto;
    const filter: any = {};

    if (query) {
      filter.$text = { $search: query };
    }
    if (category) {
      filter.category = category;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    const total = await this.productModel.countDocuments(filter);
    const results = await this.productModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      total,
      page,
      limit,
      results,
    };
  }

  private async indexProductInElasticsearch(product: any): Promise<void> {
    try {
      await this.elasticsearchClient.index({
        index: this.esIndex,
        id: product._id.toString(),
        body: {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          stock: product.stock,
          tags: product.tags,
          isAvailable: product.isAvailable,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error indexing in Elasticsearch:', error.message);
    }
  }
}
