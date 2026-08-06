import {
    IsInt,
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^CS\d{5}$/, { message: 'Mã môn học không hợp lệ. Định dạng: CS03007' })
    course_id!: string;

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

    @IsDateString()
    start_date!: string;

    @IsDateString()
    end_date!: string;
}
