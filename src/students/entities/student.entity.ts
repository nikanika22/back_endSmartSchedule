import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
}

@Entity('students')
export class Student {
  @PrimaryColumn({ name: 'student_id', type: 'varchar', length: 20 })
  student_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;
  @Column({ name: 'created_at', type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;
}
