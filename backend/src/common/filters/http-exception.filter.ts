import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || message;
        errors = resp.errors || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // ─── Re-apply CORS headers on error responses ───
    // The Express CORS middleware fires before NestJS processes the request,
    // but error responses bypass NestJS and go straight through the filter.
    // Without re-applying here, browser CORS checks fail on 4xx/5xx errors.
    const origin = request.headers.origin;
    if (origin) {
      const allowedOrigins = [
        'https://pulsemind-ai-8ng1.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
      ];
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com');

      if (isAllowed) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Credentials', 'true');
        response.setHeader('Vary', 'Origin');
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      errors: Array.isArray(message) ? message : errors,
      timestamp: new Date().toISOString(),
    });
  }
}
