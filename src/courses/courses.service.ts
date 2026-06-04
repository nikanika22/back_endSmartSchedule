import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';

@Injectable()
export class CoursesService {
    constructor(
        @InjectRepository(Course)
        private readonly courseRepository: Repository<Course>,
    ) {}

    async create(createCourseDto: CreateCourseDto): Promise<Course> {
        const existing = await this.courseRepository.findOne({
            where: { course_id: createCourseDto.course_id },
        });

        if (existing) {
            throw new ConflictException({
                success: false,
                error: {
                    code: 'COURSE_ID_ALREADY_EXISTS',
                    message: `Mã môn học '${createCourseDto.course_id}' đã tồn tại.`,
                },
            });
        }

        const course = this.courseRepository.create(createCourseDto);
        return await this.courseRepository.save(course);
    }

    async findAll(): Promise<Course[]> {
        return await this.courseRepository.find({
            order: { course_id: 'ASC' },
        });
    }

    async findOne(id: string): Promise<Course> {
        const course = await this.courseRepository.findOne({
            where: { course_id: id },
        });

        if (!course) {
            throw new NotFoundException({
                success: false,
                error: {
                    code: 'COURSE_NOT_FOUND',
                    message: `Không tìm thấy môn học với mã: ${id}`,
                },
            });
        }

        return course;
    }

    async update(
        id: string,
        updateCourseDto: UpdateCourseDto,
    ): Promise<Course> {
        const course = await this.findOne(id);
        Object.assign(course, updateCourseDto);
        return await this.courseRepository.save(course);
    }

    async remove(id: string): Promise<void> {
        const course = await this.findOne(id);
        await this.courseRepository.remove(course);
    }
}
