import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableCheck,
  TableForeignKey,
} from 'typeorm';

export class CreateClasses1710000004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'classes',
        columns: [
          {
            name: 'class_id',
            type: 'varchar',
            length: '20',
            isPrimary: true,
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
            name: 'day_of_week',
            type: 'smallint',
            isNullable: false,
            comment: '2=T2 … 8=CN',
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
          {
            name: 'room',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'instructor',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'max_students',
            type: 'smallint',
            isNullable: false,
          },
          {
            name: 'enrolled_count',
            type: 'smallint',
            isNullable: false,
            default: 0,
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_class_day',
            columnNames: ['day_of_week'],
            expression: '"day_of_week" BETWEEN 2 AND 8',
          }),
          new TableCheck({
            name: 'chk_class_time',
            columnNames: ['start_time', 'end_time'],
            expression: '"end_time" > "start_time"',
          }),
          new TableCheck({
            name: 'chk_class_max_stu',
            columnNames: ['max_students'],
            expression: '"max_students" > 0',
          }),
          new TableCheck({
            name: 'chk_class_enrolled_count',
            columnNames: ['enrolled_count', 'max_students'],
            expression:
              '"enrolled_count" >= 0 AND "enrolled_count" <= "max_students"',
          }),
        ],
      }),
      true,
    );

    // Foreign Keys
    await queryRunner.createForeignKey(
      'classes',
      new TableForeignKey({
        name: 'fk_classes_course_id',
        columnNames: ['course_id'],
        referencedTableName: 'courses',
        referencedColumnNames: ['course_id'],
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'classes',
      new TableForeignKey({
        name: 'fk_classes_semester_id',
        columnNames: ['semester_id'],
        referencedTableName: 'semesters',
        referencedColumnNames: ['semester_id'],
        onDelete: 'RESTRICT',
      }),
    );

    // Composite Index: lọc theo học kỳ + môn
    await queryRunner.createIndex(
      'classes',
      new TableIndex({
        name: 'idx_classes_semester_course',
        columnNames: ['semester_id', 'course_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('classes');
  }
}
