import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableForeignKey,
} from 'typeorm';

export class CreatePersonalEvents1710000007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'personal_events',
        columns: [
          {
            name: 'event_id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'student_id',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'day_of_week',
            type: 'smallint',
            isNullable: true,
            comment: 'NULL nếu one-time event',
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
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'is_recurring',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'note',
            type: 'text',
            isNullable: true,
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_event_day',
            columnNames: ['day_of_week'],
            expression:
              '"day_of_week" IS NULL OR "day_of_week" BETWEEN 2 AND 8',
          }),
          new TableCheck({
            name: 'chk_event_time',
            columnNames: ['start_time', 'end_time'],
            expression: '"end_time" > "start_time"',
          }),
          new TableCheck({
            name: 'chk_personal_events_date_range',
            columnNames: ['start_date', 'end_date'],
            expression: '"end_date" >= "start_date"',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'personal_events',
      new TableForeignKey({
        name: 'fk_personal_events_student_id',
        columnNames: ['student_id'],
        referencedTableName: 'students',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('personal_events');
  }
}
