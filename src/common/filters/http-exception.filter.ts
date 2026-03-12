import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

  catch(exception: HttpException, host: ArgumentsHost): void {

    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();

    const exceptionResponse: unknown = exception.getResponse();

    let message = 'Internal Server Error';

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      message = String((exceptionResponse as { message: unknown }).message);
    }

    response.status(status).json({
      success: false,
      message,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}