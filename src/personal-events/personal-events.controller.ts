import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PersonalEventsService } from './personal-events.service';
import { CreatePersonalEventDto } from './dto/create-personal-event.dto';
import { UpdatePersonalEventDto } from './dto/update-personal-event.dto';

@Controller('personal-events')
export class PersonalEventsController {
  constructor(private readonly personalEventsService: PersonalEventsService) {}

  @Post()
  create(@Body() createPersonalEventDto: CreatePersonalEventDto) {
    return this.personalEventsService.create(createPersonalEventDto);
  }

  @Get()
  findAll() {
    return this.personalEventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personalEventsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePersonalEventDto: UpdatePersonalEventDto) {
    return this.personalEventsService.update(+id, updatePersonalEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personalEventsService.remove(+id);
  }
}
