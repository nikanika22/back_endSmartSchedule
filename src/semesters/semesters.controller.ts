import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../students/entities/student.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('semesters')
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

    @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semestersService.create(createSemesterDto);
  }

  @Get()
  findAll() {
    return this.semestersService.findAll();
  }

  @Get('active')
  findActive() {
    return this.semestersService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.semestersService.findOne(+id);
  }

    @Roles(UserRole.ADMIN)
  @Patch(':id/activate')
  activateSemester(@Param('id') id: string) {
    return this.semestersService.activateSemester(id);
  }

    @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSemesterDto: UpdateSemesterDto) {
    return this.semestersService.update(+id, updateSemesterDto);
  }

    @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.semestersService.remove(+id);
  }
}
