import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';

@Entity('token_blacklist')
@Index(['expiresAt'])
export class TokenBlacklist {
  @PrimaryColumn({ name: 'jti', length: 36 })
  jti: string;

  @Column({ name: 'student_id', length: 20 })
  studentId: string;

  @CreateDateColumn({ name: 'revoked_at' })
  revokedAt: Date;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
