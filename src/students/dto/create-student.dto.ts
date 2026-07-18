import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/student.entity';

export class CreateStudentDto {
  @ApiProperty({
    example: 'DH52200843',
  })
  @IsString()
  @Matches(/^DH\d{6,15}$/i, {
    message: 'MSSV sai định dạng. Ví dụ đúng: DH52200762',
  })
  student_id!: string;

  @ApiProperty({
    example: 'Nguyễn Bảo Khang',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'dh52200843@student.stu.edu.vn',
  })
  @IsString()
  @Matches(/^dh\d+@student\.stu\.edu\.vn$/, {
    message:
      'Email phải thuộc trường STU, ví dụ: dh52200762@student.stu.edu.vn',
  })
  email!: string;

  @ApiProperty({
    example: 'Baokhang08112004',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 số.',
  })
  password!: string;

  @ApiProperty({
    example: UserRole.STUDENT,
    enum: UserRole,
    required: false,
    description: 'Quyền của user. Nếu không truyền sẽ mặc định là student',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
