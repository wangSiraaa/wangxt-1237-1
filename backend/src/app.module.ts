import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseStation } from './entities/base-station.entity';
import { Generator } from './entities/generator.entity';
import { DispatchOrder } from './entities/dispatch-order.entity';
import { FuelRecord } from './entities/fuel-record.entity';
import { RecoveryConfirmation } from './entities/recovery-confirmation.entity';
import { BaseStationModule } from './modules/base-station/base-station.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { DispatchOrderModule } from './modules/dispatch-order/dispatch-order.module';
import { FuelRecordModule } from './modules/fuel-record/fuel-record.module';
import { RecoveryConfirmationModule } from './modules/recovery-confirmation/recovery-confirmation.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'admin123',
      database: 'base_station',
      entities: [BaseStation, Generator, DispatchOrder, FuelRecord, RecoveryConfirmation],
      synchronize: true,
      logging: true,
    }),
    BaseStationModule,
    GeneratorModule,
    DispatchOrderModule,
    FuelRecordModule,
    RecoveryConfirmationModule,
    UploadModule,
  ],
})
export class AppModule {}
