import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreatePersonalEventDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    student_id!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsInt()
    @Min(2)
    @Max(8)
    day_of_week?: number;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    start_time!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    end_time!: string;

    @IsOptional()
    @IsBoolean()
    is_recurring?: boolean;

    @IsOptional()
    @IsString()
    note?: string;
}
