import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async createUser(userData: CreateStudentDto) {
    //Kiểm tra MSSV đã tồn tại chưa
    const existingById = await this.studentRepository.findOne({
      where: { student_id: userData.student_id },
    });
    if (existingById) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'AUTH_STUDENT_ID_ALREADY_EXISTS',
          message: 'MSSV này đã được đăng ký.',
        },
      });
    }

    //Kiểm tra Email đã tồn tại chưa
    const existingByEmail = await this.findByEmail(userData.email);
    if (existingByEmail) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'AUTH_EMAIL_ALREADY_EXISTS',
          message: 'Email này đã được đăng ký.',
        },
      });
    }

    //Mã hóa mật khẩu bằng bcrypt
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const student = this.studentRepository.create({
      student_id: userData.student_id,
      name: userData.name,
      email: userData.email,
      password_hash: passwordHash,
      role: userData.role, // Nếu không truyền, mặc định sẽ là 'student' do TypeORM xử lý
      created_at: new Date(),
    });

    return await this.studentRepository.save(student);
  }
  async validate(email: string, password: string) {
    const student = await this.findByEmail(email);
    if (student && (await bcrypt.compare(password, student.password_hash)))
      return student;
    else return null;
  }
  async findByEmail(email: string) {
    const student = await this.studentRepository.findOneBy({ email });
    return student;
  }

  findAll() {
    return `This action returns all students`;
  }

  findOne(id: number) {
    return `This action returns a #${id} student`;
  }

  async updateUser(student_id: string, userData: UpdateStudentDto) {
    const student = await this.studentRepository.findOneBy({ student_id });
    if (!student) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Không tìm thấy sinh viên.',
        },
      });
    }

    if (userData.name) {
      student.name = userData.name;
    }

    if (userData.password) {
      if (!userData.old_password) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'AUTH_MISSING_OLD_PASSWORD',
            message: 'Vui lòng nhập mật khẩu cũ để đổi mật khẩu.',
          },
        });
      }

      const isPasswordValid = await bcrypt.compare(userData.old_password, student.password_hash);
      if (!isPasswordValid) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'AUTH_INVALID_OLD_PASSWORD',
            message: 'Mật khẩu cũ không chính xác.',
          },
        });
      }

      student.password_hash = await bcrypt.hash(userData.password, 10);
    }

    return await this.studentRepository.save(student);
  }

  remove(id: number) {
    return `This action removes a #${id} student`;
  }
}
