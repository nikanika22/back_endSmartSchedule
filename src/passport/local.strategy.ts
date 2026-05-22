import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { StudentsService } from 'src/students/students.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly studentsService: StudentsService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const user = await this.studentsService.validate(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}
