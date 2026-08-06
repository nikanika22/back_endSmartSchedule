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

export class CreateClassDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^CS\d{5}_\d{2}$/, {
        message: 'Mã lớp không hợp lệ. Định dạng: CS03007_01',
    })
    class_id!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^CS\d{5}$/, {
        message: 'Mã môn học không hợp lệ. Định dạng: CS03007',
    })
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
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
        message: 'Giờ bắt đầu không hợp lệ. Định dạng: HH:MM (VD: 07:00)',
    })
    start_time!: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
        message: 'Giờ kết thúc không hợp lệ. Định dạng: HH:MM (VD: 09:30)',
    })
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
