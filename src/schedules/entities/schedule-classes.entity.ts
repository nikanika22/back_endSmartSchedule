import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Schedule } from './schedule.entity';
import { ClassEntity } from 'src/classes/entities/class.entity';

@Entity('schedule_classes')
export class ScheduleClass {
  @PrimaryColumn({ name: 'schedule_id', type: 'int' })
  schedule_id!: number;

  @PrimaryColumn({ name: 'class_id', type: 'varchar', length: 20 })
  class_id!: string;

  @ManyToOne(() => Schedule, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schedule_id', referencedColumnName: 'schedule_id' })
  schedule!: Schedule;

  @ManyToOne(() => ClassEntity, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'class_id', referencedColumnName: 'class_id' })
  class!: ClassEntity;
}
