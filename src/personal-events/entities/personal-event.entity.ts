import { Student } from './../../students/entities/student.entity';
import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('personal_events')
@Check('"day_of_week" IS NULL OR "day_of_week" BETWEEN 2 AND 8')
@Check('"end_time" > "start_time"')
@Check('"end_date" >= "start_date"')
export class PersonalEvent {
    @PrimaryGeneratedColumn('increment')
    event_id!: number;

    @ManyToOne(() => Student, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'student_id', referencedColumnName: 'student_id' })
    student!: Student;

    @Column({ name: 'student_id', type: 'varchar', length: 20 })
    student_id!: string;

    @Column({ type: 'varchar', length: 200 })
    title!: string;

    @Column({ type: 'smallint', nullable: true })
    day_of_week!: number;

    @Column({ name: 'start_time', type: 'time' })
    start_time!: string;

    @Column({ name: 'end_time', type: 'time' })
    end_time!: string;

    @Column({ name: 'start_date', type: 'date' })
    start_date!: Date;

    @Column({ name: 'end_date', type: 'date' })
    end_date!: Date;

    @Column({ name: 'is_recurring', type: 'boolean', default: false })
    is_recurring!: boolean;

    @Column({ type: 'text', nullable: true })
    note!: string;
}
