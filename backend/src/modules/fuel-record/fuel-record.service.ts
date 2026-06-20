import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuelRecord, FuelAbnormalStatus } from '../../entities/fuel-record.entity';
import { DispatchOrder } from '../../entities/dispatch-order.entity';

const ABNORMAL_THRESHOLD = 0.3;
const STANDARD_CONSUMPTION_PER_HOUR = 5;

@Injectable()
export class FuelRecordService {
  constructor(
    @InjectRepository(FuelRecord)
    private readonly repo: Repository<FuelRecord>,
    @InjectRepository(DispatchOrder)
    private readonly orderRepo: Repository<DispatchOrder>,
  ) {}

  async findAll(params: any = {}): Promise<{ list: FuelRecord[]; total: number }> {
    const { page = 1, pageSize = 20, orderId, abnormalStatus } = params;
    const qb = this.repo.createQueryBuilder('fr')
      .leftJoinAndSelect('fr.order', 'o');

    if (orderId) qb.andWhere('fr.orderId = :orderId', { orderId });
    if (abnormalStatus) qb.andWhere('fr.abnormalStatus = :abnormalStatus', { abnormalStatus });

    qb.orderBy('fr.createdAt', 'DESC');
    const total = await qb.getCount();
    const skip = (page - 1) * pageSize;
    const list = await qb.skip(skip).take(pageSize).getMany();
    return { list, total };
  }

  async findByOrderId(orderId: string): Promise<FuelRecord[]> {
    return this.repo.find({ where: { orderId }, order: { recordTime: 'ASC' } });
  }

  async findOne(id: string): Promise<FuelRecord> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['order'] });
    if (!entity) throw new NotFoundException('燃油记录不存在');
    return entity;
  }

  async create(dto: Partial<FuelRecord>): Promise<FuelRecord> {
    if (!dto.orderId) throw new BadRequestException('请关联派单');

    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('派单不存在');

    if (dto.initialFuel == null) dto.initialFuel = order.generator?.initialFuel || 0;
    if (dto.consumption == null && dto.initialFuel != null && dto.remainingFuel != null) {
      dto.consumption = Number((dto.initialFuel - dto.remainingFuel).toFixed(2));
    }
    if (dto.consumption < 0) throw new BadRequestException('燃油消耗不能为负数');

    if (dto.recordTime == null) dto.recordTime = new Date();

    const standardConsumption = this.calculateStandardConsumption(order, dto.recordTime);
    dto.standardConsumption = Number(standardConsumption.toFixed(2));

    const deviation = dto.consumption > 0
      ? Math.abs(dto.consumption - standardConsumption) / Math.max(standardConsumption, 0.1)
      : 0;
    const isAbnormal = deviation > ABNORMAL_THRESHOLD;

    dto.abnormalStatus = isAbnormal ? FuelAbnormalStatus.ABNORMAL : FuelAbnormalStatus.NORMAL;
    dto.photoRequired = isAbnormal;

    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  private calculateStandardConsumption(order: DispatchOrder, endTime: Date): number {
    const startTime = order.startTime || order.dispatchTime || order.createdAt;
    const durationHours = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    return durationHours * STANDARD_CONSUMPTION_PER_HOUR;
  }

  async explainAbnormal(id: string, dto: { explanation: string; photoUrl?: string }): Promise<FuelRecord> {
    const record = await this.findOne(id);

    if (record.abnormalStatus === FuelAbnormalStatus.NORMAL) {
      throw new ConflictException('该记录燃油消耗正常，无需说明');
    }
    if (!dto.explanation || !dto.explanation.trim()) {
      throw new BadRequestException('请填写异常说明');
    }
    if (record.photoRequired && !dto.photoUrl && !record.photoUrl) {
      throw new BadRequestException('燃油消耗异常，请上传现场照片');
    }

    record.explanation = dto.explanation;
    if (dto.photoUrl) record.photoUrl = dto.photoUrl;
    record.abnormalStatus = FuelAbnormalStatus.EXPLAINED;

    return this.repo.save(record);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  async getStatistics(): Promise<any> {
    const all = await this.repo.find();
    const total = all.reduce((sum, r) => sum + (Number(r.consumption) || 0), 0);
    return {
      totalRecords: all.length,
      totalConsumption: Number(total.toFixed(2)),
      avgConsumption: all.length ? Number((total / all.length).toFixed(2)) : 0,
      abnormalCount: all.filter(r => r.abnormalStatus === FuelAbnormalStatus.ABNORMAL).length,
      explainedCount: all.filter(r => r.abnormalStatus === FuelAbnormalStatus.EXPLAINED).length,
      normalCount: all.filter(r => r.abnormalStatus === FuelAbnormalStatus.NORMAL).length,
      needPhotoCount: all.filter(r => r.photoRequired && !r.photoUrl).length,
    };
  }
}
