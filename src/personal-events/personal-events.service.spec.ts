import { Test, TestingModule } from '@nestjs/testing';
import { PersonalEventsService } from './personal-events.service';

describe('PersonalEventsService', () => {
  let service: PersonalEventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonalEventsService],
    }).compile();

    service = module.get<PersonalEventsService>(PersonalEventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
