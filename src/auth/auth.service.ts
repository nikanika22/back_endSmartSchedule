import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { StudentsService } from 'src/students/students.service';
import { BlacklistService } from './blacklist.service';


@Injectable()
export class AuthService {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly jwtService: JwtService,
    private readonly blacklistService: BlacklistService,
  ) {}

  login(user: any) {
    const jti = uuidv4();

    const payload = {
      sub: user.student_id,
      email: user.email,
      role: user.role,
      jti,
    };

    const access_token = this.jwtService.sign(payload);

    const decoded = this.jwtService.decode(access_token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    return {
      access_token,
      expires_at: expiresAt.toISOString(),
      token_type: 'Bearer',
    };
  }

  async logout(jti: string, studentId: string, expiresAt: Date): Promise<void> {
    await this.blacklistService.add(jti, studentId, expiresAt);
  }
}
