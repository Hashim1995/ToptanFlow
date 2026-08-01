import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { NodeEnv } from '../../config/env.validation';
import { ApiErrorResponse } from '../interfaces/api-error-response.interface';

/**
 * Catches every exception thrown by any handler and converts it into the
 * single, consistent `ApiErrorResponse` shape (see that interface), so the
 * frontend always receives a predictable error contract to map to
 * Azerbaijani, user-facing content (docs/technical/system-architecture.md,
 * "Error Handling Boundary").
 *
 * Safety: a raw stack trace is never included in the HTTP response, in any
 * environment — it is only ever written to the server-side log. For an
 * unexpected (non-`HttpException`) failure, the response message itself is
 * generic in production (`NODE_ENV=production`) and never leaks internal
 * error/driver details to the client, per this task's explicit requirement.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode: number = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const internalServerErrorStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    if (!isHttpException || statusCode >= internalServerErrorStatus) {
      this.logger.error(
        `${request.method} ${request.originalUrl ?? request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body = this.buildBody(
      exception,
      isHttpException,
      statusCode,
      request.originalUrl ?? request.url,
    );

    response.status(statusCode).json(body);
  }

  private buildBody(
    exception: unknown,
    isHttpException: boolean,
    statusCode: number,
    path: string,
  ): ApiErrorResponse {
    const timestamp = new Date().toISOString();

    if (isHttpException) {
      const httpException = exception as HttpException;
      const exceptionResponse = httpException.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          statusCode,
          error: HttpStatus[statusCode] ?? 'Error',
          message: exceptionResponse,
          path,
          timestamp,
        };
      }

      const responseObject = exceptionResponse as {
        message?: string | string[];
        error?: string;
        code?: string;
        candidates?: unknown[];
      };
      const body: ApiErrorResponse = {
        statusCode,
        error: responseObject.error ?? HttpStatus[statusCode] ?? 'Error',
        message: responseObject.message ?? httpException.message,
        path,
        timestamp,
      };
      if (typeof responseObject.code === 'string') {
        body.code = responseObject.code;
      }
      if (Array.isArray(responseObject.candidates)) {
        body.candidates = responseObject.candidates;
      }
      return body;
    }

    // Never expose an unexpected error's internal message or stack trace to
    // the client in production; log full detail server-side instead.
    // Compared as a plain string (not the `NodeEnv` enum) because the value
    // read back from `ConfigService` is a plain string at runtime.
    const productionValue: string = NodeEnv.Production;
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const isProduction = nodeEnv === productionValue;
    const message =
      !isProduction && exception instanceof Error
        ? exception.message
        : 'An unexpected error occurred.';

    return {
      statusCode,
      error: 'Internal Server Error',
      message,
      path,
      timestamp,
    };
  }
}
