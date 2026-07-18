import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesModule } from '../classes/classes.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course } from './entities/course.entity';
import { UploadController } from './upload/upload.controller';
import { UploadService } from './upload/upload.service';
import { ClassEntity } from '../classes/entities/class.entity';
import { Semester } from '../semesters/entities/semester.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, ClassEntity, Semester]),
    ClassesModule
  ],
  controllers: [CoursesController, UploadController],
  providers: [CoursesService, UploadService],
  exports: [CoursesService, TypeOrmModule],
})
export class CoursesModule {}
