import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class GenerateScheduleDto {
  @ApiProperty({
    example: 200,
    required: false,
    default: 200,
  })
  @IsNumber()
  @IsOptional()
  max_solutions?: number;
}