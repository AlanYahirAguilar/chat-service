import { HttpException, HttpStatus } from '@nestjs/common';
import { stringConstants } from '@syncslot/shared';

export class NotFoundCustomException extends HttpException {
  constructor(resourceName: string, identifier?: string | number | bigint) {
    const key =
      `${resourceName.toLowerCase()}NotFound` as keyof typeof stringConstants;
    let message = stringConstants[key] || stringConstants.resourceNotFound;

    if (identifier) {
      message = `${message} con identificador [${identifier}]`;
    }

    super(message, HttpStatus.NOT_FOUND);
  }
}
