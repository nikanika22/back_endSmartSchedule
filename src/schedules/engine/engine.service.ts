import { Injectable, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const ENGINE_URL = process.env.ENGINE_URL ?? 'http://127.0.0.1:8000';

@Injectable()
export class EngineService {
  constructor(private readonly httpService: HttpService) {}

  async detectConflicts(body: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${ENGINE_URL}/schedules/conflicts`, body),
      );
      return response.data;
    } catch (error: any) {
      this.handleEngineError(error);
    }
  }

  async generateSchedules(body: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${ENGINE_URL}/schedules/generate`, body),
      );
      return response.data;
    } catch (error: any) {
      this.handleEngineError(error);
    }
  }

  private handleEngineError(error: any) {
    if (error.response) {
      console.error('FastAPI error response data:', JSON.stringify(error.response.data, null, 2));
      throw new BadGatewayException({
        success: false,
        error: {
          code: 'ENGINE_ERROR',
          message: error.response.data.detail || 'Lỗi từ hệ thống sinh thời khóa biểu.',
        },
      });
    }
    
    console.error('FastAPI network error:', error.message);
    throw new BadGatewayException({
      success: false,
      error: {
        code: 'ENGINE_UNAVAILABLE',
        message: 'Hệ thống sinh thời khóa biểu hiện không phản hồi.',
      },
    });
  }
}
