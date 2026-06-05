import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { StudentsService } from 'src/students/students.service';
import { LocalAuthGuard } from 'src/guards/local.auth.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateStudentDto } from 'src/students/dto/create-student.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LoginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly studentsService: StudentsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  register(@Body() userData: CreateStudentDto) {
    return this.studentsService.createUser(userData);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDTO })
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    const { jti, student_id } = req.user;

    // Lấy raw token để decode exp
    const rawToken = req.headers.authorization?.split(' ')[1];
    const decoded = this.jwtService.decode(rawToken) as { exp: number } | null;
    const expiresAt = decoded
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.authService.logout(jti, student_id, expiresAt);

    return {
      success: true,
      message: 'Đăng xuất thành công.',
    };
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return {
      success: true,
      data: {
        student_id: req.user.student_id,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }
}
