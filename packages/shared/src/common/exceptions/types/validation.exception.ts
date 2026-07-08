import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { stringConstants } from '../../../utils/string.constant';

export class ValidationException extends HttpException {
  constructor(errorKeyOrMessage: string, info?: string) {
    const key = errorKeyOrMessage as keyof typeof stringConstants;
    const message = stringConstants[key] || errorKeyOrMessage;

    if (info) {
      Logger.warn(info, 'VALIDATION');
    }

    super(message, HttpStatus.BAD_REQUEST);
  }
}
