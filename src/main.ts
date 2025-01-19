import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SecurityMiddleware } from './middlewares/security.middlewares';
import { configService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(new SecurityMiddleware().use);

  await app.listen(configService.getValue('PORT'));
}
bootstrap();
