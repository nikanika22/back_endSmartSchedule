import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class UpdateClassDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    course_id!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    semester_id!: string;

    @IsInt()
    @Min(2)
    @Max(8)
    day_of_week!: number;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    start_time!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    end_time!: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    room?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    instructor?: string;

    @IsInt()
    @Min(1)
    max_students!: number;
}
