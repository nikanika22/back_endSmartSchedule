import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preference } from './entities/preference.entity';
import { PreferenceAvoidDay } from './entities/preference-avoid-day.entity';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { AvoidDaysDto } from './dto/avoid-days.dto';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(Preference)
    private readonly preferenceRepository: Repository<Preference>,
    @InjectRepository(PreferenceAvoidDay)
    private readonly avoidDayRepository: Repository<PreferenceAvoidDay>,
  ) {}

  async getPreference(student_id: string) {
    const preference = await this.preferenceRepository.findOne({
      where: { student_id },
      relations: ['avoid_days'],
    });

    if (!preference) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PREFERENCE_NOT_FOUND',
          message: 'Không tìm thấy cấu hình sở thích cho sinh viên này.',
        },
      });
    }

    return {
      pref_id: preference.pref_id,
      student_id: preference.student_id,
      preferred_slot: preference.preferred_slot,
      avoid_days: preference.avoid_days ? preference.avoid_days.map((d) => d.day_of_week) : [],
    };
  }

  async updatePreference(student_id: string, dto: UpdatePreferenceDto) {
    let preference = await this.preferenceRepository.findOne({
      where: { student_id },
    });

    if (!preference) {
      preference = this.preferenceRepository.create({ student_id });
    }

    preference.preferred_slot = dto.preferred_slot;

    await this.preferenceRepository.save(preference);
    return this.getPreference(student_id);
  }

  async addAvoidDays(student_id: string, dto: AvoidDaysDto) {
    let preference = await this.preferenceRepository.findOne({
      where: { student_id },
    });

    if (!preference) {
      preference = this.preferenceRepository.create({ student_id });
      preference = await this.preferenceRepository.save(preference);
    }

    const pref_id = preference.pref_id;
    
    // Xoá toàn bộ ngày bận cũ của sinh viên này để thay thế bằng danh sách mới
    await this.avoidDayRepository.delete({ pref_id });

    if (dto.days && dto.days.length > 0) {
      const entities = dto.days.map((day) => {
        return this.avoidDayRepository.create({
          pref_id,
          day_of_week: day,
        });
      });
      await this.avoidDayRepository.save(entities);
    }

    return this.getPreference(student_id);
  }
}
