import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FuelRecordService } from './fuel-record.service';
import { FuelRecord } from '../../entities/fuel-record.entity';

@Controller('fuel-records')
export class FuelRecordController {
  constructor(private readonly service: FuelRecordService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('order/:orderId')
  async findByOrderId(@Param('orderId') orderId: string) {
    return this.service.findByOrderId(orderId);
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
  async create(@Body() dto: Partial<FuelRecord>) {
    return this.service.create(dto);
  }

  @Post(':id/explain')
  async explainAbnormal(
    @Param('id') id: string,
    @Body() dto: { explanation: string; photoUrl?: string }
  ) {
    return this.service.explainAbnormal(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
