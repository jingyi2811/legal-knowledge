import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { WeaviateModule } from '../weaviate/weaviate.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [WeaviateModule, OpenAIModule],
  controllers: [QueryController],
})
export class QueryModule {}
