import { ApiProperty } from '@nestjs/swagger';
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
    @ApiProperty({
        example: 'Đi làm thêm',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title!: string;

    @ApiProperty({
        example: 5,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(2)
    @Max(8)
    day_of_week?: number;

    @ApiProperty({
        example: '18:00:00',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    start_time!: string;

    @ApiProperty({
        example: '22:00:00',
    })
    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    end_time!: string;

    @ApiProperty({
        example: true,
        required: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    is_recurring?: boolean;

    @ApiProperty({
        example: 'Làm ca tối tại cửa hàng tiện lợi',
        required: false,
    })
    @IsOptional()
    @IsString()
    note?: string;
}
