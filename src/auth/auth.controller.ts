import {
  Controller,
  Post,
  Get,
  Patch,
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
import { StudentsService } from '../students/students.service';
import { LocalAuthGuard } from '../guards/local.auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { UpdateStudentDto } from '../students/dto/update-student.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LoginDTO } from './dto/login.dto';
import { ConfirmRegistrationDto } from './dto/confirm-registration.dto';
import { AuditAction } from '../common/decorators/audit-action.decorator';
import { Student, UserRole } from '../students/entities/student.entity';

import { Roles } from 'src/decorators/roles.decorator';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly studentsService: StudentsService,
    private readonly jwtService: JwtService,
  ) {}
  // @UseGuards(LocalAuthGuard)
  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  register(@Body() userData: CreateStudentDto) {
    return this.authService.register(userData);
  }

  @Post('register/confirm')
  @HttpCode(HttpStatus.OK)
  confirmRegistration(@Body() dto: ConfirmRegistrationDto) {
    return this.authService.confirmRegistration(dto);
  }
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDTO })
  @AuditAction('LOGIN')
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN,UserRole.STUDENT)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @AuditAction('LOGOUT')
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
 async me(@Request() req: any) {
    const student:Student |null= await this.studentsService.findByEmail(req.user.email);
    return {
      success: true,
      data: {
        student_id: student?.student_id,
        email: student?.email,
        full_name: student?.name,
        role: student?.role,
      },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateMe(@Request() req: any, @Body() userData: UpdateStudentDto) {
    const updatedUser = await this.studentsService.updateUser(req.user.student_id, userData);
    return {
      success: true,
      message: 'Cập nhật thông tin thành công.',
      data: {
        student_id: updatedUser.student_id,
        email: updatedUser.email,
        full_name: updatedUser.name,
        role: updatedUser.role,
      },
    };
  }
}
