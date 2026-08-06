import {
    IsInt,
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class UpdateCourseDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    course_name!: string;

    @IsInt()
    @Min(1)
    @Max(20)
    credits!: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    department?: string;

    @IsOptional()
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;
}
