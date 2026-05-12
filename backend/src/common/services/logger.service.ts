import { LoggerService as NestLoggerService } from '@nestjs/common';

export class LoggerService implements NestLoggerService {
  log(message: string, context?: string) {
    console.log(`[${new Date().toISOString()}] [LOG] ${context ? `[${context}] ` : ''}${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${new Date().toISOString()}] [ERROR] ${context ? `[${context}] ` : ''}${message}`);
    if (trace) console.error(trace);
  }

  warn(message: string, context?: string) {
    console.warn(`[${new Date().toISOString()}] [WARN] ${context ? `[${context}] ` : ''}${message}`);
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${context ? `[${context}] ` : ''}${message}`);
    }
  }

  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] [VERBOSE] ${context ? `[${context}] ` : ''}${message}`);
    }
  }
}
