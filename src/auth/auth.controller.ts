import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { CreateStudentDto } from 'src/students/dto/create-student.dto';
import { LocalAuthGuard } from 'src/guards/local.auth.guard';
import { StudentsService } from 'src/students/students.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly studentsService: StudentsService,
  ) {}

  @Post('/register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  register(@Body() userData: CreateStudentDto) {
    return this.studentsService.createUser(userData);
  }
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }
  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
