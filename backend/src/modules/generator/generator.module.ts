import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Generator } from '../../entities/generator.entity';
import { GeneratorService } from './generator.service';
import { GeneratorController } from './generator.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Generator])],
  controllers: [GeneratorController],
  providers: [GeneratorService],
  exports: [GeneratorService],
})
export class GeneratorModule {}
