import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { ScheduleClass } from './entities/schedule-classes.entity';
import { Preference } from 'src/preferences/entities/preference.entity';
import { Semester } from 'src/semesters/entities/semester.entity';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { Enrollment } from 'src/enrollments/entities/enrollment.entity';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { Student } from 'src/students/entities/student.entity';
import { PersonalEvent } from 'src/personal-events/entities/personal-event.entity';
import { EngineService } from './engine/engine.service';
import { SaveScheduleDto } from './dto/save-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly dataSource: DataSource,

    private readonly engineService: EngineService,
    @InjectRepository(Schedule)
    private readonly ScheduleRepository: Repository<Schedule>,

    @InjectRepository(Preference)
    private readonly PreferenceRepository: Repository<Preference>,

    @InjectRepository(Semester)
    private readonly SemesterRepository: Repository<Semester>,

    @InjectRepository(ClassEntity)
    private readonly ClassRepository: Repository<ClassEntity>,

    @InjectRepository(Enrollment)
    private readonly EnrollmentRepository: Repository<Enrollment>,

    @InjectRepository(Student)
    private readonly StudentRepository: Repository<Student>,

    @InjectRepository(PersonalEvent)
    private readonly PersonalEventRepository: Repository<PersonalEvent>,
  ) {}

  async detectConflict(student_id: string, dto: GenerateScheduleDto) {
    const { classes, semester_id } = await this.getClassesByStudentId(student_id);

    const body = {
      student_id: student_id,
      semester_id: semester_id,
      classes: classes,
    };

    return await this.engineService.detectConflicts(body);
  }

  async saveSchedule(student_id: string, dto: SaveScheduleDto) {
    await this.getStudentById(student_id);

    const activeSemester = await this.getSemeter();
    const semester_id = activeSemester.semester_id;

    const schedule = await this.ScheduleRepository.findOne({
      where: {
        schedule_id: dto.schedule_id,
        student_id: student_id,
        semester_id: semester_id,
        is_draft: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'Không tìm thấy thời khóa biểu',
        },
      });
    }

    await this.ScheduleRepository.update(
      {
        student_id: student_id,
        semester_id: semester_id,
        is_selected: true,
        is_active: true,
      },
      { is_selected: false, is_draft: true, is_active: false },
    );

    schedule.is_selected = true;
    schedule.is_draft = false;
    schedule.is_active = true;

    await this.ScheduleRepository.save(schedule);

    // Trả về kèm relations để FE hiển thị được lịch
    return await this.findSelectedBySemester(student_id);
  }

  async generateSchedule(student_id: string, dto: GenerateScheduleDto) {
    const { courses, classes, semester_id } = await this.getClassesByStudentId(student_id);

    const preference = await this.getPreference(student_id);
    const preferenceAvoidDay = preference.avoid_days;
    const personalEvents = await this.getPersonalEvent(student_id);

    const body = {
      student_id: student_id,
      semester_id: semester_id,
      classes: classes,
      preferences: {
        ...preference,
        preferred_slot: preference.preferred_slot?.toLowerCase(),
      },
      avoid_days: (preferenceAvoidDay ?? []).map((d) => d.day_of_week),
      personal_events: personalEvents,
      max_solutions: dto.max_solutions,
    };

    const responseData = await this.engineService.generateSchedules(body);

    if (
      !responseData ||
      !responseData.schedules ||
      responseData.schedules.length === 0
    ) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'ZERO_SOLUTIONS',
          message:
            'Không tìm được thời khóa biểu nào phù hợp. Vui lòng nới lỏng thiết lập tránh ngày.',
        },
      });
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(Schedule, {
        student_id: student_id,
        semester_id: semester_id,
        is_draft: true,
      });

      const allScheduleClasses: ScheduleClass[] = [];

      for (const sched of responseData.schedules) {
        const newSchedule = queryRunner.manager.create(Schedule, {
          student_id: student_id,
          semester_id: semester_id,
          score_total: sched.score_total,
          score_break: sched.score_break,
          score_pref: sched.score_pref,
          score_balance: sched.score_balance,
          is_draft: true,
          is_selected: false,
          is_active: false,
        });

        const savedSchedule = await queryRunner.manager.save(newSchedule);

        // Gán schedule_id vừa tạo vào object để trả về cho Frontend
        sched.schedule_id = savedSchedule.schedule_id;

        if (sched.classes && sched.classes.length > 0) {
          const scheduleClasses = sched.classes.map((cls: any) => {
            return queryRunner.manager.create(ScheduleClass, {
              schedule_id: savedSchedule.schedule_id,
              class_id: cls.class_id,
            });
          });
          allScheduleClasses.push(...scheduleClasses);
        }
      }

      if (allScheduleClasses.length > 0) {
        await queryRunner.manager.save(allScheduleClasses);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    const activeSemester = await this.getSemeter();

    responseData.schedules = responseData.schedules.map((schedule: any) => {
      return {
        schedule_id: schedule.schedule_id,
        start_time: activeSemester.start_date,
        end_time: activeSemester.end_date,
        is_recommended: schedule.is_recommended,
        algorithm: schedule.algorithm,
        score_total: schedule.score_total,
        classes: schedule.classes.map((cls: any) => {
          const matchedCourse = courses.find(
            (c) => c.course_id === cls.course_id,
          );
          return {
            class_id: cls.class_id,
            course_id: cls.course_id,
            course_name: matchedCourse ? matchedCourse.course_name : null,
            day_of_week: cls.day_of_week,
            start_time: cls.start_time,
            end_time: cls.end_time,
            room: cls.room,
            instructor: cls.instructor,
          };
        }),
      };
    });

    return responseData;
  }

  async findSelectedBySemester(student_id: string) {
    const activeSemester = await this.getSemeter();
    const semester_id = activeSemester.semester_id;

    const schedule = await this.ScheduleRepository.findOne({
      where: {
        student_id: student_id,
        semester_id: semester_id,
        is_selected: true,
        is_active: true,
      },
      relations: ['scheduleClasses', 'scheduleClasses.class'],
    });

    if (!schedule) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'Không tìm thấy thời khóa biểu',
        },
      });
    }
    return schedule;
  }

  // helpers
  async getPreference(student_id: string) {
    const preference = await this.PreferenceRepository.findOne({
      where: {
        student_id: student_id,
      },
      relations: ['avoid_days'],
    });

    if (!preference) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PREFERENCE_NOT_FOUND',
          message: 'Không tìm thấy thiết lập sở thích của sinh viên',
        },
      });
    }

    return preference;
  }

  async getPersonalEvent(student_id: string) {
    const personalEvents = await this.PersonalEventRepository.find({
      where: {
        student_id: student_id,
      },
    });

    return personalEvents || [];
  }

  async getSemeter() {
    const semester = await this.SemesterRepository.findOne({
      where: {
        is_active: true,
      },
    });

    if (!semester) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'SEMESTER_NOT_FOUND',
          message: 'Không tìm thấy học kỳ nào được mở',
        },
      });
    }

    return semester;
  }

  async getStudentById(student_id: string) {
    const student = await this.StudentRepository.findOne({
      where: {
        student_id: student_id,
      },
    });

    if (!student) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Không tìm thấy sinh viên',
        },
      });
    }

    return student;
  }

  async getClassesByStudentId(student_id: string) {
    await this.getStudentById(student_id);

    const activeSemester = await this.getSemeter();
    const semester_id = activeSemester.semester_id;

    const enrollments = await this.EnrollmentRepository.find({
      where: {
        student_id: student_id,
        semester_id: semester_id,
      },
      relations: ['course'],
    });

    if (!enrollments || enrollments.length === 0) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ENROLLMENT_NOT_FOUND',
          message: 'Không tìm thấy môn học nào đăng ký cho học kỳ này',
        },
      });
    }

    const courses = enrollments.map((enrollment) => enrollment.course);
    const courseIds = courses.map((course) => course.course_id);

    const classes = await this.ClassRepository.find({
      where: {
        course_id: In(courseIds),
        semester_id: semester_id,
      },
    });

    const missingCourse = courses.find(
      (c) => !classes.some((cls) => cls.course_id === c.course_id),
    );
    if (missingCourse) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COURSE_HAS_NO_CLASSES',
          message: `Môn học ${missingCourse.course_name} không có lớp mở trong học kỳ này`,
        },
      });
    }

    if (!classes || classes.length === 0) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'CLASS_NOT_FOUND',
          message:
            'Không tìm thấy lớp học nào mở cho các môn đã đăng ký trong học kỳ này.',
        },
      });
    }

    return {
      courses,
      classes,
      semester_id,
    };
  }
}
