import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  app.enableCors({ origin: '*' });
  app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
  }),
  );
  app.use(express.static(join(process.cwd(), './files/')));
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

  await app.listen(port, () => {
    console.log(`🚀 App running on port ${port} in ${process.env.NODE_ENV} mode`);
  });
  
}
bootstrap();
