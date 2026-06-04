import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePersonalEventDto } from './dto/create-personal-event.dto';
import { UpdatePersonalEventDto } from './dto/update-personal-event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PersonalEvent } from './entities/personal-event.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/students/entities/student.entity';

@Injectable()
export class PersonalEventsService {
  constructor(
    @InjectRepository(PersonalEvent)
    private readonly personalEventRepository: Repository<PersonalEvent>,
    private readonly studentRepository: Repository<Student>
  ) { }

  async create(createPersonalEventDto: CreatePersonalEventDto) {
    const student = this.studentRepository.findOne({
      where: { student_id: createPersonalEventDto.student_id },
    });

    if (student == null) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'STUDENT_NOT_EXISTS',
          message: 'Không tìm thấy sinh viên với id:' + createPersonalEventDto.student_id,
        },
      })
    }

    const personal_event = this.personalEventRepository.create({
      student_id: createPersonalEventDto.student_id,
      title: createPersonalEventDto.title,
      day_of_week: createPersonalEventDto.day_of_week,
      start_time: createPersonalEventDto.start_time,
      end_time: createPersonalEventDto.end_time,
      is_recurring: createPersonalEventDto.is_recurring,
      note: createPersonalEventDto.note
    });

    return await this.personalEventRepository.save(personal_event);
  }

  findAll() {
    return this.personalEventRepository.find();
  }

  findOne(id: number) {
    return this.personalEventRepository.findOneByOrFail({ id } as any);
  }

  async update(id: number, updatePersonalEventDto: UpdatePersonalEventDto) {
    const p = await this.personalEventRepository.findOneByOrFail({ id } as any);
    if (p != null) {
      return this.personalEventRepository.update(id, updatePersonalEventDto);
    }
    return null;
  }

  remove(id: number) {
    return this.personalEventRepository.delete(id);
  }
}
