import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateStudentDto {
  @ApiProperty({
    example: 'Nguyễn Bảo Khang',
    description: 'Tên hiển thị mới',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    example: 'OldPassword123',
    description: 'Mật khẩu cũ (bắt buộc khi muốn đổi mật khẩu mới)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Mật khẩu cũ phải có ít nhất 8 ký tự.' })
  old_password?: string;

  @ApiProperty({
    example: 'NewPassword456',
    description: 'Mật khẩu mới',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 số.',
  })
  password?: string;
}

