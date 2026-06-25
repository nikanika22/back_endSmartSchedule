import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Enrollment } from './entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { Semester } from '../semesters/entities/semester.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Semester)
    private readonly semesterRepository: Repository<Semester>,
  ) {}

  async create(student_id: string, createEnrollmentDto: CreateEnrollmentDto) {
    const { course_id } = createEnrollmentDto;
    const activeSemester = await this.semesterRepository.findOne({
      where: { is_active: true }
    });
    
    const course = await this.courseRepository.findOne({
      where: { course_id },
    });
    if (!course) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ENROLLMENT_COURSE_NOT_FOUND',
          message: 'Môn học không tồn tại.',
        },
      });
    }

    // 2. Validate semester tồn tại
    if (!activeSemester) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ENROLLMENT_SEMESTER_NOT_FOUND',
          message: 'Học kỳ không tồn tại.',
        },
      });
    }

    // 3. Check duplicate
    const existing = await this.enrollmentRepository.findOne({
      where: { student_id, course_id, semester_id: activeSemester.semester_id },
    });
    if (existing) {
      return {
        student_id: existing.student_id,
        course_id: existing.course_id,
        semester_id: existing.semester_id,
        enrolled_at: existing.enrolled_at,
      };
    }

    // 4. Save
    const enrollment = this.enrollmentRepository.create({
      student_id,
      course_id,
      semester_id: activeSemester.semester_id || ' ',
      enrolled_at: new Date(),
    });

    const saved = await this.enrollmentRepository.save(enrollment);

    // 5. Return (bỏ relations)
    return {
      student_id: saved.student_id,
      course_id: saved.course_id,
      semester_id: saved.semester_id,
      enrolled_at: saved.enrolled_at,
    };
  }

  async getMyEnrollments(student_id: string) {
    // Tìm học kỳ đang active
    const activeSemester = await this.semesterRepository.findOne({
      where: { is_active: true },
    });
    if (!activeSemester) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ENROLLMENT_SEMESTER_NOT_FOUND',
          message: 'Không tìm thấy học kỳ đang hoạt động.',
        },
      });
    }

    // Lấy enrollments kèm relation course
    const enrollments = await this.enrollmentRepository.find({
      where: { student_id, semester_id: activeSemester.semester_id },
      relations: ['course'],
    });

    return enrollments.map((e) => ({
      course_id: e.course_id,
      course_name: e.course?.course_name ?? '',
      credits: e.course?.credits ?? 0,
      department: e.course?.department ?? '',
      enrolled_at: e.enrolled_at,
      semester_id: e.semester_id,
    }));
  }

  async deleteMyEnrollments(student_id: string) {
    const activeSemester = await this.semesterRepository.findOne({
      where: { is_active: true },
    });
    if (!activeSemester) return;

    await this.enrollmentRepository.delete({
      student_id,
      semester_id: activeSemester.semester_id,
    });
  }
}
