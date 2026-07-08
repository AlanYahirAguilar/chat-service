import { HttpException, Logger } from '@nestjs/common';
import { NotFoundCustomException } from '../types/notFound.exception';
import { SqlException } from '../types/sql.exception';
import { ValidationException } from '../types/validation.exception';

export class HandleException {
  static exception(exception: any): never {
    Logger.error(exception);
    if (
      exception instanceof HttpException ||
      exception instanceof ValidationException ||
      exception instanceof NotFoundCustomException
    ) {
      throw exception;
    }
    throw new SqlException(exception);
  }
}
