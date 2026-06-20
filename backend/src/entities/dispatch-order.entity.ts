import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseStation } from './base-station.entity';
import { Generator } from './generator.entity';

export enum DispatchOrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  ARRIVED = 'arrived',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('dispatch_orders')
export class DispatchOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  orderNo: string;

  @ManyToOne(() => BaseStation)
  @JoinColumn({ name: 'stationId' })
  station: BaseStation;

  @Column()
  stationId: string;

  @ManyToOne(() => Generator, { nullable: true })
  @JoinColumn({ name: 'generatorId' })
  generator: Generator;

  @Column({ nullable: true })
  generatorId: string;

  @Column({ length: 50, nullable: true })
  oilBucketCode: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  oilBucketCapacity: number;

  @Column({
    type: 'enum',
    enum: DispatchOrderStatus,
    default: DispatchOrderStatus.PENDING
  })
  status: DispatchOrderStatus;

  @Column({ type: 'timestamp', nullable: true })
  powerOutTime: Date;

  @Column({ length: 50, nullable: true })
  dispatcher: string;

  @Column({ type: 'timestamp', nullable: true })
  dispatchTime: Date;

  @Column({ length: 50, nullable: true })
  maintenanceTeam: string;

  @Column({ length: 50, nullable: true })
  teamLeader: string;

  @Column({ length: 20, nullable: true })
  teamPhone: string;

  @Column({ type: 'timestamp', nullable: true })
  arrivalTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  totalDuration: number;

  @Column({ type: 'boolean', default: false })
  generatorReturned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  returnTime: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
