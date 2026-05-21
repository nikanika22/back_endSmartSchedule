import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @Matches(/^DH\d{6,15}$/i, {
    message: 'MSSV sai định dạng. Ví dụ đúng: DH52200762',
  })
  student_id: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^dh\d+@student\.stu\.edu\.vn$/, {
    message:
      'Email phải thuộc trường STU, ví dụ: dh52200762@student.stu.edu.vn',
  })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 số.',
  })
  password: string;
}
