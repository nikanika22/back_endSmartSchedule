import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateStudents1710000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'students',
        columns: [
          {
            name: 'student_id',
            type: 'varchar',
            length: '20',
            isPrimary: true,
            comment: 'MSSV',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '150',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'bcrypt (rounds=12)',
          },
          {
            name: 'role',
            type: 'user_role',
            isNullable: false,
            default: `'student'`,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Index tăng tốc tìm kiếm theo email (dùng nhiều ở Auth)
    await queryRunner.createIndex(
      'students',
      new TableIndex({
        name: 'idx_students_email',
        columnNames: ['email'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('students');
  }
}
