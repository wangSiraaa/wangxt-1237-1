import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Generator, GeneratorStatus } from '../../entities/generator.entity';

@Injectable()
export class GeneratorService {
  constructor(
    @InjectRepository(Generator)
    private readonly repo: Repository<Generator>,
  ) {}

  async findAll(params: any = {}): Promise<{ list: Generator[]; total: number }> {
    const { page = 1, pageSize = 20, keyword, status, location } = params;
    const qb = this.repo.createQueryBuilder('g');

    if (keyword) {
      qb.andWhere('(g.code LIKE :kw OR g.name LIKE :kw OR g.model LIKE :kw)', { kw: `%${keyword}%` });
    }
    if (status) qb.andWhere('g.status = :status', { status });
    if (location) qb.andWhere('g.location = :location', { location });

    qb.orderBy('g.code', 'ASC');
    const total = await qb.getCount();
    const skip = (page - 1) * pageSize;
    const list = await qb.skip(skip).take(pageSize).getMany();
    return { list, total };
  }

  async findIdleGenerators(): Promise<Generator[]> {
    return this.repo.find({ where: { status: GeneratorStatus.IDLE }, order: { code: 'ASC' } });
  }

  async findOne(id: string): Promise<Generator> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('油机不存在');
    return entity;
  }

  async create(dto: Partial<Generator>): Promise<Generator> {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async update(id: string, dto: Partial<Generator>): Promise<Generator> {
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

  async setStatus(id: string, status: GeneratorStatus): Promise<Generator> {
    const entity = await this.findOne(id);
    entity.status = status;
    return this.repo.save(entity);
  }

  async checkGeneratorAvailable(id: string): Promise<boolean> {
    const entity = await this.findOne(id);
    return entity.status === GeneratorStatus.IDLE;
  }

  async getStatistics(): Promise<any> {
    const all = await this.repo.find();
    return {
      total: all.length,
      idle: all.filter(g => g.status === GeneratorStatus.IDLE).length,
      dispatched: all.filter(g => g.status === GeneratorStatus.DISPATCHED).length,
      inUse: all.filter(g => g.status === GeneratorStatus.IN_USE).length,
      maintenance: all.filter(g => g.status === GeneratorStatus.MAINTENANCE).length,
    };
  }
}
