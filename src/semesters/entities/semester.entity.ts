import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('semesters')
export class Semester {
  @PrimaryColumn({ name: 'semester_id', type: 'varchar', length: 10 })
  semester_id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  start_date: Date;

  @Column({ name: 'end_date', type: 'date' })
  end_date: Date;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  is_active: boolean;
}
