import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(entry: {
    studentId?: string;
    action: string;
    resourceType?: string;
    resourceId?: number;
    requestId: string;
    statusCode: number;
    durationMs: number;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await this.repo.save({
        studentId:    entry.studentId    ?? null,
        action:       entry.action,
        resourceType: entry.resourceType ?? null,
        resourceId:   entry.resourceId   ?? null,
        requestId:    entry.requestId,
        statusCode:   entry.statusCode,
        durationMs:   entry.durationMs,
        metadata:     entry.metadata     ?? null,
        ipAddress:    entry.ipAddress    ?? null,
      });
    } catch (err) {
      // lỗi ghi log không throw lỗi
      console.error('[AuditLog] Ghi DB thất bại:', err);
    }
  }
}
