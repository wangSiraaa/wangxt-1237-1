import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseStation } from '../../entities/base-station.entity';
import { BaseStationService } from './base-station.service';
import { BaseStationController } from './base-station.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BaseStation])],
  controllers: [BaseStationController],
  providers: [BaseStationService],
  exports: [BaseStationService],
})
export class BaseStationModule {}
