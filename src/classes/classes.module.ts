import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassEntity } from './entities/class.entity';
import { Semester } from './entities/semester.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ClassEntity, Semester, Course])],
    controllers: [ClassesController],
    providers: [ClassesService],
    exports: [ClassesService],
})
export class ClassesModule {}
