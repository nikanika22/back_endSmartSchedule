import { Course } from '../../courses/entities/course.entity';
import { Semester } from '../../semesters/entities/semester.entity';
import {
    Check,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';

@Entity('classes')
@Check('"day_of_week" BETWEEN 2 AND 8')
@Check('"end_time" > "start_time"')
@Check('"max_students" > 0')
export class ClassEntity {
    @PrimaryColumn({ name: 'class_id', type: 'varchar', length: 20 })
    class_id!: string;

    // FK → courses
    @ManyToOne(() => Course, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'course_id', referencedColumnName: 'course_id' })
    course!: Course;

    @Column({ name: 'course_id', type: 'varchar', length: 20 })
    course_id!: string;

    // FK → semesters
    @ManyToOne(() => Semester, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'semester_id', referencedColumnName: 'semester_id' })
    semester!: Semester;

    @Column({ name: 'semester_id', type: 'varchar', length: 10 })
    semester_id!: string;

    @Column({ name: 'day_of_week', type: 'smallint' })
    day_of_week!: number;

    @Column({ name: 'start_time', type: 'time' })
    start_time!: string;

    @Column({ name: 'end_time', type: 'time' })
    end_time!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    room!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    instructor!: string;

    @Column({ name: 'max_students', type: 'smallint' })
    max_students!: number;
}
