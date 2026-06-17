import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from './entities/schedule.entity';
import { ScheduleClass } from './entities/schedule-classes.entity';
import { Preference } from 'src/preferences/entities/preference.entity';
import { PreferenceAvoidDay } from 'src/preferences/entities/preference-avoid-day.entity';
import { Semester } from 'src/semesters/entities/semester.entity';
import { Course } from 'src/courses/entities/course.entity';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { Student } from 'src/students/entities/student.entity';
import { PersonalEvent } from 'src/personal-events/entities/personal-event.entity';

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
  providers: [SchedulesService],
})
export class SchedulesModule {}
