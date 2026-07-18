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
import { StudentsService } from 'src/students/students.service';
import { LocalAuthGuard } from 'src/guards/local.auth.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreateStudentDto } from 'src/students/dto/create-student.dto';
import { UpdateStudentDto } from 'src/students/dto/update-student.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { LoginDTO } from './dto/login.dto';
import { Student } from 'src/students/entities/student.entity';

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
