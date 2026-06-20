import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseStationService } from './base-station.service';
import { BaseStation } from '../../entities/base-station.entity';

@Controller('base-stations')
export class BaseStationController {
  constructor(private readonly service: BaseStationService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.service.findAll(query);
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
  async create(@Body() dto: Partial<BaseStation>) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<BaseStation>) {
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

  @Post('mark-power-out')
  async markPowerOut(@Body('ids') ids: string[], @Body('powerOutTime') powerOutTime: Date) {
    if (!ids || !ids.length) throw new BadRequestException('请选择基站');
    return this.service.markPowerOut(ids, powerOutTime);
  }

  @Post('restore-normal')
  async restoreToNormal(@Body('ids') ids: string[]) {
    return this.service.restoreToNormal(ids || []);
  }

  @Post('import-power-out')
  @UseInterceptors(FileInterceptor('file'))
  async importPowerOutStations(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请上传Excel文件');
    return this.service.importPowerOutStations(file);
  }
}
