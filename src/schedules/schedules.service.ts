import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { ScheduleClass } from './entities/schedule-classes.entity';
import { Preference } from '../preferences/entities/preference.entity';
import { Semester } from '../semesters/entities/semester.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Student } from '../students/entities/student.entity';
import { PersonalEvent } from '../personal-events/entities/personal-event.entity';
import { EngineService } from './engine/engine.service';
import { SaveScheduleDto } from './dto/save-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly dataSource: DataSource,

    private readonly engineService: EngineService,
    @InjectRepository(Schedule)
    private readonly ScheduleRepository: Repository<Schedule>,

    @InjectRepository(ScheduleClass)
    private readonly ScheduleClassRepository: Repository<ScheduleClass>,

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

  private readonly MAX_SOLUTIONS = 500;

  async detectConflict(student_id: string) {
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const scheduleRepository = queryRunner.manager.getRepository(Schedule);
      const scheduleClassRepository =
        queryRunner.manager.getRepository(ScheduleClass);

      const schedule = await scheduleRepository.findOne({
        where: {
          schedule_id: dto.schedule_id,
          student_id: student_id,
          semester_id: semester_id,
          is_draft: true,
        },
        relations: ['scheduleClasses'],
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

      const classIds = schedule.scheduleClasses.map(
        (scheduleClass) => scheduleClass.class_id,
      );

      if (classIds.length === 0) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'SCHEDULE_HAS_NO_CLASSES',
            message: 'Thời khóa biểu không có lớp để xác nhận.',
          },
        });
      }

      const classes = await queryRunner.manager
        .getRepository(ClassEntity)
        .createQueryBuilder('class')
        .setLock('pessimistic_write')
        .where('class.class_id IN (:...classIds)', { classIds })
        .orderBy('class.class_id', 'ASC')
        .getMany();

      await scheduleRepository.update(
        {
          student_id: student_id,
          semester_id: semester_id,
          is_selected: true,
          is_active: true,
        },
        { is_selected: false, is_draft: true, is_active: false },
      );

      const enrolledByClass = await this.getEnrolledByClass(
        classIds,
        semester_id,
        scheduleClassRepository,
      );

      for (const classEntity of classes) {
        const currentEnrolled = enrolledByClass.get(classEntity.class_id) ?? 0;

        if (currentEnrolled >= classEntity.max_students) {
          throw new ConflictException({
            success: false,
            error: {
              code: 'CLASS_IS_FULL',
              message: `Lớp ${classEntity.class_id} đã đủ sĩ số. Vui lòng chọn phương án khác.`,
            },
          });
        }
      }

      schedule.is_selected = true;
      schedule.is_draft = false;
      schedule.is_active = true;
      await scheduleRepository.save(schedule);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return await this.findSelectedBySemester(student_id);
  }

  async generateSchedule(student_id: string) {
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
      max_solutions: this.MAX_SOLUTIONS,
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
          algorithm: sched.algorithm_tag,
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
        algorithm_tag: schedule.algorithm_tag,
        score_total: schedule.score_total,
        score_break: schedule.score_break,
        score_pref: schedule.score_pref,
        score_balance: schedule.score_balance,
        classes: schedule.classes.map((cls: any) => {
          const matchedCourse = courses.find(
            (c) => c.course_id === cls.course_id,
          );
          return {
            class_id: cls.class_id,
            course_id: cls.course_id,
            course_name: matchedCourse ? matchedCourse.course_name : null,
            start_date: matchedCourse?.start_date,
            end_date: matchedCourse?.end_date,
            day_of_week: cls.day_of_week,
            start_time: cls.start_time,
            end_time: cls.end_time,
            room: cls.room,
            instructor: cls.instructor,
            remaining_students: Math.max(
              cls.max_students - cls.current_enrolled,
              0,
            ),
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
      relations: ['scheduleClasses', 'scheduleClasses.class', 'scheduleClasses.class.course'],
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

    for (const scheduleClass of schedule.scheduleClasses) {
      const course = scheduleClass.class.course;

      Object.assign(scheduleClass.class, {
        course_name: course.course_name,
        start_date: course.start_date,
        end_date: course.end_date,
      });
    }

    return schedule;
  }

  async getAlgorithmStats() {
    const cspCount = await this.ScheduleRepository.count({
      where: {
        is_selected: true,
        algorithm: 'CSP',
      },
    });

    const orToolsCount = await this.ScheduleRepository.count({
      where: {
        is_selected: true,
        algorithm: 'OR-Tools',
      },
    });

    const total = await this.ScheduleRepository.count({
      where: {
        is_selected: true,
      }
    });

    return {
      data: [
        { algorithm: 'CSP', count: cspCount },
        { algorithm: 'OR-Tools', count: orToolsCount },
      ],
      total: total
    };
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

    const classIds = classes.map((classEntity) => classEntity.class_id);
    const enrolledByClass = await this.getEnrolledByClass(
      classIds,
      semester_id,
    );

    for (const classEntity of classes) {
      const currentEnrolled = enrolledByClass.get(classEntity.class_id) ?? 0;

      Object.assign(classEntity, { current_enrolled: currentEnrolled });
    }

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

  private async getEnrolledByClass(
    classIds: string[],
    semester_id: string,
    scheduleClassRepository = this.ScheduleClassRepository,
  ): Promise<Map<string, number>> {
    const enrolledByClass = new Map<string, number>();

    if (classIds.length === 0) {
      return enrolledByClass;
    }

    const rows = await scheduleClassRepository
      .createQueryBuilder('scheduleClass')
      .innerJoin('scheduleClass.schedule', 'schedule')
      .select('scheduleClass.class_id', 'class_id')
      .addSelect('COUNT(scheduleClass.class_id)', 'current_enrolled')
      .where('scheduleClass.class_id IN (:...classIds)', { classIds })
      .andWhere('schedule.semester_id = :semester_id', { semester_id })
      .andWhere('schedule.is_selected = :is_selected', { is_selected: true })
      .groupBy('scheduleClass.class_id')
      .getRawMany<{ class_id: string; current_enrolled: string }>();

    for (const row of rows) {
      enrolledByClass.set(row.class_id, Number(row.current_enrolled));
    }

    return enrolledByClass;
  }
}
