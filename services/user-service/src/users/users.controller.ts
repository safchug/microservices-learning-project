import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // HTTP REST endpoints
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Microservice message patterns
  @MessagePattern({ cmd: 'get_user' })
  async getUserById(@Payload() id: string) {
    return await this.usersService.findOne(id);
  }

  @MessagePattern({ cmd: 'get_user_by_email' })
  async getUserByEmail(@Payload() email: string) {
    return await this.usersService.findByEmail(email);
  }

  @MessagePattern({ cmd: 'get_all_users' })
  async getAllUsers() {
    return await this.usersService.findAll();
  }
}
