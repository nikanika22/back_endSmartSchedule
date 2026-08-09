import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BlacklistService } from './blacklist.service';
import { StudentsModule } from '../students/students.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from '../passport/local.strategy';
import { JwtStrategy } from '../passport/jwt.strategy';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    StudentsModule,
    PassportModule,
    ConfigModule,
    TypeOrmModule.forFeature([TokenBlacklist]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as any,
        },
      }),
    }),
    CacheModule.register(),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>('SMTP_HOST'),
          port: Number(configService.getOrThrow<string>('SMTP_PORT')),
          secure: configService.get<string>('SMTP_SECURE') === 'true',
          auth: {
            user: configService.getOrThrow<string>('SMTP_USER'),
            pass: configService.getOrThrow<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: configService.getOrThrow<string>('MAIL_FROM'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, BlacklistService, LocalStrategy, JwtStrategy],
  exports: [AuthService, BlacklistService],
})
export class AuthModule {}
