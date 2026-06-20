import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { RecoveryConfirmationService } from './recovery-confirmation.service';

@Controller('recovery-confirmations')
export class RecoveryConfirmationController {
  constructor(private readonly service: RecoveryConfirmationService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('statistics')
  async getStatistics() {
    return this.service.getStatistics();
  }

  @Get('order/:orderId')
  async findByOrderId(@Param('orderId') orderId: string) {
    return this.service.findByOrderId(orderId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('from-order/:orderId')
  async createFromOrder(
    @Param('orderId') orderId: string,
    @Body() dto: any,
  ) {
    return this.service.createFromOrder(orderId, dto || {});
  }

  @Post(':id/manager-confirm')
  async managerConfirm(
    @Param('id') id: string,
    @Body() dto: { confirm: boolean; regionalManager: string; managerRemark?: string },
  ) {
    return this.service.managerConfirm(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
