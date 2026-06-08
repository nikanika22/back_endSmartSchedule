import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableCheck,
  TableForeignKey,
} from 'typeorm';

export class CreateStudySessionsAndBlacklist1710000009000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============================================
    // Bảng STUDY_SESSIONS (UC-10)
    // FIX 3NF: Không có student_id — transitive dependency
    // student_id lấy qua: SELECT s.student_id FROM schedules s WHERE s.schedule_id = ?
    // =============================================
    await queryRunner.createTable(
      new Table({
        name: 'study_sessions',
        columns: [
          {
            name: 'session_id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'schedule_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'course_id',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'day_of_week',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'time',
            isNullable: false,
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_study_day',
            columnNames: ['day_of_week'],
            expression: '"day_of_week" BETWEEN 2 AND 8',
          }),
          new TableCheck({
            name: 'chk_study_time',
            columnNames: ['start_time', 'end_time'],
            expression: '"end_time" > "start_time"',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'study_sessions',
      new TableForeignKey({
        name: 'fk_study_sessions_schedule_id',
        columnNames: ['schedule_id'],
        referencedTableName: 'schedules',
        referencedColumnNames: ['schedule_id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'study_sessions',
      new TableForeignKey({
        name: 'fk_study_sessions_course_id',
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['course_id'],
        onDelete: 'RESTRICT',
      }),
    );

    // =============================================
    // Bảng TOKEN_BLACKLIST (UC-02 logout)
    // Lưu các JTI (JWT ID) đã logout để Guard từ chối
    // =============================================
    await queryRunner.createTable(
      new Table({
        name: 'token_blacklist',
        columns: [
          {
            name: 'jti',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            comment: 'UUID từ JWT payload',
          },
          {
            name: 'student_id',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
            comment: 'TTL token gốc — dùng để cleanup định kỳ',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'token_blacklist',
      new TableForeignKey({
        name: 'fk_token_blacklist_student_id',
        columnNames: ['student_id'],
        referencedTableName: 'students',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );

    // Index để Cleanup job chạy nhanh (xóa token hết hạn định kỳ)
    await queryRunner.createIndex(
      'token_blacklist',
      new TableIndex({
        name: 'idx_token_blacklist_expires',
        columnNames: ['expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('token_blacklist');
    await queryRunner.dropTable('study_sessions');
  }
}
