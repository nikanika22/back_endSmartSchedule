import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditLogs1710000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          { name: 'id',            type: 'bigserial', isPrimary: true },
          { name: 'student_id',    type: 'varchar',   length: '20', isNullable: true },
          { name: 'action',        type: 'varchar',   length: '50', isNullable: false },
          { name: 'resource_type', type: 'varchar',   length: '50', isNullable: true },
          { name: 'resource_id',   type: 'int',                     isNullable: true },
          { name: 'request_id',    type: 'varchar',   length: '36', isNullable: false },
          { name: 'status_code',   type: 'int',                     isNullable: false },
          { name: 'duration_ms',   type: 'int',                     isNullable: false },
          { name: 'metadata',      type: 'jsonb',                   isNullable: true },
          { name: 'ip_address',    type: 'varchar',   length: '45', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
        ],
        // Không đặt FK từ student_id
        // login thất bại chưa biết student nào → nếu có FK sẽ vi phạm constraint
      }),
      true,
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'idx_audit_logs_student_created',
        columnNames: ['student_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
