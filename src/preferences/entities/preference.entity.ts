import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { PreferenceAvoidDay } from './preference-avoid-day.entity';

export enum PreferredSlot {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

@Entity('preferences')
export class Preference {
  @PrimaryGeneratedColumn({ name: 'pref_id' })
  pref_id: number;

  @Column({ name: 'student_id', type: 'varchar', length: 20, unique: true })
  student_id: string;

  @OneToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({
    name: 'preferred_slot',
    type: 'enum',
    enum: ['morning', 'afternoon', 'evening'],
    nullable: true,
    transformer: {
      to: (value: PreferredSlot) => value ? value.toLowerCase() : null,
      from: (value: string) => value ? value.toUpperCase() as PreferredSlot : null,
    },
  })
  preferred_slot: PreferredSlot;

  @Column({ name: 'min_break_minutes', type: 'smallint', default: 15 })
  min_break_minutes: number;

  @Column({
    name: 'w_break',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.40,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  w_break: number;

  @Column({
    name: 'w_preference',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.30,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  w_preference: number;

  @Column({
    name: 'w_balance',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.30,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  w_balance: number;

  @OneToMany(() => PreferenceAvoidDay, (avoidDay) => avoidDay.preference, {
    cascade: true,
  })
  avoid_days: PreferenceAvoidDay[];
}
