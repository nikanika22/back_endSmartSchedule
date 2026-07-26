import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { AvoidDaysDto } from './dto/avoid-days.dto';
import { AuditAction } from '../common/decorators/audit-action.decorator';

@ApiTags('Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy cấu hình sở thích và ngày tránh' })
  async getPreferences(@Request() req: any) {
    const student_id = req.user.student_id;
    try {
      const result = await this.preferencesService.getPreference(student_id);
      return { success: true, data: result };
    } catch (e: any) {
      // Nếu chưa có cấu hình thì trả về null/mặc định thay vì văng lỗi 404
      if (e.status === 404) {
        return { success: true, data: { preferred_slot: null, avoid_days: [] } };
      }
      throw e;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Chọn buổi học mong muốn của sinh viên' })
  @ApiBody({ type: UpdatePreferenceDto })
  @ApiResponse({ status: 201, description: 'Lưu sở thích thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @AuditAction('SAVE_PREFERENCES', 'preference')
  async setPreferredSlot(
    @Request() req: any,
    @Body() updatePreferenceDto: UpdatePreferenceDto,
  ) {
    const student_id = req.user.student_id;
    const result = await this.preferencesService.updatePreference(student_id, updatePreferenceDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('avoid-days')
  @ApiOperation({ summary: 'Thêm các ngày muốn tránh không xếp lịch học' })
  @ApiBody({ type: AvoidDaysDto })
  @ApiResponse({ status: 201, description: 'Thêm ngày tránh thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @AuditAction('SAVE_AVOID_DAYS', 'preference')
  async addAvoidDays(
    @Request() req: any,
    @Body() avoidDaysDto: AvoidDaysDto,
  ) {
    const student_id = req.user.student_id;
    const result = await this.preferencesService.addAvoidDays(student_id, avoidDaysDto);
    return {
      success: true,
      data: result,
    };
  }
}
