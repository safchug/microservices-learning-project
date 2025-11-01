import { Controller, Get, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USER_SERVICE')
    private readonly userService: ClientProxy,
  ) {}

  @Get()
  async getAllUsers() {
    return await firstValueFrom(
      this.userService.send({ cmd: 'get_all_users' }, {}),
    );
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await firstValueFrom(this.userService.send({ cmd: 'get_user' }, id));
  }
}
