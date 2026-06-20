import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BaseStationLevel {
  CORE = 'core',
  IMPORTANT = 'important',
  NORMAL = 'normal'
}

export enum BaseStationStatus {
  NORMAL = 'normal',
  POWER_OUT = 'power_out',
  GENERATING = 'generating',
  RESTORED = 'restored'
}

@Entity('base_stations')
export class BaseStation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 200 })
  address: string;

  @Column({
    type: 'enum',
    enum: BaseStationLevel,
    default: BaseStationLevel.NORMAL
  })
  level: BaseStationLevel;

  @Column({
    type: 'enum',
    enum: BaseStationStatus,
    default: BaseStationStatus.NORMAL
  })
  status: BaseStationStatus;

  @Column({ length: 50, nullable: true })
  region: string;

  @Column({ length: 50, nullable: true })
  manager: string;

  @Column({ length: 20, nullable: true })
  managerPhone: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
