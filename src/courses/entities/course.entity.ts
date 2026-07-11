import { ClassEntity } from 'src/classes/entities/class.entity';
import { Check, Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('courses')
@Check('"credits" > 0')
export class Course {
  @PrimaryColumn({ name: 'course_id', type: 'varchar', length: 20 })
  course_id!: string;

  @Column({ name: 'course_name', type: 'varchar', length: 200 })
  course_name!: string;

  @Column({ type: 'smallint' })
  credits!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department!: string;
  @OneToMany(()=>ClassEntity,(classEntity)=>classEntity.course)
  classes!:ClassEntity[];
}
