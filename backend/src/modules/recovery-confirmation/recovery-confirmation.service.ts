import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecoveryConfirmation, RecoveryStatus } from '../../entities/recovery-confirmation.entity';
import { DispatchOrder, DispatchOrderStatus } from '../../entities/dispatch-order.entity';
import { BaseStation, BaseStationStatus } from '../../entities/base-station.entity';

@Injectable()
export class RecoveryConfirmationService {
  constructor(
    @InjectRepository(RecoveryConfirmation)
    private readonly repo: Repository<RecoveryConfirmation>,
    @InjectRepository(DispatchOrder)
    private readonly orderRepo: Repository<DispatchOrder>,
    @InjectRepository(BaseStation)
    private readonly stationRepo: Repository<BaseStation>,
  ) {}

  async findAll(params: any = {}): Promise<{ list: any[]; total: number }> {
    const { page = 1, pageSize = 20, keyword, status, stationId, needManagerConfirm } = params;
    const qb = this.repo.createQueryBuilder('rc')
      .leftJoinAndSelect('rc.station', 's')
      .leftJoinAndSelect('rc.order', 'o');

    if (keyword) {
      qb.andWhere('(s.name LIKE :kw OR s.code LIKE :kw OR o.orderNo LIKE :kw)', { kw: `%${keyword}%` });
    }
    if (status) qb.andWhere('rc.status = :status', { status });
    if (stationId) qb.andWhere('rc.stationId = :stationId', { stationId });
    if (needManagerConfirm === 'true') {
      qb.andWhere('rc.status = :status', { status: RecoveryStatus.PENDING });
    }

    qb.orderBy(`
      CASE s.level
        WHEN 'core' THEN 1
        WHEN 'important' THEN 2
        ELSE 3
      END, rc.createdAt DESC`);

    const total = await qb.getCount();
    const skip = (page - 1) * pageSize;
    const entities = await qb.skip(skip).take(pageSize).getMany();

    const list = entities.map(rc => ({
      id: rc.id,
      orderId: rc.orderId,
      stationId: rc.stationId,
      orderNo: rc.order?.orderNo,
      stationCode: rc.station?.code,
      stationName: rc.station?.name,
      stationLevel: rc.station?.level,
      status: rc.status,
      powerRestoredTime: rc.powerRestoredTime,
      generatorStopTime: rc.generatorStopTime,
      totalGenerateDuration: rc.totalGenerateDuration,
      totalFuelConsumption: rc.totalFuelConsumption,
      maintainer: rc.maintainer,
      maintainerConfirmTime: rc.maintainerConfirmTime,
      regionalManager: rc.regionalManager,
      managerConfirmTime: rc.managerConfirmTime,
      managerRemark: rc.managerRemark,
      photoUrl: rc.photoUrl,
      needHighlight: rc.station?.level === 'core' && rc.status === RecoveryStatus.PENDING,
      createdAt: rc.createdAt,
    }));

    return { list, total };
  }

  async findOne(id: string): Promise<RecoveryConfirmation> {
    const entity = await this.repo.findOne({ where: { id }, relations: ['station', 'order'] });
    if (!entity) throw new NotFoundException('恢复确认记录不存在');
    return entity;
  }

  async findByOrderId(orderId: string): Promise<RecoveryConfirmation> {
    const entity = await this.repo.findOne({ where: { orderId }, relations: ['station', 'order'] });
    return entity;
  }

  async createFromOrder(orderId: string, dto: any = {}): Promise<RecoveryConfirmation> {
    const existing = await this.findByOrderId(orderId);
    if (existing) {
      throw new ConflictException('该派单已创建恢复确认记录');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['station', 'generator'],
    });
    if (!order) throw new NotFoundException('派单不存在');

    if (order.status !== DispatchOrderStatus.GENERATING && order.status !== DispatchOrderStatus.ARRIVED) {
      throw new BadRequestException('只有发电中或已到达的派单才能申请恢复确认');
    }

    if (!order.generatorReturned) {
      throw new ConflictException('油机未归还，无法确认恢复。请先归还油机');
    }

    const entity = this.repo.create({
      orderId,
      stationId: order.stationId,
      status: RecoveryStatus.PENDING,
      powerRestoredTime: dto.powerRestoredTime || new Date(),
      generatorStopTime: dto.generatorStopTime || order.endTime || new Date(),
      maintainer: dto.maintainer || order.teamLeader,
      maintainerConfirmTime: new Date(),
      photoUrl: dto.photoUrl,
      remark: dto.remark,
    });

    if (order.startTime && entity.generatorStopTime) {
      const duration = (entity.generatorStopTime.getTime() - order.startTime.getTime()) / (1000 * 60 * 60);
      entity.totalGenerateDuration = Number(duration.toFixed(2));
    }
    entity.totalFuelConsumption = dto.totalFuelConsumption || 0;

    order.status = DispatchOrderStatus.COMPLETED;
    order.endTime = order.endTime || entity.generatorStopTime;
    await this.orderRepo.save(order);

    return this.repo.save(entity);
  }

  async managerConfirm(id: string, dto: {
    confirm: boolean;
    regionalManager: string;
    managerRemark?: string;
  }): Promise<RecoveryConfirmation> {
    const record = await this.findOne(id);

    if (record.status !== RecoveryStatus.PENDING) {
      throw new ConflictException('该记录已处理，不能重复确认');
    }

    if (dto.confirm) {
      record.status = RecoveryStatus.CONFIRMED;
      record.regionalManager = dto.regionalManager;
      record.managerConfirmTime = new Date();
      record.managerRemark = dto.managerRemark;

      if (record.station) {
        record.station.status = BaseStationStatus.RESTORED;
        await this.stationRepo.save(record.station);
      }

      if (record.order) {
        record.order.status = DispatchOrderStatus.COMPLETED;
        await this.orderRepo.save(record.order);
      }
    } else {
      record.status = RecoveryStatus.REJECTED;
      record.regionalManager = dto.regionalManager;
      record.managerConfirmTime = new Date();
      record.managerRemark = dto.managerRemark;
    }

    return this.repo.save(record);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    if (record.status === RecoveryStatus.CONFIRMED) {
      throw new BadRequestException('已确认的记录不能删除');
    }
    await this.repo.delete(id);
  }

  async getStatistics(): Promise<any> {
    const all = await this.repo.find({ relations: ['station'] });
    return {
      total: all.length,
      pending: all.filter(r => r.status === RecoveryStatus.PENDING).length,
      confirmed: all.filter(r => r.status === RecoveryStatus.CONFIRMED).length,
      rejected: all.filter(r => r.status === RecoveryStatus.REJECTED).length,
      corePending: all.filter(r => r.status === RecoveryStatus.PENDING && r.station?.level === 'core').length,
      avgDuration: all.length
        ? Number((all.reduce((s, r) => s + (Number(r.totalGenerateDuration) || 0), 0) / all.length).toFixed(2))
        : 0,
      totalFuel: Number(all.reduce((s, r) => s + (Number(r.totalFuelConsumption) || 0), 0).toFixed(2)),
    };
  }
}
