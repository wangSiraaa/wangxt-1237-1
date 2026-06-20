import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchOrder } from '../../entities/dispatch-order.entity';
import { BaseStation } from '../../entities/base-station.entity';
import { Generator } from '../../entities/generator.entity';
import { DispatchOrderService } from './dispatch-order.service';
import { DispatchOrderController } from './dispatch-order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DispatchOrder, BaseStation, Generator])],
  controllers: [DispatchOrderController],
  providers: [DispatchOrderService],
  exports: [DispatchOrderService],
})
export class DispatchOrderModule {}
