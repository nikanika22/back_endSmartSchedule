import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { BlacklistService } from 'src/auth/blacklist.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly blacklistService: BlacklistService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default_secret',
    });
  }

  async validate(payload: any) {
    if (!payload.jti) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Token không hợp lệ.',
        },
      });
    }

    const blacklisted = await this.blacklistService.isBlacklisted(payload.jti);
    if (blacklisted) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'AUTH_TOKEN_BLACKLISTED',
          message: 'Token đã bị thu hồi. Vui lòng đăng nhập lại.',
        },
      });
    }

    return {
      student_id: payload.sub,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
    };
  }
}
