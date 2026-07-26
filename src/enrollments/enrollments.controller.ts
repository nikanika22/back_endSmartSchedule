import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../common/decorators/audit-action.decorator';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @AuditAction('CREATE_ENROLLMENT', 'enrollment')
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

  // GET /enrollments/my → Lấy danh sách môn học đã đăng ký (học kỳ active)
  @Get('my')
  async getMyEnrollments(@Request() req: any) {
    const student_id = req.user.student_id;
    const data = await this.enrollmentsService.getMyEnrollments(student_id);
    return {
      success: true,
      data,
    };
  }

  // DELETE /enrollments/my → Xóa toàn bộ enrollment của student trong học kỳ active
  @Delete('my')
  @AuditAction('DELETE_ALL_ENROLLMENTS', 'enrollment')
  async deleteMyEnrollments(@Request() req: any) {
    const student_id = req.user.student_id;
    await this.enrollmentsService.deleteMyEnrollments(student_id);
    return {
      success: true,
      message: 'Đã xóa toàn bộ đăng ký môn học',
    };
  }
}
