import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateCourseDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
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
}
