import { Module } from '@nestjs/common';
import { EmbeddingController } from './embedding.controller';
import { WeaviateModule } from '../weaviate/weaviate.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [WeaviateModule, OpenAIModule],
  controllers: [EmbeddingController],
})
export class EmbeddingModule {}
