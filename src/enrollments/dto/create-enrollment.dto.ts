import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({
    example: 'CS03043',
  })
  @IsString()
  @IsNotEmpty()
  course_id!: string;

  @ApiProperty({
    example: 'HK1-2025',
    required: false,
  })
  @IsString()
  @IsOptional()
  semester_id?: string;
}
