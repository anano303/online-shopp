import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import * as fs from 'fs';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  // Configure express middleware for larger file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.raw({ limit: '50mb' }));

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://www.13.online.ge',
        'https://13.online.ge',
        'https://myhunter-pj436.ondigitalocean.app',
        'http://localhost:3000',
        'https://localhost:3000',
        'http://localhost:4000',
        'https://localhost:4000',
        // Add development URLs that might be used
        'http://127.0.0.1:3000',
        'https://127.0.0.1:3000',
        'http://127.0.0.1:4000',
        'https://127.0.0.1:4000',
      ];

      // Allow requests with no origin (like mobile apps, curl requests)
      if (
        !origin ||
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.match(/localhost/) ||
        origin.includes('.vercel.app') ||
        origin.includes('.ondigitalocean.app') // Allow all DigitalOcean App Platform domains
      ) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'forum-id',
      'Origin',
      'Accept',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Add a simple health check at root BEFORE versioning
  app.use('/', (req, res, next) => {
    if (req.method === 'GET' && req.url === '/') {
      console.log('✅ Root health check accessed');
      return res.json({
        status: 'ok',
        message: 'ცამეტი API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        port: process.env.PORT || 4000,
        endpoints: {
          api: '/v1',
          docs: '/docs',
          health: '/',
        },
      });
    }
    next();
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use('/favicon.ico', (req, res) => res.status(204).send());

  // Setup static file serving for uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Make sure uploads directory exists
  const uploadsDir = join(__dirname, '..', 'uploads');
  const logosDir = join(uploadsDir, 'logos');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }

  const config = new DocumentBuilder()
    .setTitle('ცამეტი API')
    .setDescription('ცამეტი E-commerce REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/v1', 'API v1') // Add base path for API routes
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Swagger at /docs (no version prefix)

  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0'); // ვერსელისთვის საჭიროა '0.0.0.0'

  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
