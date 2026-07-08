import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '@/interceptors/dto/response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      return;
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
      }
    } else if (exception && typeof exception === 'object') {
      const rpcError = (exception as any).error || exception;
      if (rpcError && typeof rpcError === 'object') {
        const parsedStatus = parseInt(rpcError.status || rpcError.statusCode, 10);
        if (!isNaN(parsedStatus) && parsedStatus >= 100 && parsedStatus <= 599) {
          status = parsedStatus;
        }
        message = rpcError.message || message;
      } else if (typeof rpcError === 'string') {
        message = rpcError;
        status = HttpStatus.BAD_REQUEST;
      }
    }

    const responseBody: ApiResponse<null> = {
      status,
      message,
      data: null,
    };

    response.status(status).json(responseBody);
  }
}
