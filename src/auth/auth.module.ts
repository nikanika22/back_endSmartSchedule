import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { StudentsModule } from 'src/students/students.module';
@Module({
  imports: [StudentsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
