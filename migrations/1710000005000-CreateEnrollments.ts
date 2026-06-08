import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateEnrollments1710000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'enrollments',
        columns: [
          {
            name: 'student_id',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'course_id',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'semester_id',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'enrolled_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
        ],
        // Composite PK = không thể đăng ký cùng 1 môn 2 lần trong cùng 1 học kỳ
        uniques: [
          {
            name: 'PK_enrollments',
            columnNames: ['student_id', 'course_id', 'semester_id'],
          },
        ],
      }),
      true,
    );

    // Composite PK thực sự
    await queryRunner.query(`
      ALTER TABLE "enrollments"
      ADD CONSTRAINT "PK_enrollments_composite"
      PRIMARY KEY ("student_id", "course_id", "semester_id")
    `);

    await queryRunner.createForeignKey(
      'enrollments',
      new TableForeignKey({
        name: 'fk_enrollments_student_id',
        columnNames: ['student_id'],
        referencedTableName: 'students',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'enrollments',
      new TableForeignKey({
        name: 'fk_enrollments_course_id',
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['course_id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'enrollments',
      new TableForeignKey({
        name: 'fk_enrollments_semester_id',
        columnNames: ['semester_id'],
        referencedTableName: 'semesters',
        referencedColumnNames: ['semester_id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('enrollments');
  }
}
