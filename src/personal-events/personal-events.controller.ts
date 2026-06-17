import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreatePersonalEventDto } from './dto/create-personal-event.dto';
import { UpdatePersonalEventDto } from './dto/update-personal-event.dto';
import { PersonalEventsService } from './personal-events.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('personal-events')
export class PersonalEventsController {
  constructor(private readonly personalEventsService: PersonalEventsService) {}

  @Post()
  create(
    @Request() req: any,
    @Body() createPersonalEventDto: CreatePersonalEventDto,
  ) {
    const student_id = req.user.student_id;
    return this.personalEventsService.create(student_id, createPersonalEventDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const student_id = req.user.student_id;
    return this.personalEventsService.findAll(student_id);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const student_id = req.user.student_id;
    return this.personalEventsService.findOne(student_id, +id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updatePersonalEventDto: UpdatePersonalEventDto,
  ) {
    const student_id = req.user.student_id;
    return this.personalEventsService.update(
      student_id,
      +id,
      updatePersonalEventDto,
    );
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    const student_id = req.user.student_id;
    return this.personalEventsService.remove(student_id, +id);
  }
}
