import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Health check para orquestadores (Railway, Docker, k8s).
 * Expuesto en GET /api/health — sin auth y sin rate-limit para que el
 * probe nunca sea rechazado.
 */
@Controller('health')
export class HealthController {
  @Get()
  @SkipThrottle()
  check() {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
