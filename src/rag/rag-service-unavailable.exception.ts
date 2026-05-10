import { HttpException, HttpStatus } from '@nestjs/common';

export class RagServiceUnavailableException extends HttpException {
  public constructor(message: string) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
