import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty()
  semester_id: string;

  @IsNumber()
  @IsOptional()
  score_total?: number;

  @IsNumber()
  @IsOptional()
  score_break?: number;

  @IsNumber()
  @IsOptional()
  score_pref?: number;

  @IsNumber()
  @IsOptional()
  score_balance?: number;

  @IsBoolean()
  @IsOptional()
  is_draft?: boolean;

  @IsBoolean()
  @IsOptional()
  is_selected?: boolean;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
