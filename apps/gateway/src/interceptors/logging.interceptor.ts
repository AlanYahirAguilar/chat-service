import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      const path = request?.path || 'UNKNOWN_PATH';
      const body = request?.body || {};

      this.logger.log(`${path} ${JSON.stringify(body)}`, 'REQUEST');
    }

    return next.handle().pipe(
      tap({
        error: (error) => {
          const controller = context.getClass().name;
          const method = context.getHandler().name;
          this.logger.error(
            `[${controller}_${method}] ${error.message}`,
            error.stack,
            'EXCEPTION',
          );
        },
      }),
    );
  }
}
