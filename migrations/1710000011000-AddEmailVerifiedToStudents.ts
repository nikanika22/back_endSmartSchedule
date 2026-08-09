import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailVerifiedToStudents1710000011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('students', 'email_verified');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'students',
        new TableColumn({
          name: 'email_verified',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('students', 'email_verified');
    if (hasColumn) {
      await queryRunner.dropColumn('students', 'email_verified');
    }
  }
}
