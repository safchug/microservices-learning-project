import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject('PRODUCT_SERVICE')
    private readonly productService: ClientProxy,
  ) {}

  @Get()
  async getAllProducts() {
    return await firstValueFrom(
      this.productService.send({ cmd: 'get_all_products' }, {})
    );
  }

  @Get('search')
  async searchProducts(@Query() query: any) {
    return await firstValueFrom(
      this.productService.send({ cmd: 'search_products' }, query)
    );
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return await firstValueFrom(
      this.productService.send({ cmd: 'get_product' }, id)
    );
  }
}
