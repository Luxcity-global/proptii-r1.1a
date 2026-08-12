import { Controller, Get } from '@nestjs/common';

@Controller(['health', 'ping'])
export class HealthController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'proptii-v2-backend',
    };
  }
}
