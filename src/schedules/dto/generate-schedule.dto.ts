import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class GenerateScheduleDto {
  @ApiProperty({
    example: 'HK1-2025',
  })
  @IsString()
  @IsNotEmpty()
  semester_id!: string;

  @ApiProperty({
    example: 200,
    required: false,
    default: 200,
  })
  @IsNumber()
  @IsOptional()
  max_solutions?: number;
}