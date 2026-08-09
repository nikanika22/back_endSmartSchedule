import {
  BadRequestException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MailerService } from '@nestjs-modules/mailer';
import type { Cache } from 'cache-manager';
import { randomInt } from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';

import { StudentsService } from '../students/students.service';
import { BlacklistService } from './blacklist.service';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';

const OTP_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly studentsService: StudentsService,
    private readonly jwtService: JwtService,
    private readonly blacklistService: BlacklistService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  async register(userData: CreateStudentDto) {
    const email = userData.email.trim().toLowerCase();
    const cacheKey = this.getOtpCacheKey(email);

    // Nếu có account pending (chưa xác minh) -> xóa để đăng ký lại
    const existing = await this.studentsService.findByEmail(email);
    if (existing && !existing.email_verified) {
      await this.studentsService.removeUnverifiedByEmail(email);
    }

    const student = await this.studentsService.createUser(userData);
    const otp = randomInt(100_000, 1_000_000).toString();
    await this.cacheManager.set(cacheKey, otp, OTP_TTL_MS);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Mã xác minh tài khoản SmartSchedule',
        text: `Xin chào ${student.name},\n\nMã xác minh của bạn là: ${otp}\n\nMã có hiệu lực trong 5 phút.`,
      });
    } catch (err: unknown) {
      await this.cacheManager.del(cacheKey);
      await this.studentsService.removeUnverifiedByEmail(email);
      this.logger.error('Gửi email thất bại', err instanceof Error ? err.stack : err);
      throw new ServiceUnavailableException({
        success: false,
        error: {
          code: 'AUTH_VERIFICATION_EMAIL_FAILED',
          message: 'Không thể gửi mã xác minh. Vui lòng đăng ký lại.',
        },
      });
    }

    return { success: true, message: 'Mã xác minh đã được gửi đến email.', data: { email, expires_in: 300 } };
  }

  // ─── Confirm OTP ─────────────────────────────────────────────────────────────

  async confirmRegistration(dto: ConfirmRegistrationDto) {
    const email = dto.email.trim().toLowerCase();
    const cacheKey = this.getOtpCacheKey(email);

    const stored = await this.cacheManager.get<string>(cacheKey);
    if (!stored) {
      await this.studentsService.removeUnverifiedByEmail(email);
      throw new GoneException({
        success: false,
        error: { code: 'AUTH_REGISTRATION_EXPIRED', message: 'Mã xác minh đã hết hạn. Vui lòng đăng ký lại.' },
      });
    }

    if (dto.otp !== stored) {
      throw new BadRequestException({
        success: false,
        error: { code: 'AUTH_VERIFICATION_CODE_INVALID', message: 'Mã xác minh không chính xác.' },
      });
    }

    const student = await this.studentsService.markEmailAsVerified(email);
    await this.cacheManager.del(cacheKey);

    return {
      success: true,
      message: 'Xác minh email thành công.',
      data: { student_id: student.student_id, email: student.email, role: student.role },
    };
  }

  // ─── Login / Logout ───────────────────────────────────────────────────────────

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
      role: user.role,
    };
  }

  async logout(jti: string, studentId: string, expiresAt: Date): Promise<void> {
    await this.blacklistService.add(jti, studentId, expiresAt);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private getOtpCacheKey(email: string) {
    return `email-verification:${email}`;
  }
}
