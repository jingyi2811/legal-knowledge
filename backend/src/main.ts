import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for cross-origin requests
  await app.listen(4000);

  const shutdown = async () => {
    console.log('🛑 Gracefully shutting down...');
    await app.close();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('beforeExit', shutdown); // <== important for reload
}

bootstrap();
