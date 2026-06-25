import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  async detectConflict(student_id: string, dto: GenerateScheduleDto) {
    const student = await this.StudentRepository.findOne({
      where: {
        student_id: student_id,
      },
    });

    if (!student) {
      throw new NotFoundException({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Không tìm thấy sinh viên' }
      });
    }

    const enrollments = await this.EnrollmentRepository.find({
      where: {
        student_id: student_id,
        semester_id: dto.semester_id,
      },
      relations: ['course'],
    });

    if (!enrollments || enrollments.length === 0) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ENROLLMENT_NOT_FOUND', message: 'Không tìm thấy môn học nào đăng ký cho học kỳ này' }
      });
    }

    const courses = enrollments.map((enrollment) => enrollment.course);
    const courseIds = courses.map((course) => course.course_id);

    const classes = await this.ClassRepository.find({
      where: {
        course_id: In(courseIds),
        semester_id: dto.semester_id,
      },
    });
    
    const body = {
      student_id: student_id,
      semester_id: dto.semester_id,
      classes: classes,
    };

    return await this.engineService.detectConflicts(body);
  }

  async saveSchedule(student_id: string, dto: SaveScheduleDto) {
    const student = await this.StudentRepository.findOne({
      where: {
        student_id: student_id
      }
    });

    if (!student) {
      throw new NotFoundException({
        success: false,
        error: {code: 'STUDENT_NOT_FOUND', message: 'Không tìm thấy sinh viên'}
      })
    }

    const semester = await this.SemesterRepository.findOne({
      where: {
        semester_id: dto.semester_id
      }
    });

    if (!semester) {
      throw new NotFoundException({
        success: false,
        error: {code: 'SEMESTER_NOT_FOUND', message: 'Không tìm thấy học kỳ'}
      })
    }

    const schedule = await this.ScheduleRepository.findOne({
      where: {
        schedule_id: dto.schedule_id,
        student_id: student_id,
        semester_id: dto.semester_id
      }
    });

    if (!schedule) {
      throw new NotFoundException({
        success: false,
        error: {code: 'SCHEDULE_NOT_FOUND', message: 'Không tìm thấy thời khóa biểu'}
      })
    }

    schedule.is_selected = true;

    return await this.ScheduleRepository.save(schedule);
  }

  async generateSchedule(student_id: string, dto: GenerateScheduleDto) {
    const student = await this.StudentRepository.findOne({
      where: {
        student_id: student_id,
      },
    });

    if (!student) {
      throw new NotFoundException({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'Không tìm thấy sinh viên' }
      });
    }

    const preference = await this.getPreference(student_id);
    const preferenceAvoidDay = preference.avoid_days;
    const personalEvents = await this.getPersonalEvent(student_id);

    const enrollments = await this.EnrollmentRepository.find({
      where: {
        student_id: student_id,
        semester_id: dto.semester_id,
      },
      relations: ['course'],
    });

    if (!enrollments || enrollments.length === 0) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ENROLLMENT_NOT_FOUND', message: 'Không tìm thấy môn học nào đăng ký cho học kỳ này' }
      });
    }

    const courses = enrollments.map((enrollment) => enrollment.course);
    const courseIds = courses.map((course) => course.course_id);

    const classes = await this.ClassRepository.find({
      where: {
        course_id: In(courseIds),
        semester_id: dto.semester_id,
      },
    });
    
    const body = {
      student_id: student_id,
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

    const responseData = await this.engineService.generateSchedules(body);

    await this.ScheduleRepository.delete({ 
      student_id: student_id, 
      semester_id: dto.semester_id, 
      is_draft: true 
    });

    if (responseData && responseData.schedules && responseData.schedules.length > 0) {
      for (const sched of responseData.schedules) {
        const newSchedule = this.ScheduleRepository.create({
          student_id: student_id,
          semester_id: dto.semester_id,
          score_total: sched.score_total,
          score_break: sched.score_break,
          score_pref: sched.score_pref,
          score_balance: sched.score_balance,
          is_draft: true,
          is_selected: false,
          is_active: false,
        });

        const savedSchedule = await this.ScheduleRepository.save(newSchedule);

        if (sched.classes && sched.classes.length > 0) {
          const scheduleClasses = sched.classes.map((cls: any) => {
            return this.ScheduleClassRepository.create({
              schedule_id: savedSchedule.schedule_id,
              class_id: cls.class_id,
            });
          });
          await this.ScheduleClassRepository.save(scheduleClasses);
        }
      }
    }

    return responseData;
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
        error: { code: 'PREFERENCE_NOT_FOUND', message: 'Không tìm thấy thiết lập sở thích của sinh viên' }
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

  async getSemeterById(semester_id: string) {
    const semester = await this.SemesterRepository.findOne({
      where: {
        semester_id: semester_id,
      },
    });

    if (!semester) {
      throw new NotFoundException({
        success: false,
        error: { code: 'SEMESTER_NOT_FOUND', message: 'Không tìm thấy học kỳ' }
      });
    }

    return semester;
  }

  async create(student_id: string, createScheduleDto: CreateScheduleDto) {
    const newSchedule = this.ScheduleRepository.create({
      student_id: student_id,
      ...createScheduleDto,
    });
    return await this.ScheduleRepository.save(newSchedule);
  }

  async findAll(student_id: string) {
    return await this.ScheduleRepository.find({
      where: {
        student_id: student_id,
      },
      relations: ['scheduleClasses'],
    });
  }

  async findOne(student_id: string, id: number) {
    const schedule = await this.ScheduleRepository.findOne({
      where: {
        schedule_id: id,
        student_id: student_id,
      },
      relations: ['scheduleClasses'],
    });
    if (!schedule) {
      throw new NotFoundException({
        success: false,
        error: { code: 'SCHEDULE_NOT_FOUND', message: `Không tìm thấy thời khóa biểu với id: ${id}` }
      });
    }

    return schedule;
  }

  async update(student_id: string, id: number, updateScheduleDto: UpdateScheduleDto) {
    const schedule = await this.ScheduleRepository.preload({
      schedule_id: id,
      student_id: student_id,
      ...updateScheduleDto,
    });
    
    if (!schedule) {
      throw new NotFoundException({
        success: false,
        error: { code: 'SCHEDULE_NOT_FOUND', message: `Không tìm thấy thời khóa biểu với id: ${id}` }
      });
    }
    
    return await this.ScheduleRepository.save(schedule);
  }

  async remove(student_id: string, id: number) {
    const schedule = await this.findOne(student_id ,id);

    if (schedule.is_selected) {
      throw new BadRequestException({
        success: false,
        error: { code: 'SCHEDULE_IS_SELECTED', message: `Không thể xóa thời khóa biểu đã được chọn` }
      });
    }

    return await this.ScheduleRepository.remove(schedule);
  }
}
