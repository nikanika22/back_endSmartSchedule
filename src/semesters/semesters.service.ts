import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Semester } from './entities/semester.entity';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemestersService {
  constructor(
    @InjectRepository(Semester)
    private readonly semesterRepository: Repository<Semester>,
  ) {}

  async findActive() {
    const activeSemester = await this.semesterRepository.findOne({
      where: { is_active: true },
    });
    if (!activeSemester) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'SEMESTER_ACTIVE_NOT_FOUND',
          message: 'Không tìm thấy học kỳ đang kích hoạt.',
        },
      });
    }
    return activeSemester;
  }

  create(createSemesterDto: CreateSemesterDto) {
    return 'This action adds a new semester';
  }

  async findAll() {
    return await this.semesterRepository.find();
  }

  async findOne(id: number) {
    // Note: the primary key in database is semester_id (string), e.g. 'HK1-2025' or '20241'.
    // Let's implement finding by string ID just in case, but keep signature.
    return `This action returns a #${id} semester`;
  }

  update(id: number, updateSemesterDto: UpdateSemesterDto) {
    return `This action updates a #${id} semester`;
  }

  remove(id: number) {
    return `This action removes a #${id} semester`;
  }
}
