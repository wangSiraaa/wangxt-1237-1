import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { DispatchOrder } from './dispatch-order.entity';
import { BaseStation } from './base-station.entity';

export enum RecoveryStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected'
}

@Entity('recovery_confirmations')
export class RecoveryConfirmation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => DispatchOrder)
  @JoinColumn({ name: 'orderId' })
  order: DispatchOrder;

  @Column()
  orderId: string;

  @ManyToOne(() => BaseStation)
  @JoinColumn({ name: 'stationId' })
  station: BaseStation;

  @Column()
  stationId: string;

  @Column({
    type: 'enum',
    enum: RecoveryStatus,
    default: RecoveryStatus.PENDING
  })
  status: RecoveryStatus;

  @Column({ type: 'timestamp', nullable: true })
  powerRestoredTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  generatorStopTime: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalGenerateDuration: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  totalFuelConsumption: number;

  @Column({ length: 50, nullable: true })
  maintainer: string;

  @Column({ type: 'timestamp', nullable: true })
  maintainerConfirmTime: Date;

  @Column({ length: 50, nullable: true })
  regionalManager: string;

  @Column({ type: 'timestamp', nullable: true })
  managerConfirmTime: Date;

  @Column({ type: 'text', nullable: true })
  managerRemark: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
