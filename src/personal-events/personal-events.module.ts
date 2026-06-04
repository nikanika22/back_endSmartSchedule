import { Module } from '@nestjs/common';
import { PersonalEventsService } from './personal-events.service';
import { PersonalEventsController } from './personal-events.controller';

@Module({
  controllers: [PersonalEventsController],
  providers: [PersonalEventsService],
})
export class PersonalEventsModule {}
