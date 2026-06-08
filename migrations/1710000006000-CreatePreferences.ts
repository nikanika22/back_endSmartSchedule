import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableForeignKey,
} from 'typeorm';

export class CreatePreferences1710000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // =============================================
    // Bảng PREFERENCES (SRS 5.2.5)
    // Quan hệ 1-1 với students (UNIQUE trên student_id)
    // =============================================
    await queryRunner.createTable(
      new Table({
        name: 'preferences',
        columns: [
          {
            name: 'pref_id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'student_id',
            type: 'varchar',
            length: '20',
            isNullable: false,
            isUnique: true, // <-- Đây là dấu hiệu quan hệ 1-1
          },
          {
            name: 'preferred_slot',
            type: 'preferred_slot',
            isNullable: true,
          },
          {
            name: 'min_break_minutes',
            type: 'smallint',
            isNullable: false,
            default: 15,
          },
          {
            name: 'w_break',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: false,
            default: 0.4,
          },
          {
            name: 'w_preference',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: false,
            default: 0.3,
          },
          {
            name: 'w_balance',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: false,
            default: 0.3,
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_min_break',
            columnNames: ['min_break_minutes'],
            expression: '"min_break_minutes" >= 0',
          }),
          new TableCheck({
            name: 'chk_weights_range',
            columnNames: ['w_break', 'w_preference', 'w_balance'],
            expression:
              '"w_break" BETWEEN 0 AND 1 AND "w_preference" BETWEEN 0 AND 1 AND "w_balance" BETWEEN 0 AND 1',
          }),
          new TableCheck({
            name: 'chk_weights_sum',
            columnNames: ['w_break', 'w_preference', 'w_balance'],
            expression:
              'ROUND("w_break" + "w_preference" + "w_balance", 2) = 1.00',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'preferences',
      new TableForeignKey({
        name: 'fk_preferences_student_id',
        columnNames: ['student_id'],
        referencedTableName: 'students',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );

    // =============================================
    // Bảng PREFERENCE_AVOID_DAYS (SRS 5.2.6)
    // Tách từ Preferences để đảm bảo 1NF
    // =============================================
    await queryRunner.createTable(
      new Table({
        name: 'preference_avoid_days',
        columns: [
          {
            name: 'pref_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'day_of_week',
            type: 'smallint',
            isNullable: false,
            comment: '2=T2 … 8=CN',
          },
        ],
        checks: [
          new TableCheck({
            name: 'chk_avoid_day',
            columnNames: ['day_of_week'],
            expression: '"day_of_week" BETWEEN 2 AND 8',
          }),
        ],
      }),
      true,
    );

    // Composite PK cho preference_avoid_days
    await queryRunner.query(`
      ALTER TABLE "preference_avoid_days"
      ADD CONSTRAINT "PK_preference_avoid_days"
      PRIMARY KEY ("pref_id", "day_of_week")
    `);

    await queryRunner.createForeignKey(
      'preference_avoid_days',
      new TableForeignKey({
        name: 'fk_avoid_days_pref_id',
        columnNames: ['pref_id'],
        referencedTableName: 'preferences',
        referencedColumnNames: ['pref_id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('preference_avoid_days');
    await queryRunner.dropTable('preferences');
  }
}
