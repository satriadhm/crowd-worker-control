import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SecurityMiddleware } from './middlewares/security.middlewares';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(new SecurityMiddleware().use);

  await app.listen(3000);
}
bootstrap();
