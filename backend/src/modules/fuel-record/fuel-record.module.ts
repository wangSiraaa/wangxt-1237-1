import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelRecord } from '../../entities/fuel-record.entity';
import { DispatchOrder } from '../../entities/dispatch-order.entity';
import { FuelRecordService } from './fuel-record.service';
import { FuelRecordController } from './fuel-record.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FuelRecord, DispatchOrder])],
  controllers: [FuelRecordController],
  providers: [FuelRecordService],
  exports: [FuelRecordService],
})
export class FuelRecordModule {}
