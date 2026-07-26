import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'auditAction';
export const AuditAction = (action: string, resourceType?: string) =>
  SetMetadata(AUDIT_ACTION_KEY, { action, resourceType });
