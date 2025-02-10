import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configService } from './config/config.service';
import { ConfigService } from '@nestjs/config';
import { CustomGraphQLErrorFilter } from '@app/gqlerr';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: { origin: '*' },
  });
  const config = app.get(ConfigService);
  app.useGlobalFilters(new CustomGraphQLErrorFilter());
  await app.listen(config.get('PORT') || configService.getPort());
}

// Check if the environment is Vercel
if (process.env.VERCEL_ENV) {
  module.exports = bootstrap();
} else {
  bootstrap();
}
