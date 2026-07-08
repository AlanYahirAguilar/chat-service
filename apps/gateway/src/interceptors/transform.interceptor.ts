import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ApiResponse } from './dto/response.dto';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> | Promise<Observable<ApiResponse<T>>> {
    return next.handle().pipe(
      map((data) => {
        let statusCode = 200;
        if (context.getType() === 'http') {
          const response = context.switchToHttp().getResponse();
          statusCode = response ? response.statusCode : 200;
        }

        return {
          data,
          status: statusCode,
          message: 'Operación exitosa',
        };
      }),
    );
  }
}
