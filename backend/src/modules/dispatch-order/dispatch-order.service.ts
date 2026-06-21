import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DispatchOrder, DispatchOrderStatus } from '../../entities/dispatch-order.entity';
import { BaseStation, BaseStationStatus, BaseStationLevel } from '../../entities/base-station.entity';
import { Generator, GeneratorStatus } from '../../entities/generator.entity';
import { FuelRecord, FuelAbnormalStatus } from '../../entities/fuel-record.entity';

const ABNORMAL_THRESHOLD = 0.3;
const STANDARD_CONSUMPTION_PER_HOUR = 5;

@Injectable()
export class DispatchOrderService {
  constructor(
    @InjectRepository(DispatchOrder)
    private readonly orderRepo: Repository<DispatchOrder>,
    @InjectRepository(BaseStation)
    private readonly stationRepo: Repository<BaseStation>,
    @InjectRepository(Generator)
    private readonly generatorRepo: Repository<Generator>,
    @InjectRepository(FuelRecord)
    private readonly fuelRecordRepo: Repository<FuelRecord>,
  ) {}

  private generateOrderNo(): string {
    const now = new Date();
    const prefix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PD${prefix}${random}`;
  }

  async findAll(params: any = {}): Promise<{ list: any[]; total: number }> {
    const { page = 1, pageSize = 20, keyword, status, stationId, generatorId } = params;
    const qb = this.orderRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.station', 's')
      .leftJoinAndSelect('o.generator', 'g');

    if (keyword) {
      qb.andWhere('(o.orderNo LIKE :kw OR s.name LIKE :kw OR s.code LIKE :kw OR g.code LIKE :kw OR g.name LIKE :kw)', { kw: `%${keyword}%` });
    }
    if (status) qb.andWhere('o.status = :status', { status });
    if (stationId) qb.andWhere('o.stationId = :stationId', { stationId });
    if (generatorId) qb.andWhere('o.generatorId = :generatorId', { generatorId });

    qb.orderBy(`
      CASE s.level
        WHEN 'core' THEN 1
        WHEN 'important' THEN 2
        ELSE 3
      END, o.createdAt DESC`);

    const total = await qb.getCount();
    const skip = (page - 1) * pageSize;
    const entities = await qb.skip(skip).take(pageSize).getMany();

    const list = entities.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      stationId: o.stationId,
      generatorId: o.generatorId,
      stationLevel: o.station?.level,
      stationName: o.station?.name,
      stationCode: o.station?.code,
      generatorCode: o.generator?.code,
      generatorName: o.generator?.name,
      oilBucketCode: o.oilBucketCode,
      oilBucketCapacity: o.oilBucketCapacity,
      returnedRemainingFuel: o.returnedRemainingFuel,
      returnedOilBucketCount: o.returnedOilBucketCount,
      status: o.status,
      powerOutTime: o.powerOutTime,
      dispatcher: o.dispatcher,
      dispatchTime: o.dispatchTime,
      maintenanceTeam: o.maintenanceTeam,
      teamLeader: o.teamLeader,
      teamPhone: o.teamPhone,
      arrivalTime: o.arrivalTime,
      startTime: o.startTime,
      endTime: o.endTime,
      totalDuration: o.totalDuration,
      generatorReturned: o.generatorReturned,
      returnTime: o.returnTime,
      remark: o.remark,
      createdAt: o.createdAt,
      needHighlight: o.station?.level === BaseStationLevel.CORE && o.status === DispatchOrderStatus.PENDING,
    }));
    return { list, total };
  }

  async getPendingDispatchList(): Promise<any[]> {
    const powerOutStations = await this.stationRepo.find({
      where: { status: BaseStationStatus.POWER_OUT },
      order: { level: 'ASC', code: 'ASC' }
    });

    const dispatchedStationIds = (await this.orderRepo
      .createQueryBuilder('o')
      .select('o.stationId')
      .where('o.status IN (:...statuses)', {
        statuses: [
          DispatchOrderStatus.PENDING,
          DispatchOrderStatus.ASSIGNED,
          DispatchOrderStatus.ARRIVED,
          DispatchOrderStatus.GENERATING,
        ]
      })
      .getRawMany()
    ).map(r => r.o_stationId);

    const stationMap = new Map<string, boolean>();
    dispatchedStationIds.forEach(id => stationMap.set(id, true));

    return powerOutStations.map(s => ({
      stationId: s.id,
      stationCode: s.code,
      stationName: s.name,
      stationLevel: s.level,
      address: s.address,
      region: s.region,
      manager: s.manager,
      managerPhone: s.managerPhone,
      isDispatched: stationMap.has(s.id),
      isCore: s.level === BaseStationLevel.CORE,
      needHighlight: s.level === BaseStationLevel.CORE && !stationMap.has(s.id),
    }));
  }

  async findOne(id: string): Promise<DispatchOrder> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['station', 'generator'],
    });
    if (!order) throw new NotFoundException('派单不存在');
    return order;
  }

  async create(dto: Partial<DispatchOrder>): Promise<DispatchOrder> {
    if (!dto.stationId) throw new BadRequestException('请选择基站');
    if (!dto.generatorId) throw new BadRequestException('请选择油机');

    const station = await this.stationRepo.findOne({ where: { id: dto.stationId } });
    if (!station) throw new NotFoundException('基站不存在');

    const generator = await this.generatorRepo.findOne({ where: { id: dto.generatorId } });
    if (!generator) throw new NotFoundException('油机不存在');

    if (generator.status !== GeneratorStatus.IDLE) {
      throw new ConflictException('该油机当前不可用（未归还或使用中），请重新选择');
    }

    const existingOrder = await this.orderRepo.findOne({
      where: {
        stationId: dto.stationId,
        status: In([
          DispatchOrderStatus.PENDING,
          DispatchOrderStatus.ASSIGNED,
          DispatchOrderStatus.ARRIVED,
          DispatchOrderStatus.GENERATING,
        ]),
      }
    });
    if (existingOrder) {
      throw new ConflictException('该基站已有未完成的派单');
    }

    const entity = this.orderRepo.create({
      ...dto,
      orderNo: dto.orderNo || this.generateOrderNo(),
      status: DispatchOrderStatus.PENDING,
    });

    generator.status = GeneratorStatus.DISPATCHED;
    await this.generatorRepo.save(generator);

    return this.orderRepo.save(entity);
  }

  async assign(id: string, dto: any): Promise<DispatchOrder> {
    const order = await this.findOne(id);
    order.maintenanceTeam = dto.maintenanceTeam || order.maintenanceTeam;
    order.teamLeader = dto.teamLeader || order.teamLeader;
    order.teamPhone = dto.teamPhone || order.teamPhone;
    order.oilBucketCode = dto.oilBucketCode || order.oilBucketCode;
    order.oilBucketCapacity = dto.oilBucketCapacity || order.oilBucketCapacity;
    order.dispatcher = dto.dispatcher || order.dispatcher;
    order.dispatchTime = new Date();
    order.status = DispatchOrderStatus.ASSIGNED;
    return this.orderRepo.save(order);
  }

  async arrive(id: string): Promise<DispatchOrder> {
    const order = await this.findOne(id);
    order.arrivalTime = new Date();
    order.status = DispatchOrderStatus.ARRIVED;
    if (order.generator) {
      order.generator.status = GeneratorStatus.IN_USE;
      await this.generatorRepo.save(order.generator);
    }
    return this.orderRepo.save(order);
  }

  async startGenerate(id: string): Promise<DispatchOrder> {
    const order = await this.findOne(id);
    order.startTime = new Date();
    order.status = DispatchOrderStatus.GENERATING;
    if (order.station) {
      order.station.status = BaseStationStatus.GENERATING;
      await this.stationRepo.save(order.station);
    }
    return this.orderRepo.save(order);
  }

  async returnGenerator(id: string, dto: any = {}): Promise<DispatchOrder> {
    const order = await this.findOne(id);
    if (order.generatorReturned) {
      throw new ConflictException('油机已归还，不能重复操作');
    }

    order.generatorReturned = true;
    order.returnTime = new Date();

    if (dto.endTime) order.endTime = dto.endTime;
    if (dto.totalDuration) order.totalDuration = dto.totalDuration;
    if (dto.returnedRemainingFuel != null) order.returnedRemainingFuel = dto.returnedRemainingFuel;
    if (dto.returnedOilBucketCount != null) order.returnedOilBucketCount = dto.returnedOilBucketCount;

    if (order.generator) {
      order.generator.status = GeneratorStatus.IDLE;
      await this.generatorRepo.save(order.generator);
    }

    const savedOrder = await this.orderRepo.save(order);

    if (dto.returnedRemainingFuel != null) {
      await this.createFuelRecordOnReturn(order, dto);
    }

    return savedOrder;
  }

  private calculateStandardConsumption(order: DispatchOrder, endTime: Date): number {
    const startTime = order.startTime || order.dispatchTime || order.createdAt;
    const durationHours = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    return durationHours * STANDARD_CONSUMPTION_PER_HOUR;
  }

  private async createFuelRecordOnReturn(order: DispatchOrder, dto: any): Promise<FuelRecord> {
    const initialFuel = order.oilBucketCapacity || 0;
    const remainingFuel = Number(dto.returnedRemainingFuel) || 0;
    const consumption = Number((initialFuel - remainingFuel).toFixed(2));

    if (consumption < 0) {
      throw new BadRequestException('剩余油量不能大于初始油量');
    }

    const recordTime = order.returnTime || new Date();
    const standardConsumption = this.calculateStandardConsumption(order, recordTime);

    const deviation = consumption > 0
      ? Math.abs(consumption - standardConsumption) / Math.max(standardConsumption, 0.1)
      : 0;
    const isAbnormal = deviation > ABNORMAL_THRESHOLD;

    const fuelRecord = this.fuelRecordRepo.create({
      orderId: order.id,
      recordTime,
      initialFuel,
      remainingFuel,
      consumption,
      standardConsumption: Number(standardConsumption.toFixed(2)),
      abnormalStatus: isAbnormal ? FuelAbnormalStatus.ABNORMAL : FuelAbnormalStatus.NORMAL,
      photoRequired: isAbnormal,
      recorder: dto.recorder || order.teamLeader || '',
      remark: dto.remark || '',
    });

    return this.fuelRecordRepo.save(fuelRecord);
  }

  async complete(id: string): Promise<DispatchOrder> {
    const order = await this.findOne(id);
    order.status = DispatchOrderStatus.COMPLETED;
    order.endTime = order.endTime || new Date();
    if (order.startTime && order.endTime) {
      const duration = (order.endTime.getTime() - order.startTime.getTime()) / (1000 * 60 * 60);
      order.totalDuration = Number(duration.toFixed(2));
    }
    return this.orderRepo.save(order);
  }

  async cancel(id: string): Promise<DispatchOrder> {
    const order = await this.findOne(id);
    if (!order.generatorReturned) {
      if (order.generator) {
        order.generator.status = GeneratorStatus.IDLE;
        await this.generatorRepo.save(order.generator);
      }
    }
    order.status = DispatchOrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    if (order.status !== DispatchOrderStatus.PENDING && order.status !== DispatchOrderStatus.CANCELLED) {
      throw new BadRequestException('只有待派发或已取消的派单才能删除');
    }
    await this.orderRepo.delete(id);
  }

  async getStatistics(): Promise<any> {
    const all = await this.orderRepo.find();
    return {
      total: all.length,
      pending: all.filter(o => o.status === DispatchOrderStatus.PENDING).length,
      assigned: all.filter(o => o.status === DispatchOrderStatus.ASSIGNED).length,
      arrived: all.filter(o => o.status === DispatchOrderStatus.ARRIVED).length,
      generating: all.filter(o => o.status === DispatchOrderStatus.GENERATING).length,
      completed: all.filter(o => o.status === DispatchOrderStatus.COMPLETED).length,
      cancelled: all.filter(o => o.status === DispatchOrderStatus.CANCELLED).length,
      notReturned: all.filter(o =>
        !o.generatorReturned &&
        o.status !== DispatchOrderStatus.CANCELLED &&
        o.status !== DispatchOrderStatus.PENDING
      ).length,
    };
  }
}
