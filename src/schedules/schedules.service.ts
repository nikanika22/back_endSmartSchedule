import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
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

  private readonly MAX_SOLUTIONS = 500;

  async detectConflict(student_id: string) {
    const { classes, semester_id } =
      await this.getClassesByStudentId(student_id);

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

    const selectedSchedules = await this.ScheduleRepository.findOne({
      where: {
        student_id: student_id,
        semester_id: semester_id,
        is_selected: true,
        is_active: true,
      },
      relations: ['scheduleClasses'],
    });

    const oldClassIds = selectedSchedules?.scheduleClasses.map((schduleClass) => schduleClass.class_id) ?? [];
    const allClassIds = [...new Set([...classIds, ...oldClassIds])];

    const oldClassIdSet = new Set(oldClassIds);
    const newClassIdSet = new Set(classIds);

    const classes = await this.ClassRepository.findBy({
      class_id: In(allClassIds),
    });

    for (const classEntity of classes) {
      const wasSelected = oldClassIdSet.has(classEntity.class_id);
      const willBeSelected = newClassIdSet.has(classEntity.class_id);

      if (
        !wasSelected &&
        willBeSelected &&
        classEntity.enrolled_count >= classEntity.max_students
      ) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'CLASS_IS_FULL',
            message: `Lớp ${classEntity.class_id} đã đủ sĩ số. Vui lòng chọn phương án khác.`,
          },
        });
      }

      if (wasSelected && !willBeSelected) {
        classEntity.enrolled_count -= 1;
      }

      if (!wasSelected && willBeSelected) {
        classEntity.enrolled_count += 1;
      }
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
    await this.ClassRepository.save(classes);

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

    await this.ScheduleRepository.delete({
      student_id: student_id,
      semester_id: semester_id,
      is_draft: true,
    });

    for (const sched of responseData.schedules) {
      const newSchedule = this.ScheduleRepository.create({
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
        scheduleClasses: (sched.classes ?? []).map((cls: any) => ({
          class_id: cls.class_id,
        })),
      });

      const savedSchedule = await this.ScheduleRepository.save(newSchedule);

      // Gán schedule_id vừa tạo vào object để trả về cho Frontend
      sched.schedule_id = savedSchedule.schedule_id;
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
