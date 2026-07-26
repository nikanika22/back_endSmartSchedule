import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const auditMeta = this.reflector.get<{ action: string; resourceType?: string }>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap((responseBody) => {
        const durationMs = Date.now() - startTime;
        const statusCode = res.statusCode;
        const studentId: string | undefined = req.user?.student_id;

        // Structured json log ra console
        this.logger.log(
          JSON.stringify({
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode,
            durationMs,
            studentId: studentId ?? null,
            action: auditMeta?.action ?? null,
          }),
        );

        // Lưu db — chỉ khi endpoint có @AuditAction
        if (auditMeta) {
          const rawId =
            responseBody?.id ??
            responseBody?.schedule_id ??
            responseBody?.event_id;
          const resourceId =
            rawId != null
              ? Number(rawId)
              : req.params?.id != null
                ? Number(req.params.id)
                : undefined;

          this.auditLogService.log({
            studentId,
            action: auditMeta.action,
            resourceType: auditMeta.resourceType,
            resourceId,
            requestId: req.requestId,
            statusCode,
            durationMs,
            metadata: this.buildMetadata(auditMeta.action, req.body, responseBody),
            ipAddress: req.ip,
          });
        }
      }),
    );
  }

  private buildMetadata(action: string, body: any, responseBody: any) {
    if (action === 'GENERATE_SCHEDULE') {
      return {
        algorithm: body?.algorithm ?? 'cp_sat',
        numOptions: Array.isArray(responseBody) ? responseBody.length : undefined,
      };
    }
    if (action === 'CONFIRM_SCHEDULE') {
      return { scheduleId: body?.scheduleId ?? body?.schedule_id };
    }
    return undefined;
  }
}
