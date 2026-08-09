import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Semester } from '../../semesters/entities/semester.entity';
import { ScheduleClass } from './schedule-classes.entity';

@Entity('schedules')
@Check('"score_total" >= 0 AND "score_total" <= 1')
@Check('"score_break" >= 0 AND "score_break" <= 1')
@Check('"score_pref" >= 0 AND "score_pref" <= 1')
@Check('"score_balance" >= 0 AND "score_balance" <= 1')
export class Schedule {
  @PrimaryGeneratedColumn('increment')
  schedule_id!: number;

  @ManyToOne(() => Student, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id', type: 'varchar', length: 20 })
  student_id!: string;

  @ManyToOne(() => Semester, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'semester_id', referencedColumnName: 'semester_id' })
  semester!: Semester;

  @Column({ name: 'semester_id', type: 'varchar', length: 10 })
  semester_id!: string;

  @Column({
    name: 'score_total',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
  })
  score_total!: number;

  @Column({
    name: 'score_break',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
  })
  score_break!: number;

  @Column({
    name: 'score_pref',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
  })
  score_pref!: number;

  @Column({
    name: 'score_balance',
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
  })
  score_balance!: number;

  @Column({ name: 'algorithm', type: 'varchar', length: 50, nullable: true })
  algorithm!: string;

  @Column({ name: 'is_draft', type: 'boolean', default: true })
  is_draft!: boolean;

  @Column({ name: 'is_selected', type: 'boolean', default: false })
  is_selected!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  is_active!: boolean;

  @OneToMany(() => ScheduleClass, (scheduleClass) => scheduleClass.schedule, {
    cascade: ['insert'],
  })
  scheduleClasses!: ScheduleClass[];

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;
}
