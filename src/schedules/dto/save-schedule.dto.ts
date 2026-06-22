import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveScheduleDto {
  @ApiProperty({
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  schedule_id!: number;

  @ApiProperty({
    example: 'HK1-2025',
  })
  @IsString()
  @IsNotEmpty()
  semester_id!: string;
}