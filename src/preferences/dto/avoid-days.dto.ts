import { IsArray, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AvoidDaysDto {
  @ApiProperty({
    description: 'Mảng các thứ trong tuần muốn tránh (2 = Thứ 2, ..., 8 = Chủ Nhật)',
    type: [Number],
    example: [2, 8],
  })
  @IsArray()
  @IsNotEmpty()
  @IsInt({ each: true })
  @Min(2, { each: true })
  @Max(8, { each: true })
  days: number[];
}
