import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { SaveScheduleDto } from './dto/save-schedule.dto';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('generate')
  generate(
    @Request() req: any,
    @Body() generateScheduleDto: GenerateScheduleDto) {
    return this.schedulesService.generateSchedule(req.user.student_id ,generateScheduleDto);
  }

  @Post('conflicts')
  detectConflicts(
    @Request() req: any,
    @Body() dto: GenerateScheduleDto) {
    return this.schedulesService.detectConflict(req.user.student_id ,dto);
  }

  @Post('save') 
  saveSchedule(
    @Request() req: any,
    @Body() dto: SaveScheduleDto) {
    return this.schedulesService.saveSchedule(req.user.student_id ,dto);
  }

  @Post()
  create(
    @Request() req: any,
    @Body() createScheduleDto: CreateScheduleDto) {
    return this.schedulesService.create(req.user.student_id, createScheduleDto);
  }

  @Get()
  findAll(
    @Request() req: any) {
    return this.schedulesService.findAll(req.user.student_id);
  }

  @Get(':id')
  findOne(
    @Request() req: any,
    @Param('id') id: string) {
    return this.schedulesService.findOne(req.user.student_id ,+id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string, 
    @Body() updateScheduleDto: UpdateScheduleDto) {
    return this.schedulesService.update(req.user.student_id ,+id, updateScheduleDto);
  }

  @Delete(':id')
  remove(
    @Request() req: any,
    @Param('id') id: string) {
    return this.schedulesService.remove(req.user.student_id ,+id);
  }
}
