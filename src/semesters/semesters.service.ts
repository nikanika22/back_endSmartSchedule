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

  async create(createSemesterDto: CreateSemesterDto) {
    const semester = this.semesterRepository.create({
      semester_id: createSemesterDto.semester_id,
      name: createSemesterDto.name,
      start_date: new Date(createSemesterDto.start_date),
      end_date: new Date(createSemesterDto.end_date),
      is_active: false,
    });
    return await this.semesterRepository.save(semester);
  }

  async activateSemester(semester_id: string) {
    // Hủy kích hoạt các học kỳ đang active hiện tại
    await this.semesterRepository.update(
      { is_active: true },
      { is_active: false },
    );

    // Kích hoạt học kỳ được chọn
    const result = await this.semesterRepository.update(
      { semester_id },
      { is_active: true },
    );

    if (result.affected === 0) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'SEMESTER_NOT_FOUND',
          message: `Không tìm thấy học kỳ với ID ${semester_id}.`,
        },
      });
    }

    return {
      success: true,
      message: `Đã kích hoạt học kỳ ${semester_id} thành công.`,
    };
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
