import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BlacklistService } from './blacklist.service';
import { StudentsModule } from 'src/students/students.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from 'src/passport/local.strategy';
import { JwtStrategy } from 'src/passport/jwt.strategy';
import { TokenBlacklist } from './entities/token-blacklist.entity';

@Module({
  imports: [
    StudentsModule,
    PassportModule,
    TypeOrmModule.forFeature([TokenBlacklist]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRES_IN ?? '24h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, BlacklistService, LocalStrategy, JwtStrategy],
  exports: [AuthService, BlacklistService],
})
export class AuthModule {}
