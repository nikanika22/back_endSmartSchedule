import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Student } from '../students/entities/student.entity';
import { CreatePersonalEventDto } from './dto/create-personal-event.dto';
import { UpdatePersonalEventDto } from './dto/update-personal-event.dto';
import { PersonalEvent } from './entities/personal-event.entity';

type EventTimeRange = Pick<
  PersonalEvent,
  'start_time' | 'end_time'
> & {
  day_of_week?: number | null;
};

@Injectable()
export class PersonalEventsService {
  constructor(
    @InjectRepository(PersonalEvent)
    private readonly personalEventRepository: Repository<PersonalEvent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) { }

  async create(
    student_id: string,
    createPersonalEventDto: CreatePersonalEventDto,
  ): Promise<PersonalEvent> {
    const student = await this.studentRepository.findOne({
      where: { student_id },
    });

    if (!student) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'STUDENT_NOT_EXISTS',
          message: `Không tìm thấy sinh viên với id: ${student_id}`,
        },
      });
    }

    this.validateDateRange(
      createPersonalEventDto.start_date,
      createPersonalEventDto.end_date,
    );

    if (createPersonalEventDto.end_time <= createPersonalEventDto.start_time) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'TIME_NOT_VALID',
          message: 'Thời gian không hợp lệ',
        },
      });
    }

    await this.checkOverlap(student_id, createPersonalEventDto);

    const personalEvent = this.personalEventRepository.create({
      student_id,
      title: createPersonalEventDto.title,
      day_of_week: createPersonalEventDto.day_of_week,
      start_time: createPersonalEventDto.start_time,
      end_time: createPersonalEventDto.end_time,
      start_date: new Date(createPersonalEventDto.start_date),
      end_date: new Date(createPersonalEventDto.end_date),
      is_recurring: createPersonalEventDto.is_recurring,
      note: createPersonalEventDto.note,
    });

    return this.personalEventRepository.save(personalEvent);
  }

  findAll(student_id: string): Promise<PersonalEvent[]> {
    return this.personalEventRepository.find({
      where: { student_id },
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async findOne(student_id: string, id: number): Promise<PersonalEvent> {
    const event = await this.personalEventRepository.findOne({
      where: { event_id: id, student_id },
    });

    if (!event) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PERSONAL_EVENT_NOT_FOUND',
          message: `Không tìm thấy lịch bận với id: ${id}`,
        },
      });
    }

    return event;
  }

  async update(
    student_id: string,
    id: number,
    updatePersonalEventDto: UpdatePersonalEventDto,
  ): Promise<PersonalEvent> {
    const event = await this.findOne(student_id, id);
    const nextEvent = { ...event, ...updatePersonalEventDto };

    this.validateDateRange(nextEvent.start_date, nextEvent.end_date);

    if (updatePersonalEventDto.start_time && updatePersonalEventDto.end_time) {
      if (updatePersonalEventDto.end_time <= updatePersonalEventDto.start_time) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'TIME_NOT_VALID',
            message: 'Thời gian không hợp lệ',
          },
        });
      }
    }

    await this.checkOverlap(student_id, nextEvent, id);

    Object.assign(event, updatePersonalEventDto);
    return this.personalEventRepository.save(event);
  }

  async remove(student_id: string, id: number): Promise<void> {
    const event = await this.findOne(student_id, id);
    await this.personalEventRepository.remove(event);
  }

  private validateDateRange(startDate: Date | string, endDate: Date | string): void {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'PERSONAL_EVENT_DATE_RANGE_INVALID',
          message: 'Ngày kết thúc lịch bận không được nhỏ hơn ngày bắt đầu.',
        },
      });
    }
  }

  private async checkOverlap(
    student_id: string,
    event: EventTimeRange,
    excludeEventId?: number,
  ): Promise<void> {
    if (event.day_of_week == null) {
      return;
    }

    const overlapping = await this.personalEventRepository.findOne({
      where: {
        student_id,
        day_of_week: event.day_of_week,
        start_time: LessThan(event.end_time),
        end_time: MoreThan(event.start_time),
        ...(excludeEventId ? { event_id: Not(excludeEventId) } : {}),
      },
    });

    if (overlapping) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'PERSONAL_EVENT_TIME_OVERLAP',
          message: 'Lịch bận bị trùng với một lịch bận khác.',
        },
      });
    }
  }
}
