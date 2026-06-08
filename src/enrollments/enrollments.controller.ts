import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Enrollments') // Gom nhóm trên Swagger
@ApiBearerAuth() // Báo Swagger là toàn bộ API ở đây cần Token
@UseGuards(JwtAuthGuard) // Bảo mật thực tế: Toàn bộ API ở đây cần Token
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // Không cần @UseGuards ở đây nữa vì Class đã lo rồi
  @Post()
  async create(
    @Request() req: any,
    @Body() createEnrollmentDto: CreateEnrollmentDto,
  ) {
    const student_id = req.user.student_id;
    const result = await this.enrollmentsService.create(
      student_id,
      createEnrollmentDto,
    );
    return {
      success: true,
      data: result,
      message: 'Đăng ký môn học thành công',
    };
  }
}
