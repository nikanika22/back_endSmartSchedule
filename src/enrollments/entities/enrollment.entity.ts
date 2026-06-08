import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Course } from '../../courses/entities/course.entity';
import { Semester } from '../../semesters/entities/semester.entity';

@Entity('enrollments')
export class Enrollment {
  @PrimaryColumn({ name: 'student_id', type: 'varchar', length: 20 })
  student_id: string;

  @PrimaryColumn({ name: 'course_id', type: 'varchar', length: 20 })
  course_id: string;

  @PrimaryColumn({ name: 'semester_id', type: 'varchar', length: 10 })
  semester_id: string;

  @Column({ name: 'enrolled_at', type: 'timestamp', default: () => 'NOW()' })
  enrolled_at: Date;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @ManyToOne(() => Semester)
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;
}
