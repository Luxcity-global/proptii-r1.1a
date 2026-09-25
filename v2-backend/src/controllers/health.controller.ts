import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@SkipThrottle()
@Controller(['health', 'ping'])
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check and ping endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'proptii-v2-backend',
    };
  }
}
