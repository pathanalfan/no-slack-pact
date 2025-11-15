import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JoinPactDto } from './dto/join-pact.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('join-pact')
  @HttpCode(HttpStatus.OK)
  async joinPact(@Body() joinPactDto: JoinPactDto) {
    return this.userService.joinPact(joinPactDto);
  }
}
