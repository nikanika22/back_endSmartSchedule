import { Test, TestingModule } from '@nestjs/testing';
import { PersonalEventsController } from './personal-events.controller';
import { PersonalEventsService } from './personal-events.service';

describe('PersonalEventsController', () => {
  let controller: PersonalEventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalEventsController],
      providers: [PersonalEventsService],
    }).compile();

    controller = module.get<PersonalEventsController>(PersonalEventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
