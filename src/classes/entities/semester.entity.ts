import { Check, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('semesters')
@Check('"end_date" > "start_date"')
export class Semester {
    @PrimaryColumn({ name: 'semester_id', type: 'varchar', length: 10 })
    semester_id!: string;

    @Column({ type: 'varchar', length: 50 })
    name!: string;

    @Column({ type: 'date' })
    start_date!: string;

    @Column({ type: 'date' })
    end_date!: string;

    @Column({ name: 'is_active', type: 'boolean', default: false })
    is_active!: boolean;
}
