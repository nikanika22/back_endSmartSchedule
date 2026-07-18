import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from './entities/schedule.entity';
import { ScheduleClass } from './entities/schedule-classes.entity';
import { Preference } from '../preferences/entities/preference.entity';
import { PreferenceAvoidDay } from '../preferences/entities/preference-avoid-day.entity';
import { Semester } from '../semesters/entities/semester.entity';
import { Course } from '../courses/entities/course.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Student } from '../students/entities/student.entity';
import { PersonalEvent } from '../personal-events/entities/personal-event.entity';
import { EngineService } from './engine/engine.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      Schedule,
      ScheduleClass,
      Preference,
      PreferenceAvoidDay,
      Semester,
      Course,
      ClassEntity,
      Enrollment,
      Student,
      PersonalEvent,
    ]),
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService, EngineService],
})
export class SchedulesModule {}
