import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({
    example: 'CS03043',
  })
  @IsString()
  @IsNotEmpty()
  course_id!: string;

  @ApiProperty({
    example: 'HK1-2025',
  })
  @IsString()
  @IsNotEmpty()
  semester_id!: string;
  course_id: string;
}
