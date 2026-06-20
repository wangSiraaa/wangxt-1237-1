import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum GeneratorStatus {
  IDLE = 'idle',
  DISPATCHED = 'dispatched',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance'
}

@Entity('generators')
export class Generator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, nullable: true })
  model: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  power: number;

  @Column({
    type: 'enum',
    enum: GeneratorStatus,
    default: GeneratorStatus.IDLE
  })
  status: GeneratorStatus;

  @Column({ length: 50 })
  location: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  initialFuel: number;

  @Column({ length: 100, nullable: true })
  keeper: string;

  @Column({ length: 20, nullable: true })
  keeperPhone: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
