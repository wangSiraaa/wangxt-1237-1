import { Controller, Get, Post, Put, Delete, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { DispatchOrderService } from './dispatch-order.service';
import { DispatchOrder } from '../../entities/dispatch-order.entity';

@Controller('dispatch-orders')
export class DispatchOrderController {
  constructor(private readonly service: DispatchOrderService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('pending-list')
  async getPendingDispatchList() {
    return this.service.getPendingDispatchList();
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
  async create(@Body() dto: Partial<DispatchOrder>) {
    return this.service.create(dto);
  }

  @Post(':id/assign')
  async assign(@Param('id') id: string, @Body() dto: any) {
    return this.service.assign(id, dto);
  }

  @Post(':id/arrive')
  async arrive(@Param('id') id: string) {
    return this.service.arrive(id);
  }

  @Post(':id/start-generate')
  async startGenerate(@Param('id') id: string) {
    return this.service.startGenerate(id);
  }

  @Post(':id/return-generator')
  async returnGenerator(@Param('id') id: string, @Body() dto: any) {
    return this.service.returnGenerator(id, dto || {});
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string) {
    return this.service.complete(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
