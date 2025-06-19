import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configService } from './config/config.service';
import { ConfigService } from '@nestjs/config';
import { CustomGraphQLErrorFilter } from '@app/gqlerr';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: { origin: '*', credentials: true },
  });
  const config = app.get(ConfigService);
  app.use(cookieParser());
  app.useGlobalFilters(new CustomGraphQLErrorFilter());
  await app.listen(config.get('PORT') || configService.getPort());
}

if (process.env.VERCEL_ENV) {
  module.exports = bootstrap();
} else {
  bootstrap();
}
