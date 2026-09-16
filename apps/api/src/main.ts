import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  await app.listen(process.env.PORT ?? 3001, process.env.HOST ?? '127.0.0.1');
}

bootstrap();
