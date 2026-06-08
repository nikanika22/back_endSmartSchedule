import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('semesters')
export class Semester {
  @PrimaryColumn()
  semester_id: number;

  @Column()
  name: string;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;
  @Column()
  is_active: boolean;
}
