import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../students/entities/student.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('classes')
export class ClassesController {
    constructor(private readonly classesService: ClassesService) {}

    @Roles(UserRole.ADMIN)
    @Post()
    create(@Body() createClassDto: CreateClassDto) {
        return this.classesService.create(createClassDto);
    }

    @Get()
    findAll() {
        return this.classesService.findAll();
    }

    // Phải đặt TRƯỚC @Get(':id') để tránh route conflict
    @Roles(UserRole.ADMIN)
    @Get('quantity')
    getClassQuantity() {
        return this.classesService.getClassQuantity();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.classesService.findOne(id);
    }

    @Roles(UserRole.ADMIN)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateClassDto: UpdateClassDto,
    ) {
        return this.classesService.update(id, updateClassDto);
    }

    @Roles(UserRole.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.classesService.remove(id);
    }
}
