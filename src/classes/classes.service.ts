import {
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

@Injectable()
export class ClassesService {
    constructor(
        @InjectRepository(ClassEntity)
        private readonly classRepository: Repository<ClassEntity>,
        @InjectRepository(Course)
        private readonly courseRepository: Repository<Course>,
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
        const classEntity = await this.findOne(id);
        Object.assign(classEntity, updateClassDto);
        return await this.classRepository.save(classEntity);
    }

    async remove(id: string): Promise<void> {
        const classEntity = await this.findOne(id);
        await this.classRepository.remove(classEntity);
    }
}
