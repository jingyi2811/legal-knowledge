import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeaviateModule } from './weaviate/weaviate.module';
import { OpenAIModule } from './openai/openai.module';
import { EmbeddingController } from './embedding/embedding.controller';
import { QueryModule } from './query/query.module';
import { AppController } from './app.controller';
import { EmbeddingModule } from './embedding/embedding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule global
      envFilePath: '.env', // Specify the .env file path
    }),
    WeaviateModule,
    OpenAIModule,
    QueryModule,
    EmbeddingModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
