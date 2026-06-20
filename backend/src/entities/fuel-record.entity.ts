import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DispatchOrder } from './dispatch-order.entity';

export enum FuelAbnormalStatus {
  NORMAL = 'normal',
  ABNORMAL = 'abnormal',
  EXPLAINED = 'explained'
}

@Entity('fuel_records')
export class FuelRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DispatchOrder)
  @JoinColumn({ name: 'orderId' })
  order: DispatchOrder;

  @Column()
  orderId: string;

  @Column({ type: 'timestamp', nullable: true })
  recordTime: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  initialFuel: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  remainingFuel: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  consumption: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  standardConsumption: number;

  @Column({
    type: 'enum',
    enum: FuelAbnormalStatus,
    default: FuelAbnormalStatus.NORMAL
  })
  abnormalStatus: FuelAbnormalStatus;

  @Column({ type: 'boolean', default: false })
  photoRequired: boolean;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @Column({ length: 50, nullable: true })
  recorder: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
