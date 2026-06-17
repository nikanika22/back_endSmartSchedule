import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDTO {
  @ApiProperty({ example: 'dh52200843@student.stu.edu.vn' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
  @ApiProperty({ example: 'Baokhang08112004' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
