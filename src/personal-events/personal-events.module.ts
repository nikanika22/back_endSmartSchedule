import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalEventsService } from './personal-events.service';
import { PersonalEventsController } from './personal-events.controller';
import { PersonalEvent } from './entities/personal-event.entity';
import { Student } from '../students/entities/student.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PersonalEvent, Student]),
    AuthModule, // Để dùng JwtAuthGuard
  ],
  controllers: [PersonalEventsController],
  providers: [PersonalEventsService],
})
export class PersonalEventsModule {}
