import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecoveryConfirmation } from '../../entities/recovery-confirmation.entity';
import { DispatchOrder } from '../../entities/dispatch-order.entity';
import { BaseStation } from '../../entities/base-station.entity';
import { RecoveryConfirmationService } from './recovery-confirmation.service';
import { RecoveryConfirmationController } from './recovery-confirmation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecoveryConfirmation, DispatchOrder, BaseStation])],
  controllers: [RecoveryConfirmationController],
  providers: [RecoveryConfirmationService],
  exports: [RecoveryConfirmationService],
})
export class RecoveryConfirmationModule {}
