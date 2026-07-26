import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SchedulesService } from './schedules.service';
import { SaveScheduleDto } from './dto/save-schedule.dto';
import { AuditAction } from '../common/decorators/audit-action.decorator';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('generate')
  @AuditAction('GENERATE_SCHEDULE', 'schedule')
  generate(
    @Request() req: any) {
    return this.schedulesService.generateSchedule(req.user.student_id);
  }

  @Post('conflicts')
  detectConflicts(
    @Request() req: any) {
    return this.schedulesService.detectConflict(req.user.student_id);
  }

  @Post('save') 
  @AuditAction('CONFIRM_SCHEDULE', 'schedule')
  saveSchedule(
    @Request() req: any,
    @Body() dto: SaveScheduleDto) {
    return this.schedulesService.saveSchedule(req.user.student_id ,dto);
  }

  @Get('current')
  findSelectedBySemester(@Request() req: any) {
    return this.schedulesService.findSelectedBySemester(req.user.student_id);
  }

  @Get('stats')
  getAlgorithmStats() {
    return this.schedulesService.getAlgorithmStats();
  }
}
