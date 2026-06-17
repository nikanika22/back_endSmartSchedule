import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { Preference } from 'src/preferences/entities/preference.entity';
import { PreferenceAvoidDay } from 'src/preferences/entities/preference-avoid-day.entity';
import { Semester } from 'src/semesters/entities/semester.entity';
import { Course } from 'src/courses/entities/course.entity';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { Student } from 'src/students/entities/student.entity';
import { PersonalEvent } from 'src/personal-events/entities/personal-event.entity';

const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://localhost:8000';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Schedule)
    private readonly ScheduleRepository: Repository<Schedule>,

    @InjectRepository(Preference)
    private readonly PreferenceRepository: Repository<Preference>,

    @InjectRepository(PreferenceAvoidDay)
    private readonly PreferenceAvoidDayRepository: Repository<PreferenceAvoidDay>,

    @InjectRepository(Semester)
    private readonly SemesterRepository: Repository<Semester>,

    @InjectRepository(Course)
    private readonly CourseRepository: Repository<Course>,

    @InjectRepository(ClassEntity)
    private readonly ClassRepository: Repository<ClassEntity>,

    @InjectRepository(Enrollment)
    private readonly EnrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Student)
    private readonly StudentRepository: Repository<Student>,

    @InjectRepository(PersonalEvent)
    private readonly PersonalEventRepository: Repository<PersonalEvent>,
  ) {}

  async generateSchedule(dto: GenerateScheduleDto) {
    const student = await this.StudentRepository.findOne({
      where: {
        student_id: dto.student_id,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const preference = await this.getPreference(dto.student_id);

    const preferenceAvoidDay = preference.avoid_days;

    const personalEvents = await this.getPersonalEvent(dto.student_id);

    try {
      const enrollments = await this.EnrollmentRepository.find({
        where: {
          student_id: dto.student_id,
          semester_id: dto.semester_id,
        },
        relations: ['course'],
      });

      if (!enrollments || enrollments.length === 0) {
        throw new Error(
          'No enrollments found for the given student and semester',
        );
      }

      const courses = enrollments.map((enrollment) => enrollment.course);

      const classes: ClassEntity[] = []

      for (const course of courses) {
        const classesOfCourse = await this.ClassRepository.find({
          where: {
            course_id: course.course_id,
            semester_id: dto.semester_id,
          },
        });
        classes.push(...classesOfCourse);
      }
      
      const body = {
        student_id: dto.student_id,
        semester_id: dto.semester_id,
        classes: classes,
        preferences: {
          ...preference,
          preferred_slot: preference.preferred_slot?.toLowerCase(),
        },
        avoid_days: (preferenceAvoidDay ?? []).map((d) => d.day_of_week),
        personal_events: personalEvents,
        max_solutions: dto.max_solutions,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${FASTAPI_URL}/schedules/generate`, body),
      );

      return response.data;

    } catch (error: any) {
      if (error.response) {
        console.error('FastAPI error response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  // helpers
  async getPreference(student_id: string) {
    try {
      const preference = await this.PreferenceRepository.findOne({
        where: {
          student_id: student_id,
        },
        relations: ['avoid_days'],
      });

      if (!preference) {
        throw new Error('Preference not found');
      }

      return preference;
    } catch (error) {
      throw error;
    }
  }

  async getPersonalEvent(student_id: string) {
    try {
      const personalEvents = await this.PersonalEventRepository.find({
        where: {
          student_id: student_id,
        },
      });

      if (!personalEvents) {
        throw new Error('Personal events not found');
      }

      return personalEvents;
    } catch (error) {
      throw error;
    }
  }

  async getSemeterById(semester_id: string) {
    try {
      const semester = await this.SemesterRepository.findOne({
        where: {
          semester_id: semester_id,
        },
      });

      if (!semester) {
        throw new Error('Semester not found');
      }

      return semester;
    } catch (error) {
      throw error;
    }
  }

  create(createScheduleDto: CreateScheduleDto) {
    return 'This action adds a new schedule';
  }

  findAll() {
    return `This action returns all schedules`;
  }

  findOne(id: number) {
    return `This action returns a #${id} schedule`;
  }

  update(id: number, updateScheduleDto: UpdateScheduleDto) {
    return `This action updates a #${id} schedule`;
  }

  remove(id: number) {
    return `This action removes a #${id} schedule`;
  }
}
