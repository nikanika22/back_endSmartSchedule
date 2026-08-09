import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmRegistrationDto {
    @IsString()
    @Matches(/^dh\d+@student\.stu\.edu\.vn$/, {
        message:
            'Email phải thuộc trường STU, ví dụ: dh52200762@student.stu.edu.vn',
    })
    email: string;
    @ApiProperty({
        example: '482913',
    })
    @IsString()
    @Matches(/^\d{6}$/, {
        message:
            'Mã xác minh phải gồm 6 chữ số.',
    })
    otp: string;
}