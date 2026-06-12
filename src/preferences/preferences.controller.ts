import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { AvoidDaysDto } from './dto/avoid-days.dto';

@ApiTags('Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Post()
  @ApiOperation({ summary: 'Chọn buổi học mong muốn của sinh viên' })
  @ApiBody({ type: UpdatePreferenceDto })
  @ApiResponse({ status: 201, description: 'Lưu sở thích thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
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
