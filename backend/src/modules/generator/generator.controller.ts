import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import { Generator, GeneratorStatus } from '../../entities/generator.entity';

@Controller('generators')
export class GeneratorController {
  constructor(private readonly service: GeneratorService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('idle')
  async findIdleGenerators() {
    return this.service.findIdleGenerators();
  }

  @Get('statistics')
  async getStatistics() {
    return this.service.getStatistics();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: Partial<Generator>) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<Generator>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('batch-delete')
  async batchRemove(@Body('ids') ids: string[]) {
    return this.service.batchRemove(ids || []);
  }

  @Post(':id/status')
  async setStatus(@Param('id') id: string, @Body('status') status: GeneratorStatus) {
    return this.service.setStatus(id, status);
  }
}
