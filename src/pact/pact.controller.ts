import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { PactService } from './pact.service';
import { CreatePactDto } from './dto/create-pact.dto';

@Controller('pact')
export class PactController {
  constructor(private readonly pactService: PactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPactDto: CreatePactDto) {
    return this.pactService.create(createPactDto);
  }

  @Get('active')
  async findAllActive() {
    return this.pactService.findAllActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pact = await this.pactService.findOne(id);
    if (!pact) {
      throw new NotFoundException('Pact not found');
    }
    return pact;
  }
}
