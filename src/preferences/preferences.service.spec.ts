import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { Preference, PreferredSlot } from './entities/preference.entity';
import { PreferenceAvoidDay } from './entities/preference-avoid-day.entity';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { AvoidDaysDto } from './dto/avoid-days.dto';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let preferenceRepository: jest.Mocked<Repository<Preference>>;
  let avoidDayRepository: jest.Mocked<Repository<PreferenceAvoidDay>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        {
          provide: getRepositoryToken(Preference),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PreferenceAvoidDay),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
    preferenceRepository = module.get(getRepositoryToken(Preference));
    avoidDayRepository = module.get(getRepositoryToken(PreferenceAvoidDay));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPreference', () => {
    it('should return preference with mapped avoid_days if it exists (happy path)', async () => {
      const mockPref = {
        pref_id: 1,
        student_id: 'SV001',
        preferred_slot: PreferredSlot.MORNING,
        avoid_days: [{ pref_id: 1, day_of_week: 2 }, { pref_id: 1, day_of_week: 3 }],
      } as any;

      preferenceRepository.findOne.mockResolvedValue(mockPref);

      const result = await service.getPreference('SV001');

      expect(preferenceRepository.findOne).toHaveBeenCalledWith({
        where: { student_id: 'SV001' },
        relations: ['avoid_days'],
      });
      expect(result).toEqual({
        pref_id: 1,
        student_id: 'SV001',
        preferred_slot: PreferredSlot.MORNING,
        avoid_days: [2, 3],
      });
    });

    it('should throw NotFoundException if preference does not exist (error case 1)', async () => {
      preferenceRepository.findOne.mockResolvedValue(null);

      await expect(service.getPreference('SV001')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePreference', () => {
    it('should update only preferred_slot and return updated value (happy path)', async () => {
      const existingPref = {
        pref_id: 1,
        student_id: 'SV001',
        preferred_slot: PreferredSlot.MORNING,
      } as any;

      const updateDto: UpdatePreferenceDto = {
        preferred_slot: PreferredSlot.AFTERNOON,
      };

      preferenceRepository.findOne.mockResolvedValueOnce(existingPref);
      preferenceRepository.save.mockResolvedValue(existingPref);

      const updatedPref = {
        ...existingPref,
        preferred_slot: PreferredSlot.AFTERNOON,
        avoid_days: [],
      };
      preferenceRepository.findOne.mockResolvedValueOnce(updatedPref);

      const result = await service.updatePreference('SV001', updateDto);

      expect(preferenceRepository.findOne).toHaveBeenCalledWith({ where: { student_id: 'SV001' } });
      expect(preferenceRepository.save).toHaveBeenCalled();
      expect(result.preferred_slot).toBe(PreferredSlot.AFTERNOON);
    });

    it('should create a new preference row if student has no preference yet (error case 1)', async () => {
      preferenceRepository.findOne.mockResolvedValueOnce(null);
      const createdPref = { student_id: 'SV002', preferred_slot: PreferredSlot.AFTERNOON } as any;
      preferenceRepository.create.mockReturnValue(createdPref);
      preferenceRepository.save.mockResolvedValue(createdPref);

      const returnedPref = { ...createdPref, pref_id: 2, avoid_days: [] };
      preferenceRepository.findOne.mockResolvedValueOnce(returnedPref);

      const updateDto: UpdatePreferenceDto = { preferred_slot: PreferredSlot.AFTERNOON };
      const result = await service.updatePreference('SV002', updateDto);

      expect(preferenceRepository.create).toHaveBeenCalledWith({ student_id: 'SV002' });
      expect(result.preferred_slot).toBe(PreferredSlot.AFTERNOON);
    });
  });

  describe('addAvoidDays', () => {
    it('should add new avoid days and ignore duplicates (happy path)', async () => {
      const mockPref = {
        pref_id: 1,
        student_id: 'SV001',
        preferred_slot: PreferredSlot.MORNING,
      } as any;

      preferenceRepository.findOne.mockResolvedValueOnce(mockPref);
      avoidDayRepository.find.mockResolvedValue([{ pref_id: 1, day_of_week: 2 }] as any);
      avoidDayRepository.create.mockReturnValue({ pref_id: 1, day_of_week: 8 } as any);
      avoidDayRepository.save.mockResolvedValue([] as any);

      const returnPref = {
        ...mockPref,
        avoid_days: [{ pref_id: 1, day_of_week: 2 }, { pref_id: 1, day_of_week: 8 }],
      };
      preferenceRepository.findOne.mockResolvedValueOnce(returnPref);

      const avoidDaysDto: AvoidDaysDto = { days: [2, 8] }; // 2 is duplicate, 8 is new
      const result = await service.addAvoidDays('SV001', avoidDaysDto);

      expect(avoidDayRepository.find).toHaveBeenCalledWith({ where: { pref_id: 1 } });
      expect(avoidDayRepository.create).toHaveBeenCalledWith({ pref_id: 1, day_of_week: 8 });
      expect(avoidDayRepository.save).toHaveBeenCalled();
      expect(result.avoid_days).toEqual([2, 8]);
    });

    it('should create preference row when student has none yet (error case 1)', async () => {
      preferenceRepository.findOne.mockResolvedValueOnce(null);
      const newPref = { student_id: 'SV002' } as any;
      preferenceRepository.create.mockReturnValue(newPref);
      preferenceRepository.save.mockResolvedValueOnce({ ...newPref, pref_id: 2 } as any);

      avoidDayRepository.find.mockResolvedValue([]);
      avoidDayRepository.create.mockReturnValue({ pref_id: 2, day_of_week: 4 } as any);
      avoidDayRepository.save.mockResolvedValue([] as any);

      const returnPref = { pref_id: 2, student_id: 'SV002', avoid_days: [{ pref_id: 2, day_of_week: 4 }] } as any;
      preferenceRepository.findOne.mockResolvedValueOnce(returnPref);

      const result = await service.addAvoidDays('SV002', { days: [4] });

      expect(preferenceRepository.create).toHaveBeenCalledWith({ student_id: 'SV002' });
      expect(result.avoid_days).toEqual([4]);
    });
  });
});
