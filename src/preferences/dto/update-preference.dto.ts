import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PreferredSlot } from '../entities/preference.entity';

export class UpdatePreferenceDto {
  @ApiProperty({
    description: 'Buổi học mong muốn',
    enum: PreferredSlot,
    example: PreferredSlot.MORNING,
  })
  @IsEnum(PreferredSlot)
  @IsNotEmpty()
  preferred_slot: PreferredSlot;
}
