import { IsString, IsDateString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSemesterDto {
  @ApiProperty({ example: 'HK1-2025', description: 'Mã học kỳ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  semester_id: string;

  @ApiProperty({ example: 'Học kỳ 1 - 2024/2025', description: 'Tên học kỳ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: '2025-01-01', description: 'Ngày bắt đầu' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ example: '2025-06-30', description: 'Ngày kết thúc' })
  @IsDateString()
  end_date: string;
}
