import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerService } from './common/services/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });

  // ─── CORS: Single, robust middleware ───
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://pulsemind-ai-8ng1.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    if (origin) {
      const isAllowed = allowedOrigins.includes(origin) || 
                       origin.endsWith('.vercel.app') || 
                       origin.endsWith('.onrender.com');
      
      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cookie,Access-Control-Allow-Credentials',
    );
    res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(204).send();
    }
    next();
  });

  // ─── Security headers (after CORS middleware) ───
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: false,
    }),
  );
  app.use(cookieParser());

  // Removed redundant app.enableCors() to avoid header conflicts

  // ─── Global pipes ───
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global filters & interceptors ───
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ─── Swagger documentation ───
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PulseMind AI API')
    .setDescription('Enterprise Employee Feedback & Organizational Intelligence Platform')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & authorization')
    .addTag('feedback', 'Feedback submission & management')
    .addTag('complaints', 'Complaint routing & resolution')
    .addTag('analytics', 'AI-powered analytics & insights')
    .addTag('admin', 'Administration & configuration')
    .addTag('notifications', 'Real-time notifications')
    .addTag('chat', 'Real-time communication')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 PulseMind AI API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
