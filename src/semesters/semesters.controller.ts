import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Controller('semesters')
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Post()
  create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semestersService.create(createSemesterDto);
  }

  @Get()
  findAll() {
    return this.semestersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.semestersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSemesterDto: UpdateSemesterDto) {
    return this.semestersService.update(+id, updateSemesterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.semestersService.remove(+id);
  }
}
