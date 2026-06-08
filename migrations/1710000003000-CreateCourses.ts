import { MigrationInterface, QueryRunner, Table, TableCheck } from 'typeorm';

export class CreateCourses1710000003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'courses',
        columns: [
          {
            name: 'course_id',
            type: 'varchar',
            length: '20',
            isPrimary: true,
          },
          {
            name: 'course_name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'credits',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'department',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'NULL = không bắt buộc',
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_credits',
            columnNames: ['credits'],
            expression: '"credits" > 0',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('courses');
  }
}
