import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['studentId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  // Nullable vì login thất bại xảy ra trước khi biết student nào
  @Column({ name: 'student_id', type: 'varchar', length: 20, nullable: true })
  studentId: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 50, nullable: true })
  resourceType: string | null;

  @Column({ name: 'resource_id', type: 'int', nullable: true })
  resourceId: number | null;

  @Column({ name: 'request_id', type: 'varchar', length: 36 })
  requestId: string;

  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
