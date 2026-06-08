import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableCheck,
} from 'typeorm';

export class CreateSemesters1710000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo ENUM user_role (dùng cho bảng students)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('student', 'admin');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // Tạo ENUM preferred_slot (dùng cho bảng preferences)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE preferred_slot AS ENUM ('morning', 'afternoon', 'evening');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // Tạo bảng semesters
    await queryRunner.createTable(
      new Table({
        name: 'semesters',
        columns: [
          {
            name: 'semester_id',
            type: 'varchar',
            length: '10',
            isPrimary: true,
            comment: 'Ví dụ: "20241" = HK1 năm 2024-2025',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Ví dụ: "Học kỳ 1 – 2024/2025"',
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
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: false,
            comment: 'TRUE = học kỳ hiện tại đang diễn ra',
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_semester_dates',
            columnNames: ['start_date', 'end_date'],
            expression: '"end_date" > "start_date"',
          }),
        ],
      }),
      true,
    );

    // Partial unique index: Chỉ 1 học kỳ active tại một thời điểm
    await queryRunner.createIndex(
      'semesters',
      new TableIndex({
        name: 'uidx_semesters_one_active',
        columnNames: ['is_active'],
        isUnique: true,
        where: '"is_active" = TRUE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('semesters');
    await queryRunner.query(`DROP TYPE IF EXISTS preferred_slot`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
  }
}
