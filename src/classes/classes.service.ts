import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassEntity } from './entities/class.entity';
import { Semester } from '../semesters/entities/semester.entity';

@Injectable()
export class ClassesService {
    constructor(
        @InjectRepository(ClassEntity)
        private readonly classRepository: Repository<ClassEntity>,
        @InjectRepository(Course)
        private readonly courseRepository: Repository<Course>,
        @InjectRepository(Semester)
        private readonly semesterRepository: Repository<Semester>,
    ) {}

    async create(createClassDto: CreateClassDto): Promise<ClassEntity> {
        const existing = await this.classRepository.findOne({
            where: { class_id: createClassDto.class_id },
        });

        if (existing) {
            throw new ConflictException({
                success: false,
                error: {
                    code: 'CLASS_ID_ALREADY_EXISTS',
                    message: `Mã nhóm lớp '${createClassDto.class_id}' đã tồn tại.`,
                },
            });
        }

        if (!createClassDto.class_id.startsWith(`${createClassDto.course_id}_`)) {
            throw new BadRequestException({
                success: false,
                error: {
                    code: 'CLASSID_NOT_VALID',
                    message: 'Mã lớp phải có tiền tố là mã của môn học',
                },
            });
        }

        const semester = await this.semesterRepository.findOne({
            where: { semester_id: createClassDto.semester_id },
        });
        if (!semester) {
            throw new NotFoundException({
                success: false,
                error: {
                    code: 'SEMESTER_NOT_FOUND',
                    message: `Học kỳ '${createClassDto.semester_id}' không tồn tại.`,
                },
            });
        }

        const course = await this.courseRepository.findOne({
            where: { course_id: createClassDto.course_id },
        });
        if (!course) {
            throw new NotFoundException({
                success: false,
                error: {
                    code: 'COURSE_NOT_FOUND',
                    message: `Môn học '${createClassDto.course_id}' không tồn tại.`,
                },
            });
        }

        if (createClassDto.end_time <= createClassDto.start_time) {
            throw new BadRequestException({
                success: false,
                error: {
                    code: 'INVALID_TIME_RANGE',
                    message: 'Giờ kết thúc phải sau giờ bắt đầu.',
                },
            });
        }

        const classEntity = this.classRepository.create(createClassDto);
        return await this.classRepository.save(classEntity);
    }

    async findAll(): Promise<ClassEntity[]> {
        return await this.classRepository.find({
            relations: ['course', 'semester'],
            order: { class_id: 'ASC' },
        });
    }

    async findByCourse(courseId: string): Promise<ClassEntity[]> {
        const course = await this.courseRepository.findOne({
            where: { course_id: courseId },
        });

        if (!course) {
            throw new NotFoundException({
                success: false,
                error: {
                    code: 'COURSE_NOT_FOUND',
                    message: `Không tìm thấy môn học với mã: ${courseId}`,
                },
            });
        }

        return await this.classRepository.find({
            where: { course_id: courseId },
            relations: ['semester'],
            order: { semester_id: 'DESC', day_of_week: 'ASC', start_time: 'ASC' },
        });
    }

    async findOne(id: string): Promise<ClassEntity> {
        const classEntity = await this.classRepository.findOne({
            where: { class_id: id },
            relations: ['course', 'semester'],
        });

        if (!classEntity) {
            throw new NotFoundException({
                success: false,
                error: {
                    code: 'CLASS_NOT_FOUND',
                    message: `Không tìm thấy nhóm lớp với mã: ${id}`,
                },
            });
        }

        return classEntity;
    }

    async update(
        id: string,
        updateClassDto: UpdateClassDto,
    ): Promise<ClassEntity> {
        await this.findOne(id);

        if (updateClassDto.course_id) {
            const course = await this.courseRepository.findOne({
                where: { course_id: updateClassDto.course_id },
            });
            if (!course) {
                throw new BadRequestException({
                    success: false,
                    error: {
                        code: 'COURSE_NOT_FOUND',
                        message: `Không tìm thấy môn học với mã: ${updateClassDto.course_id}`,
                    },
                });
            }
        }

        if (updateClassDto.semester_id) {
            const semester = await this.semesterRepository.findOne({
                where: { semester_id: updateClassDto.semester_id },
            });
            if (!semester) {
                throw new BadRequestException({
                    success: false,
                    error: {
                        code: 'SEMESTER_NOT_FOUND',
                        message: `Không tìm thấy kỳ học với mã: ${updateClassDto.semester_id}`,
                    },
                });
            }
        }

        if (updateClassDto.max_students) {
            const classExisting = await this.classRepository.findOne({
                where: { class_id: id },
            });

            const enrolled_count = classExisting?.enrolled_count ?? 0;
            if (enrolled_count > updateClassDto.max_students) {
                throw new BadRequestException({
                    success: false,
                    error: {
                        code: 'MAX_STUDENT_INVALID',
                        message: 'Sĩ số lớp không thể nhỏ hơn số lượt đăng ký hiện tại',
                    },
                });
            }
        }

        if (Object.keys(updateClassDto).length > 0) {
            await this.classRepository.update(id, updateClassDto);
        }

        return await this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const classEntity = await this.findOne(id);
        try {
            await this.classRepository.remove(classEntity);
        } catch (error: any) {
            if (error.code === '23001') {
                throw new BadRequestException({
                    success: false,
                    error: {
                        code: 'CLASS_HAVE_STUDENT',
                        message: `Không thể xóa nhóm lớp ${id} vì đã có sinh viên đăng ký.`,
                    },
                });
            }
            throw error;
        }
    }

    async getClassQuantity(): Promise<number> {
        return await this.classRepository.count();
    }
}
