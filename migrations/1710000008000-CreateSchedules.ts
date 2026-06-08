import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableCheck,
  TableForeignKey,
} from 'typeorm';

export class CreateSchedules1710000008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============================================
    // Bảng SCHEDULES (SRS 5.2.8)
    // Lưu phương án thời khóa biểu (snapshot)
    // =============================================
    await queryRunner.createTable(
      new Table({
        name: 'schedules',
        columns: [
          {
            name: 'schedule_id',
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
            name: 'semester_id',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            // Denormalization có chủ đích — lưu snapshot tại thời điểm generate
            // Tránh sai lệch khi weights trong Preferences thay đổi sau này
            name: 'score_total',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: false,
            comment: '[0.0000 – 1.0000]',
          },
          {
            name: 'score_break',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'score_pref',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'score_balance',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: false,
          },
          {
            name: 'is_draft',
            type: 'boolean',
            isNullable: false,
            default: true,
            comment: 'TRUE = chưa lưu chính thức',
          },
          {
            name: 'is_selected',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: 'Sinh viên đã chọn phương án này',
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: 'Phương án đang hiển thị chính',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'NOW()',
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_score_total',
            columnNames: ['score_total'],
            expression: '"score_total" BETWEEN 0 AND 1',
          }),
          new TableCheck({
            name: 'chk_score_break',
            columnNames: ['score_break'],
            expression: '"score_break" BETWEEN 0 AND 1',
          }),
          new TableCheck({
            name: 'chk_score_pref',
            columnNames: ['score_pref'],
            expression: '"score_pref" BETWEEN 0 AND 1',
          }),
          new TableCheck({
            name: 'chk_score_balance',
            columnNames: ['score_balance'],
            expression: '"score_balance" BETWEEN 0 AND 1',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'schedules',
      new TableForeignKey({
        name: 'fk_schedules_student_id',
        columnNames: ['student_id'],
        referencedTableName: 'students',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'schedules',
      new TableForeignKey({
        name: 'fk_schedules_semester_id',
        columnNames: ['semester_id'],
        referencedTableName: 'semesters',
        referencedColumnNames: ['semester_id'],
        onDelete: 'RESTRICT',
      }),
    );

    // Partial Unique Index: mỗi sinh viên chỉ có 1 phương án is_active=TRUE mỗi học kỳ
    await queryRunner.createIndex(
      'schedules',
      new TableIndex({
        name: 'uidx_schedules_one_active_per_student_semester',
        columnNames: ['student_id', 'semester_id'],
        isUnique: true,
        where: '"is_active" = TRUE',
      }),
    );

    // =============================================
    // Bảng SCHEDULE_CLASSES — Bảng trung gian N-N
    // (Một phương án có nhiều lớp, một lớp có thể nằm trong nhiều phương án)
    // =============================================
    await queryRunner.createTable(
      new Table({
        name: 'schedule_classes',
        columns: [
          {
            name: 'schedule_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'class_id',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.query(`
      ALTER TABLE "schedule_classes"
      ADD CONSTRAINT "PK_schedule_classes"
      PRIMARY KEY ("schedule_id", "class_id")
    `);

    await queryRunner.createForeignKey(
      'schedule_classes',
      new TableForeignKey({
        name: 'fk_schedule_classes_schedule_id',
        columnNames: ['schedule_id'],
        referencedTableName: 'schedules',
        referencedColumnNames: ['schedule_id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'schedule_classes',
      new TableForeignKey({
        name: 'fk_schedule_classes_class_id',
        columnNames: ['class_id'],
        referencedTableName: 'classes',
        referencedColumnNames: ['class_id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('schedule_classes');
    await queryRunner.dropTable('schedules');
  }
}
