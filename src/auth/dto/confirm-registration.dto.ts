import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmRegistrationDto {
  @ApiProperty({ example: 'dh52200843@student.stu.edu.vn' })
  @IsString()
  email!: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Mã xác minh phải gồm 6 chữ số.' })
  otp!: string;
}
