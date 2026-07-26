import {
  UseInterceptors,
  UploadedFile,
  Post,
  UseGuards,
  Controller,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuditAction } from '../../common/decorators/audit-action.decorator';

import { RoleGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../students/entities/student.entity';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('courses')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Roles(UserRole.ADMIN)
  @Post('upload-courses')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @AuditAction('UPLOAD_COURSES', 'course')
  async importCoursesExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Không tìm thấy file excel',
        },
      });
    }
    return this.uploadService.importCoursesFromExcel(file.buffer);
  }

  @Roles(UserRole.ADMIN)
  @Post('upload-classes')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @AuditAction('UPLOAD_CLASSES', 'class')
  async importClassesExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Không tìm thấy file excel',
        },
      });
    }
    return this.uploadService.importClassesFromExcel(file.buffer);
  }
}
