import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from '@nestjs/common';
import { ClassesService } from '../classes/classes.service';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from '../guards/roles.guard';
import { UserRole } from '../students/entities/student.entity';
import { Roles } from '../decorators/roles.decorator';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('courses')
export class CoursesController {
    constructor(
        private readonly coursesService: CoursesService,
        private readonly classesService: ClassesService,
    ) {}

    @Roles(UserRole.ADMIN)
    @Post()
    create(@Body() createCourseDto: CreateCourseDto) {
        return this.coursesService.create(createCourseDto);
    }

    @Get()
    findAll() {
        return this.coursesService.findAll();
    }

    // Phải đặt TRƯỚC @Get(':id') để tránh route conflict
    @Roles(UserRole.ADMIN)
    @Get('quantity')
    getCourseQuantity() {
        return this.coursesService.getCourseQuantity();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.coursesService.findOne(id);
    }

    @Get(':id/classes')
    findClasses(@Param('id') id: string) {
        return this.classesService.findByCourse(id);
    }

    @Roles(UserRole.ADMIN)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateCourseDto: UpdateCourseDto,
    ) {
        return this.coursesService.update(id, updateCourseDto);
    }

    @Roles(UserRole.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.coursesService.remove(id);
    }

}
