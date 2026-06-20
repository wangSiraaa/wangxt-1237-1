import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BaseStation, BaseStationStatus, BaseStationLevel } from '../../entities/base-station.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class BaseStationService {
  constructor(
    @InjectRepository(BaseStation)
    private readonly repo: Repository<BaseStation>,
  ) {}

  async findAll(params: any = {}): Promise<{ list: BaseStation[]; total: number }> {
    const { page = 1, pageSize = 20, keyword, status, level, region } = params;
    const qb = this.repo.createQueryBuilder('bs');

    if (keyword) {
      qb.andWhere('(bs.code LIKE :kw OR bs.name LIKE :kw OR bs.address LIKE :kw)', { kw: `%${keyword}%` });
    }
    if (status) qb.andWhere('bs.status = :status', { status });
    if (level) qb.andWhere('bs.level = :level', { level });
    if (region) qb.andWhere('bs.region = :region', { region });

    qb.orderBy(`
      CASE bs.level
        WHEN 'core' THEN 1
        WHEN 'important' THEN 2
        ELSE 3
      END, bs.code ASC`);

    const total = await qb.getCount();
    const skip = (page - 1) * pageSize;
    const list = await qb.skip(skip).take(pageSize).getMany();
    return { list, total };
  }

  async findOne(id: string): Promise<BaseStation> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('基站不存在');
    return entity;
  }

  async create(dto: Partial<BaseStation>): Promise<BaseStation> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: Partial<BaseStation>): Promise<BaseStation> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  async batchRemove(ids: string[]): Promise<void> {
    await this.repo.delete(ids);
  }

  async markPowerOut(ids: string[], powerOutTime?: Date): Promise<void> {
    if (!ids.length) throw new BadRequestException('请选择基站');
    const stations = await this.repo.find({ where: { id: In(ids) } });
    if (stations.length !== ids.length) throw new NotFoundException('部分基站不存在');
    
    await this.repo
      .createQueryBuilder()
      .update(BaseStation)
      .set({
        status: BaseStationStatus.POWER_OUT,
        updatedAt: new Date(),
      })
      .whereInIds(ids)
      .execute();

    await this.repo
      .createQueryBuilder()
      .update(BaseStation)
      .set({
        status: BaseStationStatus.POWER_OUT,
      })
      .whereInIds(ids)
      .execute();
  }

  async restoreToNormal(ids: string[]): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(BaseStation)
      .set({ status: BaseStationStatus.NORMAL })
      .whereInIds(ids)
      .execute();
  }

  async importPowerOutStations(file: Express.Multer.File): Promise<{ success: number; failed: number; list: BaseStation[] }> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let success = 0;
    let failed = 0;
    const importedList: BaseStation[] = [];
    const powerOutCodes: string[] = [];

    for (const row of data) {
      const code = String(row['基站编码'] || row['code'] || '').trim();
      const name = String(row['基站名称'] || row['name'] || '').trim();
      if (!code) { failed++; continue; }

      let station = await this.repo.findOne({ where: { code } });
      if (!station) {
        station = this.repo.create({
          code,
          name: name || code,
          address: String(row['地址'] || row['address'] || ''),
          level: (String(row['级别'] || row['level'] || 'normal') as BaseStationLevel),
          region: String(row['区域'] || row['region'] || ''),
          manager: String(row['负责人'] || row['manager'] || ''),
          managerPhone: String(row['联系电话'] || row['managerPhone'] || ''),
          status: BaseStationStatus.POWER_OUT,
        });
      } else {
        station.status = BaseStationStatus.POWER_OUT;
        station.name = name || station.name;
      }
      try {
        const saved = await this.repo.save(station);
        importedList.push(saved);
        powerOutCodes.push(code);
        success++;
      } catch (e) {
        failed++;
      }
    }

    return { success, failed, list: importedList };
  }

  async getStatistics(): Promise<any> {
    const all = await this.repo.find();
    const result = {
      total: all.length,
      normal: all.filter(s => s.status === BaseStationStatus.NORMAL).length,
      powerOut: all.filter(s => s.status === BaseStationStatus.POWER_OUT).length,
      generating: all.filter(s => s.status === BaseStationStatus.GENERATING).length,
      restored: all.filter(s => s.status === BaseStationStatus.RESTORED).length,
      byLevel: {
        core: all.filter(s => s.level === BaseStationLevel.CORE).length,
        important: all.filter(s => s.level === BaseStationLevel.IMPORTANT).length,
        normal: all.filter(s => s.level === BaseStationLevel.NORMAL).length,
      },
      corePowerOut: all.filter(s => s.level === BaseStationLevel.CORE && s.status === BaseStationStatus.POWER_OUT).length,
      coreNoDispatch: 0,
    };
    return result;
  }
}
